const BrevoEndpoint = "https://api.brevo.com/v3/contacts";
const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const configuredListIds = (env, keys) =>
  [...new Set([...keys, "BREVO_ALL_FORMS_LIST_ID"]
    .map((key) => Number(env[key]))
    .filter((id) => Number.isInteger(id) && id > 0))];

const resultLabel = (result) => `${result.status}${result.code ? `(${result.code})` : ""}`;
const recipients = (value) => [...new Set(String(value || "robert.luo@woafmeow.com")
  .split(/[;,]/)
  .map((email) => email.trim().toLowerCase())
  .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))];

export async function sendBrevoEmail({ env, to, subject, htmlContent, recipientName = "", attachments = [], senderEmail = "" }) {
  const apiKey = env.BREVO_API_KEY;
  const fromEmail = String(senderEmail || env.BREVO_SENDER_EMAIL || "").trim().toLowerCase();
  const recipientEmail = String(to || "").trim().toLowerCase();
  if (!apiKey) return { status: "skipped", code: "missing_api_key" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) return { status: "skipped", code: "missing_sender_email" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) return { status: "failed", code: "invalid_recipient" };
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "content-type": "application/json", "api-key": apiKey },
      body: JSON.stringify({
        sender: { email: fromEmail, name: "WoafMeow" },
        to: [{ email: recipientEmail, ...(recipientName ? { name: recipientName } : {}) }],
        subject,
        htmlContent,
        ...(attachments.length ? { attachment: attachments } : {}),
      }),
    });
    return { status: response.ok ? "sent" : "failed", code: String(response.status) };
  } catch {
    return { status: "failed", code: "network_error" };
  }
}

export async function syncBrevoContact({
  env,
  db,
  email,
  firstName = "",
  attributes = {},
  eventType,
  eventProperties = {},
  notificationProperties = {},
  listKeys = [],
  sendOwnerNotification = true,
}) {
  const apiKey = env.BREVO_API_KEY;
  const normalizedEventType = String(eventType || "website_submission").toLowerCase().replace(/[^a-z0-9_-]+/g, "_").slice(0, 255);
  const contact = { status: "skipped", code: "missing_api_key" };
  const event = { status: "skipped", code: "missing_api_key" };
  const notification = { status: "skipped", code: "missing_api_key" };

  if (apiKey) {
    const contactAttributes = { ...(firstName ? { FNAME: firstName } : {}), ...attributes };
    try {
      const response = await fetch(BrevoEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json", "api-key": apiKey },
        body: JSON.stringify({
          email,
          ...(Object.keys(contactAttributes).length ? { attributes: contactAttributes } : {}),
          listIds: configuredListIds(env, listKeys),
          updateEnabled: true,
        }),
      });
      contact.status = response.ok ? "sent" : "failed";
      contact.code = String(response.status);
    } catch {
      contact.status = "failed";
      contact.code = "network_error";
    }

    if (eventType) {
      try {
        const eventResponse = await fetch("https://api.brevo.com/v3/events", {
          method: "POST",
          headers: { "content-type": "application/json", "api-key": apiKey },
          body: JSON.stringify({
            event_name: normalizedEventType,
            identifiers: { email_id: email },
            contact_properties: Object.keys(contactAttributes).length ? contactAttributes : undefined,
            event_properties: eventProperties,
          }),
        });
        event.status = eventResponse.ok ? "sent" : "failed";
        event.code = String(eventResponse.status);
      } catch {
        event.status = "failed";
        event.code = "network_error";
      }
    }

    if (eventType && !sendOwnerNotification) {
      notification.status = "skipped";
      notification.code = "suppressed";
    } else if (eventType && env.BREVO_SENDER_EMAIL) {
      const to = recipients(env.FORM_NOTIFICATION_EMAIL).map((recipient) => ({ email: recipient }));
      if (!to.length) {
        notification.status = "skipped";
        notification.code = "missing_recipient";
      } else {
        const rows = Object.entries(notificationProperties || {})
          .slice(0, 24)
          .map(([key, value]) => `<tr><th align="left" style="padding:6px 12px 6px 0">${escapeHtml(key)}</th><td style="padding:6px 0">${escapeHtml(typeof value === "object" ? JSON.stringify(value) : value)}</td></tr>`)
          .join("");
        try {
          const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: { "content-type": "application/json", "api-key": apiKey },
            body: JSON.stringify({
              sender: { email: env.BREVO_SENDER_EMAIL, name: "WoafMeow Forms" },
              to,
              subject: `WoafMeow: ${String(eventType).replaceAll("_", " ")}`,
              htmlContent: `<h2>New WoafMeow submission</h2><p><strong>Type:</strong> ${escapeHtml(eventType)}</p><p><strong>Contact:</strong> ${escapeHtml(email)}</p>${rows ? `<table>${rows}</table>` : "<p>Open the private operations dashboard for details.</p>"}`,
            }),
          });
          notification.status = response.ok ? "sent" : "failed";
          notification.code = String(response.status);
        } catch {
          notification.status = "failed";
          notification.code = "network_error";
        }
      }
    } else if (eventType) {
      notification.status = "skipped";
      notification.code = "missing_sender_email";
    }
  }

  const requiredResults = [contact, ...(eventType ? [event, ...(sendOwnerNotification ? [notification] : [])] : [])];
  const status = requiredResults.every((result) => result.status === "sent")
    ? "synced"
    : requiredResults.some((result) => result.status === "sent")
      ? "partial"
      : requiredResults.some((result) => result.status === "failed")
        ? "failed"
        : "skipped";
  const detail = `contact=${resultLabel(contact)}; event=${resultLabel(event)}; owner_notification=${resultLabel(notification)}`;

  try {
    await db
      .prepare("INSERT INTO form_sync_log (id, email, event_type, provider, status, detail, created_at) VALUES (?1, ?2, ?3, 'brevo', ?4, ?5, ?6)")
      .bind(crypto.randomUUID(), email, normalizedEventType, status, detail, new Date().toISOString())
      .run();
  } catch {
    return { status, detail: `${detail}; log=failed`, contact: contact.status, event: event.status, notification: notification.status };
  }

  return { status, detail, contact: contact.status, event: event.status, notification: notification.status };
}

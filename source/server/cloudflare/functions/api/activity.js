import { syncBrevoContact } from "../_lib/brevo.js";

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
const allowedEvents = new Set([
  "care_account_created",
  "care_account_updated",
  "public_care_lesson_created",
  "private_care_lesson_created",
  "public_care_lesson_deleted",
  "care_circle_reaction_added",
  "care_circle_reaction_removed",
  "care_circle_comment_added",
  "health_record_saved",
  "health_timeline_change_saved",
  "health_timeline_entry_removed",
  "veterinary_email_draft_created",
  "health_timeline_shared",
  "notification_test",
]);

const eventLabels = {
  care_account_created: "New account created",
  care_account_updated: "Account updated",
  public_care_lesson_created: "Public Care Lesson created",
  private_care_lesson_created: "Private Care Lesson created",
  public_care_lesson_deleted: "Public Care Lesson deleted",
  care_circle_reaction_added: "Care Circle reaction added",
  care_circle_reaction_removed: "Care Circle reaction removed",
  care_circle_comment_added: "Care Circle comment added",
  health_record_saved: "Health record saved",
  health_timeline_change_saved: "Health Timeline change saved",
  health_timeline_entry_removed: "Health Timeline entry removed",
  veterinary_email_draft_created: "Veterinary email draft created",
  health_timeline_shared: "Health Timeline shared",
  notification_test: "Owner notification test",
};

const cleanProperties = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 16)
      .filter(([, property]) => ["string", "number", "boolean"].includes(typeof property))
      .map(([key, property]) => [
        cleanText(key, 60).toLowerCase().replace(/[^a-z0-9_-]+/g, "_"),
        cleanText(property, 300),
      ])
      .filter(([key, property]) => key && property),
  );
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: "POST, OPTIONS" } });
}

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "We could not read that website action." }, 400);
  }

  const eventType = cleanText(body.eventType, 80).toLowerCase().replace(/[^a-z0-9_-]+/g, "_");
  const email = cleanText(body.email, 254).toLowerCase();
  const ownerName = cleanText(body.ownerName, 80);
  const petName = cleanText(body.petName, 80);
  if (!allowedEvents.has(eventType)) return json({ error: "That website action is not available." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "A valid account email is required." }, 422);

  const properties = cleanProperties(body.properties);
  const label = eventLabels[eventType] || "Website action";
  try {
    const sync = await syncBrevoContact({
      env: context.env,
      db: context.env.WAITLIST_DB,
      email,
      firstName: ownerName,
      eventType,
      notificationSubject: `WoafMeow: ${label}${petName ? ` — ${petName}` : ""}`,
      eventProperties: { ...properties, ...(petName ? { pet_name: petName } : {}) },
      notificationProperties: { action: label, ...(petName ? { pet_name: petName } : {}), ...properties },
      listKeys: ["BREVO_CARE_CIRCLE_LIST_ID"],
    });
    if (sync.notification !== "sent") {
      return json({ error: "The owner notification was not sent.", notification: sync.notification }, 503);
    }
    return json({ message: "Owner notification sent.", notification: "sent" }, 201);
  } catch {
    return json({ error: "The owner notification was not sent.", notification: "failed" }, 503);
  }
}

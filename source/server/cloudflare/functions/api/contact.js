import { syncBrevoContact } from "../_lib/brevo.js";

const allowedOrigins = new Set([
  "https://labian1.github.io",
  "https://woafmeow.com",
  "https://www.woafmeow.com",
]);

const corsHeaders = (request) => {
  const origin = request?.headers?.get("origin") || "";
  const localOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return {
    ...(allowedOrigins.has(origin) || localOrigin
      ? { "access-control-allow-origin": origin }
      : {}),
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
};

const json = (payload, status = 200, request) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...corsHeaders(request),
    },
  });

const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validTopics = new Set(["account", "care-circle", "directory", "professional-listing", "wednesday-match", "memorial-tree", "other"]);

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: { allow: "POST, OPTIONS", ...corsHeaders(context.request) },
  });
}

export async function onRequestPost(context) {
  const respond = (payload, status = 200) => json(payload, status, context.request);
  if (!(context.request.headers.get("content-type") || "").includes("application/json")) {
    return respond({ error: "Use a JSON request." }, 415);
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return respond({ error: "We could not read that message." }, 400);
  }

  const topic = cleanText(body.topic, 60);
  const name = cleanText(body.name, 100) || (topic === "wednesday-match" ? "" : "Website visitor");
  const email = cleanText(body.email, 254).toLowerCase();
  const message = cleanText(body.message, 1500);
  const consent = body.consent === true;
  if (!name) return respond({ error: "Add your name." }, 400);
  if (!validEmail(email)) return respond({ error: "Enter a valid email address." }, 400);
  if (!validTopics.has(topic)) return respond({ error: "Choose what you need help with." }, 400);
  if (message.length < 12) return respond({ error: "Add enough detail for us to understand the problem." }, 400);
  if (!consent) return respond({ error: "Confirm that WoafMeow may answer your request." }, 400);

  let storedMessage = message;
  let requestId = "";
  if (topic === "wednesday-match") {
    const zip = cleanText(body.zip, 20);
    const dogAge = cleanText(body.dogAge, 40);
    const issue = cleanText(body.issue, 120);
    const availability = cleanText(body.availability, 80);
    const firstContact = cleanText(body.contact, 100);
    const matchGoal = cleanText(body.matchGoal, 140);
    requestId = cleanText(body.requestId, 80) || `WM-${Date.now().toString(36).toUpperCase()}`;
    if (!zip) return respond({ error: "Add your ZIP or postal code." }, 400);
    if (!dogAge || !issue || !availability || !firstContact || !matchGoal) {
      return respond({ error: "Complete each introduction preference so we can consider a safe, useful match." }, 400);
    }
    storedMessage = [
      `Request: ${requestId}`,
      `ZIP/postal code: ${zip}`,
      `Dog age: ${dogAge}`,
      `Care issue: ${issue}`,
      `Availability: ${availability}`,
      `Preferred first contact: ${firstContact}`,
      `Useful match: ${matchGoal}`,
      `Conversation goal: ${message}`,
    ].join("\n");
  }

  const now = new Date().toISOString();
  let teamNotification = "skipped";
  try {
    const db = context.env.WAITLIST_DB;
    await db.prepare("INSERT INTO contact_messages (id, name, email, topic, message, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, 'new', ?6, ?6)")
      .bind(crypto.randomUUID(), name, email, topic, storedMessage, now)
      .run();
    const sync = await syncBrevoContact({
      env: context.env,
      db,
      email,
      firstName: name.split(" ")[0] || "",
      eventType: topic === "wednesday-match" ? "wednesday_meetup_request" : "contact_message",
      eventProperties: { topic, ...(requestId ? { request_id: requestId } : {}) },
      notificationSubject: topic === "wednesday-match"
        ? `WoafMeow: Wednesday meetup request — ${name} — ${cleanText(body.zip, 20)}`
        : `WoafMeow: Contact form — ${name}`,
      notificationProperties: topic === "wednesday-match"
        ? {
            name,
            request_id: requestId,
            zip_or_postal_code: cleanText(body.zip, 20),
            dog_age: cleanText(body.dogAge, 40),
            care_issue: cleanText(body.issue, 120),
            availability: cleanText(body.availability, 80),
            preferred_first_contact: cleanText(body.contact, 100),
            useful_match: cleanText(body.matchGoal, 140),
          }
        : { name, topic },
      listKeys: ["BREVO_WEBSITE_LIST_ID"],
    });
    teamNotification = sync.notification;
  } catch {
    return respond({ error: "We could not save that message right now. Please try again." }, 503);
  }

  if (topic === "wednesday-match") {
    return respond({
      message: "Your introduction request is saved. Our team will email you if a suitable match is ready for both people to review.",
      requestId,
      teamNotification,
    }, 201);
  }
  return respond({ message: "Your message is saved for the WoafMeow team.", teamNotification }, 201);
}

import { syncBrevoContact } from "../_lib/brevo.js";

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validTopics = new Set(["account", "care-circle", "directory", "professional-listing", "wednesday-match", "memorial-tree", "other"]);

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: "POST, OPTIONS" } });
}

export async function onRequestPost(context) {
  if (!(context.request.headers.get("content-type") || "").includes("application/json")) {
    return json({ error: "Use a JSON request." }, 415);
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "We could not read that message." }, 400);
  }

  const name = cleanText(body.name, 100);
  const email = cleanText(body.email, 254).toLowerCase();
  const topic = cleanText(body.topic, 60);
  const message = cleanText(body.message, 1500);
  const consent = body.consent === true;
  if (!name) return json({ error: "Add your name." }, 400);
  if (!validEmail(email)) return json({ error: "Enter a valid email address." }, 400);
  if (!validTopics.has(topic)) return json({ error: "Choose what you need help with." }, 400);
  if (message.length < 12) return json({ error: "Add enough detail for us to understand the problem." }, 400);
  if (!consent) return json({ error: "Confirm that WoafMeow may answer your request." }, 400);

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
    if (!zip) return json({ error: "Add your ZIP or postal code." }, 400);
    if (!dogAge || !issue || !availability || !firstContact || !matchGoal) {
      return json({ error: "Complete each introduction preference so we can consider a safe, useful match." }, 400);
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
  try {
    const db = context.env.WAITLIST_DB;
    await db.prepare("INSERT INTO contact_messages (id, name, email, topic, message, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, 'new', ?6, ?6)")
      .bind(crypto.randomUUID(), name, email, topic, storedMessage, now)
      .run();
    await syncBrevoContact({
      env: context.env,
      db,
      email,
      firstName: name.split(" ")[0] || "",
      eventType: "contact_message",
      eventProperties: { topic, ...(requestId ? { request_id: requestId } : {}) },
      notificationProperties: { name, topic, ...(requestId ? { requestId } : {}) },
      listKeys: ["BREVO_WEBSITE_LIST_ID"],
    });
  } catch {
    return json({ error: "We could not save that message right now. Please try again." }, 503);
  }

  if (topic === "wednesday-match") {
    return json({
      message: "Your introduction request is saved. Our team will email you if a suitable match is ready for both people to review.",
      requestId,
    }, 201);
  }
  return json({ message: "Your message is with the WoafMeow team." }, 201);
}

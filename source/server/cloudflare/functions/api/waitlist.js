import { syncBrevoContact } from "../_lib/brevo.js";

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: "POST, OPTIONS" } });
}

export async function onRequestPost(context) {
  const contentType = context.request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return json({ error: "Use a JSON request." }, 415);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "We could not read that sign-up." }, 400);
  }

  const email = cleanText(body.email, 254).toLowerCase();
  const concern = cleanText(body.concern, 500);
  const consent = body.consent === true;
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!emailLooksValid) return json({ error: "Enter a valid email address." }, 400);
  if (!consent) return json({ error: "Please confirm that we can send webinar and care updates." }, 400);

  const now = new Date().toISOString();
  try {
    const db = context.env.WAITLIST_DB;
    await db.prepare(
      `INSERT INTO webinar_waitlist (email, concern, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(email) DO UPDATE SET concern = excluded.concern, updated_at = excluded.updated_at`
    )
      .bind(email, concern || null, now, now)
      .run();
    await syncBrevoContact({
      env: context.env,
      db,
      email,
      eventType: "webinar_waitlist",
      listKeys: ["BREVO_WEBINAR_LIST_ID"],
    });
  } catch {
    return json({ error: "We could not save your place right now. Please try again." }, 503);
  }

  return json({ message: "You are on the priority waitlist. We will send the confirmed date, speaker details and preparation sheet first." });
}

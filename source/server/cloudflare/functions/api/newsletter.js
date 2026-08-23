import { sendBrevoEmail, syncBrevoContact } from "../_lib/brevo.js";

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

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
    return json({ error: "We could not read that newsletter signup." }, 400);
  }

  const email = cleanText(body.email, 254).toLowerCase();
  const guideUrl = "https://labian1.github.io/guide/";
  if (!validEmail(email)) return json({ error: "Enter a valid email address." }, 400);
  if (body.consent !== true) return json({ error: "Please confirm that you want the weekly care note." }, 400);

  const now = new Date().toISOString();
  try {
    const db = context.env.WAITLIST_DB;
    await db
      .prepare("INSERT INTO newsletter_signups (id, email, consent_at, created_at, updated_at) VALUES (?1, ?2, ?3, ?3, ?3) ON CONFLICT(email) DO UPDATE SET consent_at = excluded.consent_at, updated_at = excluded.updated_at")
      .bind(crypto.randomUUID(), email, now)
      .run();
    await syncBrevoContact({ env: context.env, db, email, eventType: "senior_dog_guide_requested", listKeys: ["BREVO_NEWSLETTER_LIST_ID"] });
    const delivery = await sendBrevoEmail({
      env: context.env,
      to: email,
      subject: "Your complete Senior Dog Care Guide",
      htmlContent: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#2c2521"><h1 style="color:#17382d">Your Senior Dog Care Guide</h1><p>Use this guide to turn a change you noticed into a clearer next step.</p><ul><li>Movement and stiffness</li><li>Sleep and nighttime changes</li><li>Eating, drinking and bathroom changes</li><li>Daily life, comfort and call-sooner signs</li></ul><p><a href="${guideUrl}" style="display:inline-block;padding:14px 20px;background:#a44b2a;color:#fff;text-decoration:none;border-radius:6px">Open the complete guide</a></p><p>WoafMeow provides educational guidance. Sudden or severe signs need veterinary care.</p></div>`,
    });
    if (delivery.status !== "sent") return json({ error: "We saved your address but could not deliver the guide. Please try again." }, 503);
  } catch {
    return json({ error: "We could not save your newsletter signup right now. Please try again." }, 503);
  }

  return json({ message: "The complete Senior Dog Care Guide has been emailed to you." });
}

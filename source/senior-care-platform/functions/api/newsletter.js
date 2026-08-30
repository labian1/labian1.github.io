import { sendBrevoEmail, syncBrevoContact } from "../_lib/brevo.js";

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
const GUIDE_URL = "https://woafypet-senior-care-8kt.pages.dev/assets/WoafMeow_Senior_Dog_Care_Field_Guide.pdf";
const GUIDE_NAME = "WoafMeow_Senior_Dog_Care_Field_Guide.pdf";
const GUIDE_SENDER = "hello@woafmeow.com";
const GUIDE_SUBJECT = "Your 2026 Senior Dog Care Field Guide | WoafMeow";
const MAX_GUIDE_BYTES = 10 * 1024 * 1024;

const toBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 24_576;
  let result = "";
  for (let index = 0; index < bytes.length; index += chunkSize) {
    result += btoa(String.fromCharCode(...bytes.subarray(index, index + chunkSize)));
  }
  return result;
};

const guideEmailBody = (marketingConsent) => `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#302724;line-height:1.6">
  <p style="font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#b64f31;font-weight:700">WoafMeow Senior Dog Care</p>
  <h1 style="font-family:Georgia,serif;color:#1f4b3d;font-size:34px;line-height:1.15;margin:12px 0 20px">Your Senior Dog Care Field Guide is attached.</h1>
  <p>Thank you for trusting us with a small part of your dog's care.</p>
  <p>WoafMeow helps dog parents notice everyday changes sooner, understand what may matter, and prepare clearer conversations with their veterinarian. Our community of 10,000+ pet owners is built around one belief: no one should have to navigate a senior dog's changes alone.</p>
  <p>The attached 70-page field guide covers mobility, sleep, appetite, weight, bathroom habits, comfort, and the warning signs that deserve a faster veterinary call. Keep it nearby, mark what you notice, and bring those notes to your dog's care team.</p>
  <p>${marketingConsent ? "You also asked to hear from us. We will keep future notes useful, caring, and focused on helping you make clearer care decisions." : "This message delivers the guide you requested. We will not add you to future updates unless you choose that separately."}</p>
  <div style="background:#f6efe8;border-radius:10px;padding:18px 20px;margin:24px 0">
    <p style="margin:0 0 8px;font-weight:700;color:#1f4b3d">If weight, mobility, or a chronic condition is making rest harder</p>
    <p style="margin:0 0 12px">See how the WoafyPet orthopedic bed and Smart Base are being designed to support aging joints and help owners follow meaningful rest, movement, bed-use, and weight changes.</p>
    <a href="https://www.woafy.pet/" style="display:inline-block;padding:12px 18px;background:#b64f31;color:#fff;text-decoration:none;border-radius:6px;font-weight:700">Explore the WoafyPet Bed + Smart Base</a>
  </div>
  <p style="font-size:14px;color:#6d625d">WoafMeow offers educational support, not diagnosis or treatment. Contact your veterinarian promptly for sudden, severe, or worsening changes.</p>
  <p>With care,<br><strong>The WoafMeow team</strong><br><a href="mailto:${GUIDE_SENDER}" style="color:#b64f31">${GUIDE_SENDER}</a></p>
</div>`;

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: { allow: "POST, OPTIONS", ...corsHeaders(context.request) },
  });
}

export async function onRequestPost(context) {
  if (!(context.request.headers.get("content-type") || "").includes("application/json")) {
    return json({ error: "Use a JSON request." }, 415, context.request);
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "We could not read that newsletter signup." }, 400, context.request);
  }

  const email = cleanText(body.email, 254).toLowerCase();
  const marketingConsent = body.marketingConsent === true;
  if (!validEmail(email)) return json({ error: "Enter a valid email address." }, 400, context.request);
  if (body.guideConsent !== true) return json({ error: "Please confirm that you want us to email the guide." }, 400, context.request);

  let updates = marketingConsent ? "pending" : "not_requested";
  if (marketingConsent) {
    const now = new Date().toISOString();
    try {
      const db = context.env.WAITLIST_DB;
      await db
        .prepare("INSERT INTO newsletter_signups (id, email, consent_at, created_at, updated_at) VALUES (?1, ?2, ?3, ?3, ?3) ON CONFLICT(email) DO UPDATE SET consent_at = excluded.consent_at, updated_at = excluded.updated_at")
        .bind(crypto.randomUUID(), email, now)
        .run();
      const sync = await syncBrevoContact({
        env: context.env,
        db,
        email,
        eventType: "senior_dog_guide_updates_requested",
        listKeys: ["BREVO_NEWSLETTER_LIST_ID"],
        sendOwnerNotification: false,
      });
      updates = sync.status === "synced" ? "subscribed" : "not_saved";
    } catch {
      updates = "not_saved";
    }
  }

  let guideFile;
  try {
    const response = await fetch(GUIDE_URL, { cf: { cacheTtl: 3_600, cacheEverything: true } });
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (!response.ok || (contentLength && contentLength > MAX_GUIDE_BYTES)) throw new Error("guide_unavailable");
    const buffer = await response.arrayBuffer();
    if (!buffer.byteLength || buffer.byteLength > MAX_GUIDE_BYTES) throw new Error("guide_invalid");
    guideFile = { content: toBase64(buffer), name: GUIDE_NAME };
  } catch {
    return json({
      message: "The email was not sent. Download the complete guide now.",
      delivery: "fallback",
      guideUrl: GUIDE_URL,
      updates,
    }, 202, context.request);
  }

  const delivery = await sendBrevoEmail({
    env: context.env,
    to: email,
    subject: GUIDE_SUBJECT,
    htmlContent: guideEmailBody(marketingConsent),
    attachments: [guideFile],
    senderEmail: GUIDE_SENDER,
  });
  if (delivery.status !== "sent") {
    return json({
      message: "The email was not sent. Download the complete guide now.",
      delivery: "fallback",
      guideUrl: GUIDE_URL,
      updates,
    }, 202, context.request);
  }

  return json({
    message: updates === "not_saved"
      ? `The guide was emailed from ${GUIDE_SENDER}. We could not save your optional update request, so please try that again later.`
      : `The complete guide was emailed from ${GUIDE_SENDER}.`,
    delivery: "sent",
    sender: GUIDE_SENDER,
    subject: GUIDE_SUBJECT,
    attachment: GUIDE_NAME,
    updates,
  }, 200, context.request);
}

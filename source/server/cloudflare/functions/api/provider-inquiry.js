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
const validRequestTypes = new Set(["directory-listing", "session-contributor", "guide-reviewer", "family-resource", "memorial-supplier"]);

const validWebsite = (value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: { allow: "POST, OPTIONS", ...corsHeaders(context.request) },
  });
}

export async function onRequestPost(context) {
  const respond = (payload, status = 200) => json(payload, status, context.request);
  const contentType = context.request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return respond({ error: "Use a JSON request." }, 415);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return respond({ error: "We could not read that listing request." }, 400);
  }

  const organization = cleanText(body.organization, 180);
  const contactName = cleanText(body.contactName, 100);
  const email = cleanText(body.email, 254).toLowerCase();
  const requestType = cleanText(body.requestType, 80) || "directory-listing";
  const website = cleanText(body.website, 500);
  const serviceType = cleanText(body.serviceType, 120);
  const coverage = cleanText(body.coverage, 200);
  const message = cleanText(body.message, 1000);
  const consent = body.consent === true;

  if (!organization || !contactName || !serviceType || !coverage) return respond({ error: "Add the organization, contact name, care area, and service area." }, 400);
  if (!validEmail(email)) return respond({ error: "Enter a valid work email address." }, 400);
  if (!validRequestTypes.has(requestType)) return respond({ error: "Choose how you would like to take part." }, 400);
  if (!validWebsite(website)) return respond({ error: "Enter a complete official website address, including https://." }, 400);
  if (!consent) return respond({ error: "Confirm that we may contact you about this request." }, 400);

  const now = new Date().toISOString();
  let teamNotification = "skipped";
  try {
    const db = context.env.WAITLIST_DB;
    await db
      .prepare("INSERT INTO provider_inquiries (id, organization, contact_name, email, request_type, website, service_type, coverage, message, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'received', ?10, ?10)")
      .bind(crypto.randomUUID(), organization, contactName, email, requestType, website || null, serviceType, coverage, message || null, now)
      .run();
    const sync = await syncBrevoContact({
      env: context.env,
      db,
      email,
      firstName: contactName.split(" ")[0] || "",
      eventType: "provider_listing_request",
      notificationSubject: `WoafMeow: Practice listing request — ${organization}`,
      eventProperties: { organization, request_type: requestType, website, service_type: serviceType, coverage },
      notificationProperties: { organization, contact_name: contactName, request_type: requestType, service_type: serviceType, coverage },
      listKeys: ["BREVO_PROVIDER_LIST_ID"],
    });
    teamNotification = sync.notification;
  } catch {
    return respond({ error: "We could not save that request right now. Please try again." }, 503);
  }

  return respond({ message: "Your request is saved. We will review the official information before contacting you about the next step.", teamNotification });
}

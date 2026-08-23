import { syncBrevoContact } from "../_lib/brevo.js";

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const collectionSlugs = new Set(["living-tributes", "framed-memories", "personal-keepsakes", "vessels-and-urns", "memorial-trees", "picture-frames", "personalized-gifts", "urns", "engraved-jewelry", "3d-keepsakes", "plush-replicas", "aging-pet-services"]);
const petSpecies = new Set(["dog", "cat", "both", "prefer-not-to-say"]);
const timings = new Set(["planning-ahead", "aftercare", "remembering", "gift"]);

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
    return json({ error: "We could not read that remembrance request." }, 400);
  }

  const email = cleanText(body.email, 254).toLowerCase();
  const firstName = cleanText(body.firstName, 80);
  const collection = cleanText(body.collection, 80);
  const species = cleanText(body.petSpecies, 40);
  const timing = cleanText(body.timing, 80);
  const pageContext = cleanText(body.pageContext, 180);
  const note = cleanText(body.note, 700);
  const consent = body.consent === true;

  if (!validEmail(email)) return json({ error: "Enter a valid email address." }, 400);
  if (!collectionSlugs.has(collection)) return json({ error: "Choose the remembrance direction that fits best." }, 400);
  if (!petSpecies.has(species)) return json({ error: "Choose who this is for." }, 400);
  if (!timings.has(timing)) return json({ error: "Choose the moment you are in." }, 400);
  if (!consent) return json({ error: "Please confirm that we may email you about this collection." }, 400);

  const now = new Date().toISOString();
  try {
    const db = context.env.WAITLIST_DB;
    await db
      .prepare("INSERT INTO memorial_collection_interest (id, email, first_name, collection_slug, pet_species, timing, page_context, note, consent_at, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9, ?9) ON CONFLICT(email, collection_slug) DO UPDATE SET first_name = excluded.first_name, pet_species = excluded.pet_species, timing = excluded.timing, page_context = excluded.page_context, note = excluded.note, consent_at = excluded.consent_at, updated_at = excluded.updated_at")
      .bind(crypto.randomUUID(), email, firstName || null, collection, species, timing, pageContext || null, note || null, now)
      .run();
    await syncBrevoContact({
      env: context.env,
      db,
      email,
      firstName,
      eventType: "memorial_collection_interest",
      eventProperties: { collection, pet_species: species, timing, page_context: pageContext },
      notificationProperties: { first_name: firstName, collection, pet_species: species, timing, page_context: pageContext },
      listKeys: ["BREVO_MEMORIAL_LIST_ID"],
    });
  } catch {
    return json({ error: "We could not save that request right now. Please try again." }, 503);
  }

  return json({ message: "Thank you. We will contact you when this collection has a real product and clear next steps." });
}

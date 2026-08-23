import { syncBrevoContact } from "../_lib/brevo.js";

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validSpecies = new Set(["dog", "cat", "both"]);

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
    return json({ error: "We could not read that session request." }, 400);
  }

  const firstName = cleanText(body.firstName, 80);
  const email = cleanText(body.email, 254).toLowerCase();
  const sessionSlug = cleanText(body.sessionSlug, 120);
  const sessionTitle = cleanText(body.sessionTitle, 180);
  const species = cleanText(body.species, 20).toLowerCase();
  const petName = cleanText(body.petName, 80);
  const breed = cleanText(body.breed, 120);
  const age = cleanText(body.age, 40);
  const focus = cleanText(body.focus, 120);
  const question = cleanText(body.question, 1000);
  const consent = body.consent === true;

  if (!firstName || !sessionSlug || !sessionTitle || !petName || !breed || !age || !question) return json({ error: "Add your name, pet details, and the question you want covered." }, 400);
  if (!validEmail(email)) return json({ error: "Enter a valid email address." }, 400);
  if (!validSpecies.has(species)) return json({ error: "Choose whether this session is for a dog, cat, or both." }, 400);
  if (!consent) return json({ error: "Please confirm that we can send your session invitation and care updates." }, 400);

  const now = new Date().toISOString();
  const savedQuestion = [`Pet: ${petName}; breed/mix: ${breed}; age: ${age}.`, `Question for the vets: ${question}`].join(" ");
  const savedFocus = focus || "monthly webinar";
  try {
    const db = context.env.WAITLIST_DB;
    await db
      .prepare(
        `INSERT INTO care_session_registrations (id, session_slug, session_title, first_name, email, species, focus, question, consent_at, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9, ?9)
         ON CONFLICT(email, session_slug) DO UPDATE SET
           session_title = excluded.session_title,
           first_name = excluded.first_name,
           species = excluded.species,
           focus = excluded.focus,
           question = excluded.question,
           consent_at = excluded.consent_at,
           updated_at = excluded.updated_at`
      )
      .bind(crypto.randomUUID(), sessionSlug, sessionTitle, firstName, email, species, savedFocus, savedQuestion, now)
      .run();
    await syncBrevoContact({
      env: context.env,
      db,
      email,
      firstName,
      attributes: { PET_NAME: petName, PET_SPECIES: species, PET_BREED: breed, PET_AGE: age },
      eventProperties: { session_slug: sessionSlug, session_title: sessionTitle, pet_name: petName, species, breed, age, focus: savedFocus },
      notificationProperties: { session_title: sessionTitle, pet_name: petName, species, focus: savedFocus },
      eventType: "care_session_registration",
      listKeys: ["BREVO_WEBINAR_LIST_ID"],
    });
  } catch {
    return json({ error: "We could not save your session request right now. Please try again." }, 503);
  }

  return json({ message: "Your place is saved. We will send the next invitation, confirmed facilitator details, and a short preparation note." });
}

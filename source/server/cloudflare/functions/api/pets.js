import { syncBrevoContact } from "../_lib/brevo.js";
import { authenticatedMember } from "../_lib/members.js";

const json = (payload, status = 200) => new Response(JSON.stringify(payload), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});
const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
const focusOptions = new Set(["mobility", "sleep", "appetite", "comfort", "vet-visit", "not-sure"]);

const petRow = (pet) => ({
  dogId: pet.id,
  dogName: pet.dogName,
  species: pet.species,
  breed: pet.breed || "",
  ageYears: pet.ageYears,
  weightLbs: pet.weightLbs,
  focus: pet.focus,
  healthConditions: pet.healthConditions || "",
  medications: pet.medications || "",
  routineNotes: pet.routineNotes || "",
  profileMediaId: pet.profileMediaId || "",
});

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: "GET, POST, PATCH, OPTIONS" } });
}

export async function onRequestGet(context) {
  const memberId = cleanText(context.request.headers.get("x-care-circle-member"), 80);
  const memberToken = cleanText(context.request.headers.get("x-care-circle-token"), 160);
  try {
    const db = context.env.WAITLIST_DB;
    const member = await authenticatedMember(db, memberId, memberToken);
    if (!member?.id) return json({ error: "Reopen your account to see its pets." }, 401);
    const result = await db.prepare("SELECT id, dog_name AS dogName, species, breed, age_years AS ageYears, weight_lbs AS weightLbs, focus, health_conditions AS healthConditions, medications, routine_notes AS routineNotes, profile_media_id AS profileMediaId FROM dog_profiles WHERE member_id = ?1 ORDER BY created_at ASC").bind(member.id).all();
    return json({ owner: { firstName: member.firstName, email: member.email, location: member.location || "", membershipPlan: member.membershipPlan || "free", mobileLinkCode: member.mobileLinkCode || "" }, pets: (result.results || []).map(petRow) });
  } catch {
    return json({ error: "We could not load your pet profiles right now." }, 503);
  }
}

export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch { return json({ error: "We could not read that pet profile." }, 400); }
  const memberId = cleanText(body.memberId, 80);
  const memberToken = cleanText(body.memberToken, 160);
  const dogName = cleanText(body.dogName, 80);
  const species = cleanText(body.species, 12).toLowerCase();
  const breed = cleanText(body.breed, 120);
  const focus = cleanText(body.focus, 40);
  const healthConditions = cleanText(body.healthConditions, 700);
  const medications = cleanText(body.medications, 700);
  const routineNotes = cleanText(body.routineNotes, 700);
  const ageYears = Number(body.ageYears);
  const rawWeight = body.weightLbs === "" || body.weightLbs == null ? null : Number(body.weightLbs);
  if (!dogName) return json({ error: "Add your pet's name." }, 400);
  if (!new Set(["dog", "cat"]).has(species)) return json({ error: "Choose dog or cat." }, 400);
  if (!Number.isFinite(ageYears) || ageYears < 0.1 || ageYears > 30) return json({ error: "Enter your pet's age in years." }, 400);
  if (rawWeight !== null && (!Number.isFinite(rawWeight) || rawWeight < 1 || rawWeight > 250)) return json({ error: "Enter a weight between 1 and 250 lb, or leave it blank." }, 400);
  if (!focusOptions.has(focus)) return json({ error: "Choose a care focus." }, 400);
  try {
    const db = context.env.WAITLIST_DB;
    const member = await authenticatedMember(db, memberId, memberToken);
    if (!member?.id) return json({ error: "Reopen your account before adding another pet." }, 401);
    const profileCount = await db.prepare("SELECT COUNT(*) AS count FROM dog_profiles WHERE member_id = ?1").bind(member.id).first();
    const limit = 5;
    if (Number(profileCount?.count || 0) >= limit) {
      return json({ error: "Each care account supports up to five pet profiles." }, 403);
    }
    const dogId = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.prepare("INSERT INTO dog_profiles (id, member_id, dog_name, species, breed, age_years, weight_lbs, focus, health_conditions, medications, routine_notes, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?12)")
      .bind(dogId, member.id, dogName, species, breed || null, ageYears, rawWeight, focus, healthConditions || null, medications || null, routineNotes || null, now).run();
    await syncBrevoContact({
      env: context.env,
      db,
      email: member.email,
      firstName: member.firstName,
      eventType: "additional_pet_profile_created",
      eventProperties: { member_id: member.id, pet_id: dogId, pet_name: dogName, pet_species: species, pet_breed: breed, pet_age_years: ageYears, pet_weight_lbs: rawWeight, care_focus: focus },
      notificationProperties: { pet_name: dogName, pet_species: species, pet_age_years: ageYears, care_focus: focus },
      listKeys: ["BREVO_CARE_CIRCLE_LIST_ID"],
    });
    return json({ message: `${dogName} is now part of your care account.`, pet: petRow({ id: dogId, dogName, species, breed, ageYears, weightLbs: rawWeight, focus, healthConditions, medications, routineNotes, profileMediaId: "" }) });
  } catch {
    return json({ error: "We could not add that pet right now." }, 503);
  }
}

export async function onRequestPatch(context) {
  let body;
  try { body = await context.request.json(); } catch { return json({ error: "We could not read that pet profile." }, 400); }
  const memberId = cleanText(body.memberId, 80);
  const memberToken = cleanText(body.memberToken, 160);
  const dogId = cleanText(body.dogId, 80);
  const dogName = cleanText(body.dogName, 80);
  const species = cleanText(body.species, 12).toLowerCase();
  const breed = cleanText(body.breed, 120);
  const focus = cleanText(body.focus, 40);
  const healthConditions = cleanText(body.healthConditions, 700);
  const medications = cleanText(body.medications, 700);
  const routineNotes = cleanText(body.routineNotes, 700);
  const ageYears = Number(body.ageYears);
  const rawWeight = body.weightLbs === "" || body.weightLbs == null ? null : Number(body.weightLbs);
  if (!dogId || !dogName) return json({ error: "Choose a pet and add their name." }, 400);
  if (!new Set(["dog", "cat"]).has(species)) return json({ error: "Choose dog or cat." }, 400);
  if (!Number.isFinite(ageYears) || ageYears < 0.1 || ageYears > 30) return json({ error: "Enter your pet's age in years." }, 400);
  if (rawWeight !== null && (!Number.isFinite(rawWeight) || rawWeight < 1 || rawWeight > 250)) return json({ error: "Enter a weight between 1 and 250 lb, or leave it blank." }, 400);
  if (!focusOptions.has(focus)) return json({ error: "Choose a care focus." }, 400);
  try {
    const db = context.env.WAITLIST_DB;
    const member = await authenticatedMember(db, memberId, memberToken);
    if (!member?.id) return json({ error: "Reopen your account before editing this pet." }, 401);
    const existing = await db.prepare("SELECT id, profile_media_id AS profileMediaId FROM dog_profiles WHERE id = ?1 AND member_id = ?2").bind(dogId, member.id).first();
    if (!existing?.id) return json({ error: "We could not find that pet profile." }, 404);
    const now = new Date().toISOString();
    await db.prepare("UPDATE dog_profiles SET dog_name = ?1, species = ?2, breed = ?3, age_years = ?4, weight_lbs = ?5, focus = ?6, health_conditions = ?7, medications = ?8, routine_notes = ?9, updated_at = ?10 WHERE id = ?11 AND member_id = ?12")
      .bind(dogName, species, breed || null, ageYears, rawWeight, focus, healthConditions || null, medications || null, routineNotes || null, now, dogId, member.id).run();
    await syncBrevoContact({
      env: context.env,
      db,
      email: member.email,
      firstName: member.firstName,
      eventType: "pet_profile_updated",
      eventProperties: { member_id: member.id, pet_id: dogId, pet_name: dogName, pet_species: species, pet_breed: breed, pet_age_years: ageYears, pet_weight_lbs: rawWeight, care_focus: focus },
      notificationProperties: { pet_name: dogName, pet_species: species, pet_age_years: ageYears, care_focus: focus },
      listKeys: ["BREVO_CARE_CIRCLE_LIST_ID"],
    });
    return json({ message: `${dogName}'s profile is updated.`, pet: petRow({ id: dogId, dogName, species, breed, ageYears, weightLbs: rawWeight, focus, healthConditions, medications, routineNotes, profileMediaId: existing.profileMediaId || "" }) });
  } catch {
    return json({ error: "We could not update that pet right now." }, 503);
  }
}

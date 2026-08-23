import { syncBrevoContact } from "../_lib/brevo.js";
import { hashToken } from "../_lib/members.js";

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
    return json({ error: "We could not read that profile." }, 400);
  }

  const ownerName = cleanText(body.ownerName, 80);
  const email = cleanText(body.email, 254).toLowerCase();
  const location = cleanText(body.location, 120);
  const dogName = cleanText(body.dogName, 80);
  const species = cleanText(body.species, 12).toLowerCase();
  const breed = cleanText(body.breed, 120);
  const focus = cleanText(body.focus, 40);
  const healthConditions = cleanText(body.healthConditions, 700);
  const medications = cleanText(body.medications, 700);
  const routineNotes = cleanText(body.routineNotes, 700);
  const ageYears = Number(body.ageYears);
  const rawWeight = body.weightLbs === "" || body.weightLbs == null ? null : Number(body.weightLbs);
  const consent = body.consent === true;
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const focusOptions = new Set(["mobility", "sleep", "appetite", "comfort", "vet-visit", "not-sure"]);

  if (!ownerName || !dogName) return json({ error: "Add your first name and your pet's name." }, 400);
  if (!validEmail) return json({ error: "Enter a valid email address." }, 400);
  if (!new Set(["dog", "cat"]).has(species)) return json({ error: "Choose whether this profile is for a dog or cat." }, 400);
  if (!Number.isFinite(ageYears) || ageYears < 0.1 || ageYears > 30) return json({ error: "Enter your pet's age in years." }, 400);
  if (rawWeight !== null && (!Number.isFinite(rawWeight) || rawWeight < 1 || rawWeight > 250)) return json({ error: "Enter a weight between 1 and 250 lb, or leave it blank." }, 400);
  if (!focusOptions.has(focus)) return json({ error: "Choose one thing you would like to keep an eye on." }, 400);
  if (!consent) return json({ error: "Please confirm that we can send profile and Care Circle updates." }, 400);

  const db = context.env.WAITLIST_DB;
  const now = new Date().toISOString();
  const memberToken = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const tokenHash = await hashToken(memberToken);

  try {
    const existing = await db.prepare("SELECT id FROM care_circle_members WHERE email = ?1").bind(email).first();
    const memberId = existing?.id || crypto.randomUUID();
    if (existing?.id) {
      const profileCount = await db.prepare("SELECT COUNT(*) AS count FROM dog_profiles WHERE member_id = ?1").bind(memberId).first();
      if (Number(profileCount?.count || 0) >= 5) return json({ error: "This care account already has five pet profiles." }, 409);
    }

    if (existing?.id) {
      await db
        .prepare("UPDATE care_circle_members SET first_name = ?1, location = ?2, token_hash = ?3, consent_at = ?4, updated_at = ?4 WHERE id = ?5")
        .bind(ownerName, location || null, tokenHash, now, memberId)
        .run();
    } else {
      await db
        .prepare("INSERT INTO care_circle_members (id, email, first_name, location, token_hash, consent_at, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6, ?6)")
        .bind(memberId, email, ownerName, location || null, tokenHash, now)
        .run();
    }

    const dogId = crypto.randomUUID();
    await db
      .prepare("INSERT INTO dog_profiles (id, member_id, dog_name, species, breed, age_years, weight_lbs, focus, health_conditions, medications, routine_notes, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?12)")
      .bind(dogId, memberId, dogName, species, breed || null, ageYears, rawWeight, focus, healthConditions || null, medications || null, routineNotes || null, now)
      .run();

    await syncBrevoContact({
      env: context.env,
      db,
      email,
      firstName: ownerName,
      eventType: "pet_profile_created",
      eventProperties: {
        member_id: memberId,
        pet_id: dogId,
        owner_location: location,
        pet_name: dogName,
        pet_species: species,
        pet_breed: breed,
        pet_age_years: ageYears,
        pet_weight_lbs: rawWeight,
        care_focus: focus,
      },
      notificationProperties: { pet_name: dogName, pet_species: species, pet_age_years: ageYears, care_focus: focus, owner_location: location },
      listKeys: ["BREVO_CARE_CIRCLE_LIST_ID"],
    });

    return json({
      message: `${dogName}'s care account is ready. Save one ordinary observation whenever you need a clearer record.`,
      member: { id: memberId, token: memberToken, dogId, dogName, species, breed, ageYears, weightLbs: rawWeight, focus, firstName: ownerName, email, location, healthConditions, medications, routineNotes },
    });
  } catch {
    return json({ error: "We could not save that profile right now. Please try again." }, 503);
  }
}

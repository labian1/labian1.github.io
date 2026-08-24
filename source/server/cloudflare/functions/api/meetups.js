import { syncBrevoContact } from "../_lib/brevo.js";
import { authenticatedMember, memberDog } from "../_lib/members.js";

const json = (payload, status = 200) => new Response(JSON.stringify(payload), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});
const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
const allowed = (value, values) => values.has(value) ? value : "";
const sizeBands = new Set(["small", "medium", "large", "extra-large"]);
const energyLevels = new Set(["low", "moderate", "high"]);
const temperaments = new Set(["social", "selective", "prefers-space"]);
const mobilityLevels = new Set(["typical", "gentle", "limited"]);
const playStyles = new Set(["quiet-company", "parallel-walk", "gentle-play", "active-play"]);
const availabilityOptions = new Set(["weekday-morning", "weekday-evening", "weekend-morning", "weekend-afternoon"]);
const venues = new Set(["quiet-park", "walking-route", "pet-friendly-cafe", "private-yard"]);
const ownerGoals = new Set(["gentle-social-time", "walking-companion", "shared-care-experience", "pet-friendship"]);
const rank = (value, order) => Math.max(0, order.indexOf(value));

const profileResponse = (row) => row ? {
  id: row.id,
  petId: row.petId,
  city: row.city,
  region: row.region,
  country: row.country,
  radiusMiles: row.radiusMiles,
  mixedSpeciesOk: Boolean(row.mixedSpeciesOk),
  sizeBand: row.sizeBand,
  energyLevel: row.energyLevel,
  temperament: row.temperament,
  mobilityNeeds: row.mobilityNeeds,
  playStyle: row.playStyle,
  availability: row.availability,
  venuePreference: row.venuePreference,
  ownerGoal: row.ownerGoal,
  safetyNotes: row.safetyNotes || "",
  active: Boolean(row.active),
} : null;

async function readProfile(db, memberId, petId) {
  return db.prepare(`SELECT id, pet_profile_id AS petId, city, region, country, radius_miles AS radiusMiles,
    mixed_species_ok AS mixedSpeciesOk, size_band AS sizeBand, energy_level AS energyLevel,
    temperament, mobility_needs AS mobilityNeeds, play_style AS playStyle, availability,
    venue_preference AS venuePreference, owner_goal AS ownerGoal, safety_notes AS safetyNotes, active
    FROM pet_meetup_profiles WHERE member_id = ?1 AND pet_profile_id = ?2`).bind(memberId, petId).first();
}

async function readPetContextCount(db, memberId, petId) {
  const [checkins, lessons] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS count FROM dog_checkins WHERE dog_profile_id = ?1").bind(petId).first(),
    db.prepare("SELECT COUNT(*) AS count FROM care_chat_conversations WHERE member_id = ?1 AND pet_profile_id = ?2 AND status != 'intake'").bind(memberId, petId).first(),
  ]);
  return Number(checkins?.count || 0) + Number(lessons?.count || 0);
}

async function readFeedbackWeights(db, memberId) {
  const result = await db.prepare(`SELECT AVG(energy_fit_rating) AS energyFit, AVG(owner_fit_rating) AS ownerFit,
    AVG(safety_rating) AS safetyFit FROM pet_meetup_feedback WHERE member_id = ?1`).bind(memberId).first();
  return {
    energy: Number(result?.energyFit || 5) < 3 ? 22 : 15,
    owner: Number(result?.ownerFit || 5) < 3 ? 14 : 7,
    safety: Number(result?.safetyFit || 5) < 3 ? 10 : 5,
  };
}

function compatible(a, b) {
  if (a.country !== b.country || a.region.toLowerCase() !== b.region.toLowerCase()) return false;
  if (a.species !== b.species && !(a.mixedSpeciesOk && b.mixedSpeciesOk)) return false;
  if (a.temperament === "prefers-space" && b.playStyle === "active-play") return false;
  if (b.temperament === "prefers-space" && a.playStyle === "active-play") return false;
  if (a.mobilityNeeds === "limited" && b.playStyle === "active-play") return false;
  if (b.mobilityNeeds === "limited" && a.playStyle === "active-play") return false;
  return true;
}

function scoreCandidate(a, b, weights) {
  let score = a.city.toLowerCase() === b.city.toLowerCase() ? 25 : 14;
  const reasons = [a.city.toLowerCase() === b.city.toLowerCase() ? `Both families are in ${a.city}.` : `Both families are in ${a.region}.`];
  if (a.availability === b.availability) { score += 20; reasons.push("Your available time matches."); }
  const energyDifference = Math.abs(rank(a.energyLevel, ["low", "moderate", "high"]) - rank(b.energyLevel, ["low", "moderate", "high"]));
  score += Math.max(0, weights.energy - energyDifference * 7);
  if (energyDifference === 0) reasons.push("The pets have a similar energy level.");
  const sizeDifference = Math.abs(rank(a.sizeBand, ["small", "medium", "large", "extra-large"]) - rank(b.sizeBand, ["small", "medium", "large", "extra-large"]));
  score += Math.max(0, 10 - sizeDifference * 4);
  const ageDifference = Math.abs(Number(a.ageYears || 0) - Number(b.ageYears || 0));
  score += ageDifference <= 2 ? 10 : ageDifference <= 5 ? 6 : 2;
  if (a.playStyle === b.playStyle) { score += 8; reasons.push("Their preferred social style matches."); }
  if (a.venuePreference === b.venuePreference) score += 5;
  if (a.mobilityNeeds === b.mobilityNeeds || [a.mobilityNeeds, b.mobilityNeeds].includes("gentle")) score += weights.safety;
  if (a.ownerGoal === b.ownerGoal) { score += weights.owner; reasons.push("The owners want the same kind of connection."); }
  return { score: Math.min(100, Math.round(score)), reasons: reasons.slice(0, 4) };
}

async function profileMatches(db, profileId, memberId) {
  const result = await db.prepare(`SELECT m.id, m.score, m.reasons_json AS reasonsJson, m.status, m.created_at AS createdAt,
    CASE WHEN m.profile_a_id = ?1 THEN pb.id ELSE pa.id END AS otherProfileId,
    CASE WHEN m.profile_a_id = ?1 THEN dog_b.dog_name ELSE dog_a.dog_name END AS petName,
    CASE WHEN m.profile_a_id = ?1 THEN dog_b.species ELSE dog_a.species END AS species,
    CASE WHEN m.profile_a_id = ?1 THEN dog_b.breed ELSE dog_a.breed END AS breed,
    CASE WHEN m.profile_a_id = ?1 THEN pb.city ELSE pa.city END AS city,
    CASE WHEN m.profile_a_id = ?1 THEN pb.region ELSE pa.region END AS region,
    CASE WHEN m.profile_a_id = ?1 THEN mb.first_name ELSE ma.first_name END AS ownerFirstName,
    f.id AS feedbackId
    FROM pet_meetup_matches m
    JOIN pet_meetup_profiles pa ON pa.id = m.profile_a_id
    JOIN pet_meetup_profiles pb ON pb.id = m.profile_b_id
    JOIN dog_profiles dog_a ON dog_a.id = pa.pet_profile_id
    JOIN dog_profiles dog_b ON dog_b.id = pb.pet_profile_id
    JOIN care_circle_members ma ON ma.id = pa.member_id
    JOIN care_circle_members mb ON mb.id = pb.member_id
    LEFT JOIN pet_meetup_feedback f ON f.match_id = m.id AND f.member_id = ?2
    WHERE m.profile_a_id = ?1 OR m.profile_b_id = ?1 ORDER BY m.created_at DESC LIMIT 12`).bind(profileId, memberId).all();
  return (result.results || []).map((match) => ({ ...match, reasons: JSON.parse(match.reasonsJson || "[]"), feedbackSubmitted: Boolean(match.feedbackId) }));
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: "GET, POST, OPTIONS" } });
}

export async function onRequestGet(context) {
  const memberId = cleanText(context.request.headers.get("x-care-circle-member"), 80);
  const memberToken = cleanText(context.request.headers.get("x-care-circle-token"), 160);
  const petId = cleanText(new URL(context.request.url).searchParams.get("petId"), 80);
  try {
    const db = context.env.WAITLIST_DB;
    const member = await authenticatedMember(db, memberId, memberToken);
    const pet = await memberDog(db, petId, memberId);
    if (!member?.id || !pet?.id) return json({ error: "Enroll your pet before opening meetup matching." }, 401);
    const contextCount = await readPetContextCount(db, memberId, petId);
    const profile = await readProfile(db, memberId, petId);
    return json({
      profile: profileResponse(profile),
      matches: profile ? await profileMatches(db, profile.id, memberId) : [],
      contextCount,
      requiredContextCount: 3,
      unlocked: contextCount >= 3,
    });
  } catch {
    return json({ error: "Meetup matching is unavailable right now." }, 503);
  }
}

export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch { return json({ error: "We could not read that meetup request." }, 400); }
  const action = cleanText(body.action, 20);
  const memberId = cleanText(body.memberId, 80);
  const memberToken = cleanText(body.memberToken, 160);
  const petId = cleanText(body.petId, 80);
  try {
    const db = context.env.WAITLIST_DB;
    const member = await authenticatedMember(db, memberId, memberToken);
    const pet = await memberDog(db, petId, memberId);
    if (!member?.id || !pet?.id) return json({ error: "Enroll your pet before using meetup matching." }, 401);
    const contextCount = await readPetContextCount(db, memberId, petId);
    if (contextCount < 3) {
      return json({ error: `Save ${3 - contextCount} more check-in${3 - contextCount === 1 ? "" : "s"} or lesson${3 - contextCount === 1 ? "" : "s"} before Wednesday matching opens.` }, 403);
    }

    if (action === "profile") {
      const city = cleanText(body.city, 80);
      const region = cleanText(body.region, 80);
      const country = allowed(cleanText(body.country, 2).toUpperCase(), new Set(["US", "CA"]));
      const sizeBand = allowed(cleanText(body.sizeBand, 20), sizeBands);
      const energyLevel = allowed(cleanText(body.energyLevel, 20), energyLevels);
      const temperament = allowed(cleanText(body.temperament, 30), temperaments);
      const mobilityNeeds = allowed(cleanText(body.mobilityNeeds, 20), mobilityLevels);
      const playStyle = allowed(cleanText(body.playStyle, 30), playStyles);
      const availability = allowed(cleanText(body.availability, 30), availabilityOptions);
      const venuePreference = allowed(cleanText(body.venuePreference, 30), venues);
      const ownerGoal = allowed(cleanText(body.ownerGoal, 40), ownerGoals);
      const radiusMiles = Math.min(50, Math.max(2, Number(body.radiusMiles) || 10));
      if (!city || !region || !country || !sizeBand || !energyLevel || !temperament || !mobilityNeeds || !playStyle || !availability || !venuePreference || !ownerGoal) {
        return json({ error: "Complete each matching field so we can protect the fit." }, 400);
      }
      const existing = await readProfile(db, memberId, petId);
      const id = existing?.id || crypto.randomUUID();
      const now = new Date().toISOString();
      await db.prepare(`INSERT INTO pet_meetup_profiles (id, member_id, pet_profile_id, city, region, country, radius_miles, mixed_species_ok, size_band, energy_level, temperament, mobility_needs, play_style, availability, venue_preference, owner_goal, safety_notes, active, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, 1, ?18, ?18)
        ON CONFLICT(member_id, pet_profile_id) DO UPDATE SET city=excluded.city, region=excluded.region, country=excluded.country, radius_miles=excluded.radius_miles, mixed_species_ok=excluded.mixed_species_ok, size_band=excluded.size_band, energy_level=excluded.energy_level, temperament=excluded.temperament, mobility_needs=excluded.mobility_needs, play_style=excluded.play_style, availability=excluded.availability, venue_preference=excluded.venue_preference, owner_goal=excluded.owner_goal, safety_notes=excluded.safety_notes, active=1, updated_at=excluded.updated_at`)
        .bind(id, memberId, petId, city, region, country, radiusMiles, body.mixedSpeciesOk ? 1 : 0, sizeBand, energyLevel, temperament, mobilityNeeds, playStyle, availability, venuePreference, ownerGoal, cleanText(body.safetyNotes, 500) || null, now).run();
      await syncBrevoContact({
        env: context.env,
        db,
        email: member.email,
        firstName: member.firstName,
        eventType: "wednesday_match_profile_saved",
        eventProperties: { profile_id: id, pet_id: petId, city, region, country, radius_miles: radiusMiles },
        notificationProperties: { pet_name: pet.dogName, city, region, country },
        listKeys: ["BREVO_CARE_CIRCLE_LIST_ID"],
      });
      return json({ message: "Matching preferences saved.", profile: profileResponse(await readProfile(db, memberId, petId)) });
    }

    const profile = await readProfile(db, memberId, petId);
    if (!profile) return json({ error: "Save meetup preferences before asking for a match." }, 400);

    if (action === "match") {
      return json({ error: "Profiles are reviewed offline each Wednesday. If there is a careful fit, the WoafMeow team will send the introduction by email." }, 409);
    }

    if (action === "feedback") {
      const matchId = cleanText(body.matchId, 80);
      const match = await db.prepare("SELECT id FROM pet_meetup_matches WHERE id = ?1 AND (profile_a_id = ?2 OR profile_b_id = ?2)").bind(matchId, profile.id).first();
      if (!match?.id) return json({ error: "That match is not connected to this pet." }, 403);
      const ratings = ["comfortRating", "energyFitRating", "ownerFitRating", "safetyRating"].map((key) => Number(body[key]));
      if (ratings.some((rating) => !Number.isInteger(rating) || rating < 1 || rating > 5)) return json({ error: "Rate each part from 1 to 5." }, 400);
      const now = new Date().toISOString();
      await db.prepare(`INSERT INTO pet_meetup_feedback (id, match_id, member_id, comfort_rating, energy_fit_rating, owner_fit_rating, safety_rating, meet_again, notes, created_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
        ON CONFLICT(match_id, member_id) DO UPDATE SET comfort_rating=excluded.comfort_rating, energy_fit_rating=excluded.energy_fit_rating, owner_fit_rating=excluded.owner_fit_rating, safety_rating=excluded.safety_rating, meet_again=excluded.meet_again, notes=excluded.notes, created_at=excluded.created_at`)
        .bind(crypto.randomUUID(), matchId, memberId, ratings[0], ratings[1], ratings[2], ratings[3], body.meetAgain ? 1 : 0, cleanText(body.notes, 600) || null, now).run();
      await syncBrevoContact({
        env: context.env,
        db,
        email: member.email,
        firstName: member.firstName,
        eventType: "wednesday_match_feedback_saved",
        eventProperties: { profile_id: profile.id, pet_id: petId, match_id: matchId, meet_again: Boolean(body.meetAgain) },
        notificationProperties: { pet_name: pet.dogName, meet_again: Boolean(body.meetAgain) },
        listKeys: ["BREVO_CARE_CIRCLE_LIST_ID"],
      });
      return json({ message: "Feedback saved. It will change how the next match is ranked." });
    }
    return json({ error: "Choose a meetup action." }, 400);
  } catch {
    return json({ error: "Meetup matching is unavailable right now." }, 503);
  }
}

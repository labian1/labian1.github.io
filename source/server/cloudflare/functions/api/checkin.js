import { syncBrevoContact } from "../_lib/brevo.js";
import { authenticatedMember, memberDog } from "../_lib/members.js";

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);

const buildGlance = (petName, sleep, mobility, appetite, note) => {
  const changed = [sleep, mobility, appetite].filter((value) => value === "different").length;
  if (changed >= 2) {
    return {
      headline: `${petName}'s day asked for more attention.`,
      reflection: `Do not shrink this into “probably nothing.” Two or more daily patterns felt different. Keep tonight easier, save the clearest moment, and contact the veterinary team sooner if the change repeats or worsens.`,
      shareText: `${petName}'s Day at a Glance: today asked for more attention. I noticed it, wrote it down, and made tomorrow's next step clearer.`,
    };
  }
  if (changed === 1) {
    return {
      headline: `One part of ${petName}'s day shifted.`,
      reflection: `You caught the change before the details blurred together. Watch the same ordinary moment tomorrow. A repeatable example is more useful than a worried guess.${note ? " Your note gives that pattern a real starting point." : ""}`,
      shareText: `${petName}'s Day at a Glance: one small shift was worth noticing. Not panic. Not dismissal. A clear record for tomorrow.`,
    };
  }
  return {
    headline: `${petName} gave you an ordinary day.`,
    reflection: "Do not rush past ordinary. It is the baseline that makes a future change easier to see, and it is also part of the life you will want to remember.",
    shareText: `${petName}'s Day at a Glance: an ordinary day, which is another way of saying a day worth keeping.`,
  };
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: "GET, POST, OPTIONS" } });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const memberId = cleanText(context.request.headers.get("x-care-circle-member"), 80);
  const memberToken = cleanText(context.request.headers.get("x-care-circle-token"), 160);
  const dogId = cleanText(url.searchParams.get("dogId"), 80);
  if (!memberId || !memberToken || !dogId) return json({ error: "Create your pet profile before viewing a care record." }, 401);

  try {
    const db = context.env.WAITLIST_DB;
    const member = await authenticatedMember(db, memberId, memberToken);
    if (!member?.id) return json({ error: "This profile session has expired. Create the profile again to continue." }, 401);
    const pet = await memberDog(db, dogId, memberId);
    if (!pet?.id) return json({ error: "We could not find that pet profile." }, 404);
    const entries = await db
      .prepare("SELECT day_number AS dayNumber, prompt, sleep_state AS sleep, mobility_state AS mobility, appetite_state AS appetite, note, created_at AS createdAt FROM dog_checkins WHERE dog_profile_id = ?1 ORDER BY created_at DESC LIMIT 7")
      .bind(dogId)
      .all();
    return json({ pet: { name: pet.dogName, species: pet.species, breed: pet.breed, ageYears: pet.ageYears, weightLbs: pet.weightLbs, focus: pet.focus }, entries: entries.results || [] });
  } catch {
    return json({ error: "We could not load that care record right now. Please try again." }, 503);
  }
}

export async function onRequestPost(context) {
  const contentType = context.request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return json({ error: "Use a JSON request." }, 415);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "We could not read that check-in." }, 400);
  }

  const memberId = cleanText(body.memberId, 80);
  const memberToken = cleanText(body.memberToken, 160);
  const dogId = cleanText(body.dogId, 80);
  const sleep = cleanText(body.sleep, 20);
  const mobility = cleanText(body.mobility, 20);
  const appetite = cleanText(body.appetite, 20);
  const note = cleanText(body.note, 500);
  const prompt = cleanText(body.prompt, 240);
  const options = new Set(["same", "different", "not-sure"]);

  if (!memberId || !memberToken || !dogId) return json({ error: "Create your pet's profile before saving a check-in." }, 401);
  if (![sleep, mobility, appetite].every((value) => options.has(value))) return json({ error: "Choose an answer for sleep, movement, and appetite." }, 400);

  try {
    const db = context.env.WAITLIST_DB;
    const member = await authenticatedMember(db, memberId, memberToken);
    if (!member?.id) return json({ error: "This profile session has expired. Create the profile again to continue." }, 401);
    const dog = await memberDog(db, dogId, memberId);
    if (!dog?.id) return json({ error: "We could not find that pet profile." }, 404);
    const now = new Date().toISOString();
    const glanceDate = now.slice(0, 10);
    const existing = await db.prepare("SELECT id FROM daily_glances WHERE pet_profile_id = ?1 AND glance_date = ?2").bind(dogId, glanceDate).first();
    if (existing?.id) return json({ error: `${dog.dogName}'s Day at a Glance is already saved for today. Come back tomorrow for a new entry.` }, 409);
    const history = await db.prepare("SELECT COUNT(*) AS count FROM dog_checkins WHERE dog_profile_id = ?1").bind(dogId).first();
    const dayNumber = Number(history?.count || 0) + 1;
    const checkinId = crypto.randomUUID();
    const glanceId = crypto.randomUUID();
    const glance = buildGlance(dog.dogName, sleep, mobility, appetite, note);
    await db.batch([
      db
      .prepare("INSERT INTO dog_checkins (id, dog_profile_id, sleep_state, mobility_state, appetite_state, note, day_number, prompt, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)")
      .bind(checkinId, dogId, sleep, mobility, appetite, note || null, dayNumber, prompt || null, now),
      db.prepare("INSERT INTO daily_glances (id, member_id, pet_profile_id, checkin_id, glance_date, headline, reflection, share_text, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)")
        .bind(glanceId, memberId, dogId, checkinId, glanceDate, glance.headline, glance.reflection, glance.shareText, now),
      db.prepare("INSERT INTO app_notifications (id, member_id, kind, title, body, href, is_read, created_at) VALUES (?1, ?2, 'daily-glance', ?3, ?4, '/senior-care-platform/my-pet/?panel=observe', 0, ?5)")
        .bind(crypto.randomUUID(), memberId, glance.headline, "Today's reflection is ready to keep or share.", now),
    ]);
    await syncBrevoContact({
      env: context.env,
      db,
      email: member.email,
      firstName: member.firstName,
      eventType: "daily_glance_saved",
      eventProperties: { pet_name: dog.dogName, glance_date: glanceDate, changed_areas: [sleep, mobility, appetite].filter((value) => value === "different").length },
      notificationProperties: { pet_name: dog.dogName, glance_date: glanceDate, changed_areas: [sleep, mobility, appetite].filter((value) => value === "different").length },
      listKeys: ["BREVO_CARE_CIRCLE_LIST_ID"],
    });
    return json({ message: "Today's glance is saved.", glance: { ...glance, glanceDate } });
  } catch {
    return json({ error: "We could not save that check-in right now. Please try again." }, 503);
  }
}

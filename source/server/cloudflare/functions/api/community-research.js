import { syncBrevoContact } from "../_lib/brevo.js";
import { authenticatedMember, memberDog } from "../_lib/members.js";

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
const validUrl = (value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

const memberCredentials = (request) => ({
  id: cleanText(request.headers.get("x-care-circle-member"), 80),
  token: cleanText(request.headers.get("x-care-circle-token"), 160),
});

const briefFor = (query, species) => {
  const lower = query.toLowerCase();
  const petLabel = species === "cat" ? "cat" : species === "dog" ? "dog" : "pet";
  if (/(food|diet|meal|nutrition|treat|appetite)/.test(lower)) {
    return {
      title: "Food and routine brief",
      prompts: [
        `Name your ${petLabel}'s age, current food, medication, and the exact routine change.`,
        "Separate a changed appetite from a changed food preference, timing, bowl location, or feeding setup.",
        "Ask your veterinary team what needs assessment before making a major diet change.",
      ],
    };
  }
  if (/(bed|sleep|rest|night|settle|pacing)/.test(lower)) {
    return {
      title: "Rest and settling brief",
      prompts: [
        "Describe the sleep location, the first wake-up, and the moment settling becomes difficult.",
        "Note whether movement, bathroom trips, temperature, noise, or a new routine changes the night.",
        "Keep one short ordinary video if it is safe and useful for a veterinary conversation.",
      ],
    };
  }
  if (/(toy|play|walk|move|mobility|stair|jump|exercise)/.test(lower)) {
    return {
      title: "Movement and engagement brief",
      prompts: [
        "Start with the first rise, first steps, or first choice to join an activity.",
        "Note what your pet avoids, how long recovery takes, and what makes the route easier.",
        "Ask whether a new or worsening change should be assessed before changing activity.",
      ],
    };
  }
  return {
    title: "Care question brief",
    prompts: [
      `Describe the ordinary routine for your ${petLabel}, then name the first detail that changed.`,
      "Add when it happens, how often it repeats, and what seems to help.",
      "Keep the question specific enough for another owner or veterinary team to understand the real moment.",
    ],
  };
};

async function getMemberAndPet(context, dogId) {
  const db = context.env.WAITLIST_DB;
  const credentials = memberCredentials(context.request);
  const member = await authenticatedMember(db, credentials.id, credentials.token);
  if (!member?.id) return { error: json({ error: "Create a pet account before using community research." }, 401) };
  const pet = await memberDog(db, dogId, member.id);
  if (!pet?.id) return { error: json({ error: "We could not find that pet account." }, 404) };
  return { db, member, pet };
}

async function quotaFor(db, memberId) {
  const row = await db
    .prepare("SELECT COUNT(*) AS used FROM community_research_queries WHERE member_id = ?1 AND date(created_at) = date('now')")
    .bind(memberId)
    .first();
  const used = Number(row?.used || 0);
  return { limit: 3, used, remaining: Math.max(0, 3 - used) };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: "GET, POST, OPTIONS" } });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const dogId = cleanText(url.searchParams.get("dogId"), 80);
  if (!dogId) return json({ error: "Choose a pet account first." }, 400);
  try {
    const account = await getMemberAndPet(context, dogId);
    if (account.error) return account.error;
    const [quota, history] = await Promise.all([
      quotaFor(account.db, account.member.id),
      account.db
        .prepare("SELECT id, query, species, public_facebook_url AS publicFacebookUrl, status, brief_json AS briefJson, created_at AS createdAt FROM community_research_queries WHERE member_id = ?1 ORDER BY created_at DESC LIMIT 8")
        .bind(account.member.id)
        .all(),
    ]);
    return json({ quota, history: (history.results || []).map((item) => ({ ...item, brief: JSON.parse(item.briefJson) })) });
  } catch {
    return json({ error: "We could not load your research history right now." }, 503);
  }
}

export async function onRequestPost(context) {
  if (!(context.request.headers.get("content-type") || "").includes("application/json")) {
    return json({ error: "Use a JSON request." }, 415);
  }
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "We could not read that research question." }, 400);
  }

  const dogId = cleanText(body.dogId, 80);
  const query = cleanText(body.query, 180);
  const species = cleanText(body.species, 12).toLowerCase();
  const publicFacebookUrl = cleanText(body.publicFacebookUrl, 500);
  if (query.length < 3) return json({ error: "Write the topic or question you want to research." }, 400);
  if (!new Set(["dog", "cat", "all"]).has(species)) return json({ error: "Choose dog, cat, or both." }, 400);
  if (!validUrl(publicFacebookUrl)) return json({ error: "Use a complete public link, including https://, or leave it blank." }, 400);

  try {
    const account = await getMemberAndPet(context, dogId);
    if (account.error) return account.error;
    const quota = await quotaFor(account.db, account.member.id);
    if (!quota.remaining) return json({ error: "You have used today’s three free research requests. Try again tomorrow." }, 429);

    const brief = briefFor(query, species);
    const now = new Date().toISOString();
    await account.db
      .prepare("INSERT INTO community_research_queries (id, member_id, dog_profile_id, query, species, public_facebook_url, source_scope, status, brief_json, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'reddit_and_public_facebook', 'source_access_pending', ?7, ?8)")
      .bind(crypto.randomUUID(), account.member.id, dogId, query, species, publicFacebookUrl || null, JSON.stringify(brief), now)
      .run();
    await syncBrevoContact({
      env: context.env,
      db: account.db,
      email: account.member.email,
      firstName: account.member.firstName,
      eventType: "community_research_request",
      eventProperties: { pet_id: dogId, species },
      notificationProperties: { pet_name: account.pet.dogName, species },
      listKeys: ["BREVO_CARE_CIRCLE_LIST_ID"],
    });
    return json({
      message: "Your research brief is saved in your account.",
      brief,
      quota: { limit: 3, used: quota.used + 1, remaining: quota.remaining - 1 },
      sourceStatus: "Public-source access is being configured. This request has not read Reddit or Facebook content, and it never searches private groups.",
    });
  } catch {
    return json({ error: "We could not save that research request right now. Please try again." }, 503);
  }
}

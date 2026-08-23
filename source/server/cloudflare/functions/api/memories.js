import { syncBrevoContact } from "../_lib/brevo.js";
import { authenticatedMember, memberDog } from "../_lib/members.js";

const json = (payload, status = 200) => new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: "GET, POST, OPTIONS" } });
}

export async function onRequestGet(context) {
  const memberId = cleanText(context.request.headers.get("x-care-circle-member"), 80);
  const memberToken = cleanText(context.request.headers.get("x-care-circle-token"), 160);
  const dogId = cleanText(new URL(context.request.url).searchParams.get("dogId"), 80);
  try {
    const db = context.env.WAITLIST_DB;
    const member = await authenticatedMember(db, memberId, memberToken);
    if (!member?.id) return json({ error: "Reopen your pet account to see the memory timeline." }, 401);
    const pet = await memberDog(db, dogId, memberId);
    if (!pet?.id) return json({ error: "We could not find that pet profile." }, 404);
    const result = await db.prepare("SELECT pm.id, pm.title, pm.story, pm.media_id AS mediaId, pm.created_at AS createdAt, m.media_kind AS mediaKind, m.filename FROM pet_memories pm LEFT JOIN care_circle_media m ON m.id = pm.media_id WHERE pm.member_id = ?1 AND pm.pet_profile_id = ?2 ORDER BY pm.created_at DESC LIMIT 50").bind(memberId, dogId).all();
    return json({ memories: result.results || [] });
  } catch {
    return json({ error: "We could not load the memory timeline right now." }, 503);
  }
}

export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch { return json({ error: "We could not read that memory." }, 400); }
  const memberId = cleanText(body.memberId, 80);
  const memberToken = cleanText(body.memberToken, 160);
  const dogId = cleanText(body.dogId, 80);
  const title = cleanText(body.title, 100);
  const story = cleanText(body.story, 1200);
  const mediaId = cleanText(body.mediaId, 80);
  if (title.length < 2 || story.length < 12) return json({ error: "Add a title and a few details you want to remember." }, 400);
  try {
    const db = context.env.WAITLIST_DB;
    const member = await authenticatedMember(db, memberId, memberToken);
    if (!member?.id) return json({ error: "Reopen your pet account before saving a memory." }, 401);
    const pet = await memberDog(db, dogId, memberId);
    if (!pet?.id) return json({ error: "We could not find that pet profile." }, 404);
    if (mediaId) {
      const media = await db.prepare("SELECT id FROM care_circle_media WHERE id = ?1 AND member_id = ?2 AND dog_profile_id = ?3 AND status = 'private'").bind(mediaId, memberId, dogId).first();
      if (!media?.id) return json({ error: "That private attachment is not available." }, 400);
    }
    const now = new Date().toISOString();
    const memoryId = crypto.randomUUID();
    await db.prepare("INSERT INTO pet_memories (id, member_id, pet_profile_id, title, story, media_id, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)").bind(memoryId, memberId, dogId, title, story, mediaId || null, now).run();
    await syncBrevoContact({
      env: context.env,
      db,
      email: member.email,
      firstName: member.firstName,
      eventType: "private_memory_saved",
      eventProperties: { memory_id: memoryId, pet_id: dogId, has_media: Boolean(mediaId) },
      notificationProperties: { pet_name: pet.dogName, has_media: Boolean(mediaId) },
      listKeys: ["BREVO_CARE_CIRCLE_LIST_ID"],
    });
    return json({ message: "Saved to the private memory timeline." });
  } catch {
    return json({ error: "We could not save that memory right now." }, 503);
  }
}

import { syncBrevoContact } from "../_lib/brevo.js";
import { authenticatedMember, memberDog } from "../_lib/members.js";

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
const publicTopic = (topic) => ({ mobility: "Mobility & movement", sleep: "Sleep & settling", appetite: "Daily routine", litter: "Daily routine", cognition: "Daily routine", quality: "Good days", vet: "Vet visits", products: "Daily routine" }[topic] || "Daily routine");

export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch { return json({ error: "We could not read that request." }, 400); }
  const memberId = cleanText(body.memberId, 80);
  const memberToken = cleanText(body.memberToken, 160);
  const dogId = cleanText(body.dogId, 80);
  const conversationId = cleanText(body.conversationId, 80);
  try {
    const db = context.env.WAITLIST_DB;
    const member = await authenticatedMember(db, memberId, memberToken);
    if (!member?.id) return json({ error: "Reopen your pet account before publishing." }, 401);
    const pet = await memberDog(db, dogId, memberId);
    if (!pet?.id) return json({ error: "We could not find that pet profile." }, 404);
    const conversation = await db.prepare("SELECT id, title, topic, status FROM care_chat_conversations WHERE id = ?1 AND member_id = ?2 AND pet_profile_id = ?3").bind(conversationId, memberId, dogId).first();
    if (!conversation?.id) return json({ error: "That conversation is not available." }, 404);
    if (conversation.status === "published") return json({ message: "This conversation is already in Care Circle." });
    const messages = await db.prepare("SELECT role, body FROM care_chat_messages WHERE conversation_id = ?1 ORDER BY created_at ASC").bind(conversationId).all();
    const question = messages.results?.find((item) => item.role === "user")?.body || conversation.title;
    const answer = messages.results?.find((item) => item.role === "assistant")?.body || "A care question worth discussing together.";
    const combined = cleanText(`${question} ${answer}`, 800);
    if (/@|\b\d{3}[-. )]+\d{3}[-. ]+\d{4}\b/.test(combined)) return json({ error: "Remove email addresses or phone numbers before publishing." }, 400);
    const now = new Date().toISOString();
    const postId = crypto.randomUUID();
    await db.batch([
      db.prepare("INSERT INTO care_circle_posts (id, member_id, dog_profile_id, dog_name, topic, body, group_id, care_chat_conversation_id, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL, ?7, 'approved', ?8, ?8)").bind(postId, memberId, dogId, pet.dogName, publicTopic(conversation.topic), combined, conversationId, now),
      db.prepare("UPDATE care_chat_conversations SET privacy = 'public', status = 'published', updated_at = ?1 WHERE id = ?2").bind(now, conversationId),
    ]);
    await syncBrevoContact({
      env: context.env,
      db,
      email: member.email,
      firstName: member.firstName,
      eventType: "care_lesson_published",
      notificationSubject: `WoafMeow: Public Care Lesson created — ${pet.dogName}`,
      eventProperties: { conversation_id: conversationId, post_id: postId, pet_id: dogId, topic: conversation.topic },
      notificationProperties: { pet_name: pet.dogName, topic: conversation.topic },
      listKeys: ["BREVO_CARE_CIRCLE_LIST_ID"],
    });
    return json({ message: "Published to Care Circle. Other owners can now respond, save, and share it.", postId });
  } catch {
    return json({ error: "We could not publish that conversation right now." }, 503);
  }
}

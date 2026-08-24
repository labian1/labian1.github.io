import { syncBrevoContact } from "../_lib/brevo.js";
import { authenticatedMember } from "../_lib/members.js";

const json = (payload, status = 200) => new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);

export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch { return json({ error: "We could not read that action." }, 400); }
  const memberId = cleanText(body.memberId, 80);
  const memberToken = cleanText(body.memberToken, 160);
  const postId = cleanText(body.postId, 80);
  const action = cleanText(body.action, 20);
  if (!new Set(["helpful", "save"]).has(action)) return json({ error: "That action is not available." }, 400);
  try {
    const db = context.env.WAITLIST_DB;
    const member = await authenticatedMember(db, memberId, memberToken);
    if (!member?.id) return json({ error: "Create or reopen your pet account first." }, 401);
    const post = await db.prepare("SELECT id FROM care_circle_posts WHERE id = ?1 AND status = 'approved'").bind(postId).first();
    if (!post?.id) return json({ error: "That conversation is no longer available." }, 404);
    const table = action === "helpful" ? "care_circle_reactions" : "care_circle_saves";
    const exists = await db.prepare(`SELECT post_id FROM ${table} WHERE post_id = ?1 AND member_id = ?2`).bind(postId, memberId).first();
    if (exists?.post_id) await db.prepare(`DELETE FROM ${table} WHERE post_id = ?1 AND member_id = ?2`).bind(postId, memberId).run();
    else if (action === "helpful") await db.prepare("INSERT INTO care_circle_reactions (post_id, member_id, reaction, created_at) VALUES (?1, ?2, 'helpful', ?3)").bind(postId, memberId, new Date().toISOString()).run();
    else await db.prepare("INSERT INTO care_circle_saves (post_id, member_id, created_at) VALUES (?1, ?2, ?3)").bind(postId, memberId, new Date().toISOString()).run();
    const active = !exists?.post_id;
    await syncBrevoContact({
      env: context.env,
      db,
      email: member.email,
      firstName: member.firstName,
      eventType: `care_circle_${action}_${active ? "added" : "removed"}`,
      eventProperties: { post_id: postId, action, active },
      notificationProperties: { action, active },
      listKeys: ["BREVO_CARE_CIRCLE_LIST_ID"],
    });
    return json({ active });
  } catch {
    return json({ error: "We could not save that action right now." }, 503);
  }
}

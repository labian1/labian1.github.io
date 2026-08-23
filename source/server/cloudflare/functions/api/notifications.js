import { authenticatedMember } from "../_lib/members.js";

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: "GET, PATCH, OPTIONS" } });
}

export async function onRequestGet(context) {
  const memberId = cleanText(context.request.headers.get("x-care-circle-member"), 80);
  const memberToken = cleanText(context.request.headers.get("x-care-circle-token"), 160);
  try {
    const db = context.env.WAITLIST_DB;
    const member = await authenticatedMember(db, memberId, memberToken);
    if (!member?.id) return json({ error: "Reopen your account to see notifications." }, 401);
    const result = await db.prepare("SELECT id, kind, title, body, href, is_read AS isRead, created_at AS createdAt FROM app_notifications WHERE member_id = ?1 ORDER BY created_at DESC LIMIT 30").bind(memberId).all();
    const notifications = result.results || [];
    return json({ notifications, unread: notifications.filter((item) => Number(item.isRead) === 0).length });
  } catch {
    return json({ error: "We could not load notifications right now." }, 503);
  }
}

export async function onRequestPatch(context) {
  let body;
  try { body = await context.request.json(); } catch { return json({ error: "We could not read that action." }, 400); }
  const memberId = cleanText(body.memberId, 80);
  const memberToken = cleanText(body.memberToken, 160);
  const notificationId = cleanText(body.notificationId, 80);
  try {
    const db = context.env.WAITLIST_DB;
    const member = await authenticatedMember(db, memberId, memberToken);
    if (!member?.id) return json({ error: "Reopen your account first." }, 401);
    if (notificationId) {
      await db.prepare("UPDATE app_notifications SET is_read = 1 WHERE id = ?1 AND member_id = ?2").bind(notificationId, memberId).run();
    } else {
      await db.prepare("UPDATE app_notifications SET is_read = 1 WHERE member_id = ?1").bind(memberId).run();
    }
    return json({ message: "Notifications marked as read." });
  } catch {
    return json({ error: "We could not update notifications." }, 503);
  }
}

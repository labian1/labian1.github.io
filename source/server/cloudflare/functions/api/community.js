import { syncBrevoContact } from "../_lib/brevo.js";
import { authenticatedMember, memberDog } from "../_lib/members.js";

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
const topics = new Set(["Daily routine", "Mobility & movement", "Sleep & settling", "Vet visits", "Good days"]);

const cleanMediaIds = (value) =>
  [...new Set(Array.isArray(value) ? value.map((item) => cleanText(item, 80)).filter(Boolean) : [])].slice(0, 3);

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: "GET, POST, OPTIONS" } });
}

export async function onRequestGet(context) {
  try {
    const db = context.env.WAITLIST_DB;
    const memberId = cleanText(context.request.headers.get("x-care-circle-member"), 80);
    const memberToken = cleanText(context.request.headers.get("x-care-circle-token"), 160);
    const viewer = memberId && memberToken ? await authenticatedMember(db, memberId, memberToken) : null;
    const postsResult = await db
      .prepare("SELECT p.id, p.group_id AS groupId, p.care_chat_conversation_id AS conversationId, p.dog_name AS dogName, p.topic, p.body, p.created_at AS createdAt, g.title AS groupTitle FROM care_circle_posts p LEFT JOIN care_circle_groups g ON g.id = p.group_id WHERE p.status = 'approved' AND (p.group_id IS NULL OR g.status = 'approved') ORDER BY p.created_at DESC LIMIT 36")
      .all();
    const posts = postsResult.results || [];
    if (!posts.length) return json({ posts: [] });

    const postIds = posts.map((post) => post.id);
    const placeholders = postIds.map((_, index) => `?${index + 1}`).join(", ");
    const viewerPlaceholders = postIds.map((_, index) => `?${index + 2}`).join(", ");
    const [repliesResult, mediaResult, reactionsResult, savesResult] = await Promise.all([
      db
        .prepare(`SELECT post_id AS postId, dog_name AS dogName, body, created_at AS createdAt FROM care_circle_replies WHERE status = 'approved' AND post_id IN (${placeholders}) ORDER BY created_at ASC`)
        .bind(...postIds)
        .all(),
      db
        .prepare(`SELECT pm.post_id AS postId, m.id, m.media_kind AS mediaKind, m.mime_type AS mimeType FROM care_circle_post_media pm JOIN care_circle_media m ON m.id = pm.media_id WHERE m.status = 'approved' AND pm.post_id IN (${placeholders}) ORDER BY pm.position ASC`)
        .bind(...postIds)
        .all(),
      db.prepare(`SELECT post_id AS postId, COUNT(*) AS count FROM care_circle_reactions WHERE post_id IN (${placeholders}) GROUP BY post_id`).bind(...postIds).all(),
      db.prepare(`SELECT post_id AS postId, COUNT(*) AS count FROM care_circle_saves WHERE post_id IN (${placeholders}) GROUP BY post_id`).bind(...postIds).all(),
    ]);
    const repliesByPost = new Map();
    for (const reply of repliesResult.results || []) {
      const replies = repliesByPost.get(reply.postId) || [];
      replies.push({ dogName: reply.dogName, body: reply.body, createdAt: reply.createdAt });
      repliesByPost.set(reply.postId, replies);
    }
    const mediaByPost = new Map();
    for (const media of mediaResult.results || []) {
      const assets = mediaByPost.get(media.postId) || [];
      assets.push({ id: media.id, mediaKind: media.mediaKind, mimeType: media.mimeType, url: `/api/media/${media.id}` });
      mediaByPost.set(media.postId, assets);
    }
    const reactionCounts = new Map((reactionsResult.results || []).map((item) => [item.postId, Number(item.count || 0)]));
    const saveCounts = new Map((savesResult.results || []).map((item) => [item.postId, Number(item.count || 0)]));
    let viewerHelpful = new Set();
    let viewerSaved = new Set();
    if (viewer?.id) {
      const [helpfulResult, savedResult] = await Promise.all([
        db.prepare(`SELECT post_id AS postId FROM care_circle_reactions WHERE member_id = ?1 AND post_id IN (${viewerPlaceholders})`).bind(viewer.id, ...postIds).all(),
        db.prepare(`SELECT post_id AS postId FROM care_circle_saves WHERE member_id = ?1 AND post_id IN (${viewerPlaceholders})`).bind(viewer.id, ...postIds).all(),
      ]);
      viewerHelpful = new Set((helpfulResult.results || []).map((item) => item.postId));
      viewerSaved = new Set((savedResult.results || []).map((item) => item.postId));
    }
    return json({
      posts: posts.map((post) => ({
        ...post,
        replies: repliesByPost.get(post.id) || [],
        media: mediaByPost.get(post.id) || [],
        helpfulCount: reactionCounts.get(post.id) || 0,
        saveCount: saveCounts.get(post.id) || 0,
        viewerHelpful: viewerHelpful.has(post.id),
        viewerSaved: viewerSaved.has(post.id),
      })),
    });
  } catch {
    return json({ error: "We could not load Care Circle right now." }, 503);
  }
}

export async function onRequestPost(context) {
  const contentType = context.request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return json({ error: "Use a JSON request." }, 415);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "We could not read that update." }, 400);
  }

  const memberId = cleanText(body.memberId, 80);
  const memberToken = cleanText(body.memberToken, 160);
  const dogId = cleanText(body.dogId, 80);
  const kind = cleanText(body.kind, 12) || "post";
  const postId = cleanText(body.postId, 80);
  const groupId = cleanText(body.groupId, 80);
  const topic = cleanText(body.topic, 40);
  const postBody = cleanText(body.body, 800);
  const mediaIds = cleanMediaIds(body.mediaIds);

  if (!memberId || !memberToken || !dogId) return json({ error: "Enroll your pet before joining Care Circle." }, 401);
  if (kind !== "post" && kind !== "reply") return json({ error: "We could not understand that Care Circle action." }, 400);
  if (kind === "post" && !topics.has(topic)) return json({ error: "Choose a Care Circle topic." }, 400);
  if (kind === "post" && postBody.length < 24) return json({ error: "Add a little more detail so another owner can understand the moment." }, 400);
  if (kind === "reply" && postBody.length < 12) return json({ error: "Add a little more detail so your reply is useful." }, 400);
  if (kind === "reply" && mediaIds.length) return json({ error: "Replies are text-only for now. Add a photo or recording to a new update instead." }, 400);

  try {
    const db = context.env.WAITLIST_DB;
    const member = await authenticatedMember(db, memberId, memberToken);
    if (!member?.id) return json({ error: "This profile session has expired. Create the profile again to continue." }, 401);
    const dog = await memberDog(db, dogId, memberId);
    if (!dog?.dogName) return json({ error: "We could not find that pet profile." }, 404);
    const now = new Date().toISOString();

    if (kind === "reply") {
      if (!postId) return json({ error: "Choose a Care Circle conversation to reply to." }, 400);
      const post = await db.prepare("SELECT id, member_id AS memberId, dog_name AS dogName FROM care_circle_posts WHERE id = ?1 AND status = 'approved'").bind(postId).first();
      if (!post?.id) return json({ error: "That conversation is no longer available for replies." }, 404);
      const operations = [
        db.prepare("INSERT INTO care_circle_replies (id, post_id, member_id, dog_name, body, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, 'approved', ?6, ?6)")
          .bind(crypto.randomUUID(), postId, memberId, dog.dogName, postBody, now),
      ];
      if (post.memberId !== memberId) {
        operations.push(
          db.prepare("INSERT INTO app_notifications (id, member_id, kind, title, body, href, is_read, created_at) VALUES (?1, ?2, 'care-circle-reply', ?3, ?4, '/senior-care-platform/community/#conversations', 0, ?5)")
            .bind(crypto.randomUUID(), post.memberId, `${dog.dogName}'s family replied`, `A new reply was added to ${post.dogName}'s public lesson.`, now)
        );
      }
      await db.batch(operations);
      await syncBrevoContact({
        env: context.env,
        db,
        email: member.email,
        firstName: member.firstName,
        eventType: "care_circle_reply",
        eventProperties: { post_id: postId, pet_id: dogId },
        notificationProperties: { pet_name: dog.dogName, action: "reply added" },
        listKeys: ["BREVO_CARE_CIRCLE_LIST_ID"],
      });
      return json({ message: "Your reply is now part of this Care Circle conversation." });
    }

    if (groupId) {
      const group = await db.prepare("SELECT id FROM care_circle_groups WHERE id = ?1 AND status = 'approved'").bind(groupId).first();
      if (!group?.id) return json({ error: "That circle is not available for new updates yet." }, 404);
      const membership = await db.prepare("SELECT group_id FROM care_circle_group_members WHERE group_id = ?1 AND member_id = ?2").bind(groupId, memberId).first();
      if (!membership?.group_id) return json({ error: "Join this circle before sharing an update with it." }, 403);
    }

    for (const mediaId of mediaIds) {
      const media = await db
        .prepare("SELECT id FROM care_circle_media WHERE id = ?1 AND member_id = ?2 AND dog_profile_id = ?3 AND status = 'pending'")
        .bind(mediaId, memberId, dogId)
        .first();
      if (!media?.id) return json({ error: "One of the selected attachments is no longer available. Please upload it again." }, 400);
    }

    const newPostId = crypto.randomUUID();
    await db
      .prepare("INSERT INTO care_circle_posts (id, member_id, dog_profile_id, dog_name, topic, body, group_id, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'pending', ?8, ?8)")
      .bind(newPostId, memberId, dogId, dog.dogName, topic, postBody, groupId || null, now)
      .run();
    for (const [position, mediaId] of mediaIds.entries()) {
      await db.prepare("INSERT INTO care_circle_post_media (post_id, media_id, position) VALUES (?1, ?2, ?3)").bind(newPostId, mediaId, position).run();
    }
    await syncBrevoContact({
      env: context.env,
      db,
      email: member.email,
      firstName: member.firstName,
      eventType: "care_circle_update",
      eventProperties: { post_id: newPostId, pet_id: dogId, topic, has_media: mediaIds.length > 0 },
      notificationProperties: { pet_name: dog.dogName, topic, has_media: mediaIds.length > 0 },
      listKeys: ["BREVO_CARE_CIRCLE_LIST_ID"],
    });
    return json({ message: "Your update is in the review queue. We will publish it after a quick check to keep Care Circle safe and useful." });
  } catch {
    return json({ error: "We could not save that update right now. Please try again." }, 503);
  }
}

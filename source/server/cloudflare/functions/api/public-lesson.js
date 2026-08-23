const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: "GET, OPTIONS" } });
}

export async function onRequestGet(context) {
  const postId = cleanText(new URL(context.request.url).searchParams.get("postId"), 80);
  if (!postId) return json({ error: "Choose a public lesson." }, 400);
  try {
    const db = context.env.WAITLIST_DB;
    const record = await db
      .prepare(
        "SELECT p.id AS postId, p.care_chat_conversation_id AS conversationId, c.title, c.topic, c.privacy FROM care_circle_posts p JOIN care_chat_conversations c ON c.id = p.care_chat_conversation_id WHERE p.id = ?1 AND p.status = 'approved' AND c.privacy = 'public' AND c.status = 'published'"
      )
      .bind(postId)
      .first();
    if (!record?.conversationId) return json({ error: "That public lesson is not available." }, 404);
    const messages = await db
      .prepare("SELECT role, body, payload_json AS payloadJson FROM care_chat_messages WHERE conversation_id = ?1 ORDER BY created_at ASC")
      .bind(record.conversationId)
      .all();
    const ownerMessage = (messages.results || []).find((message) => message.role === "user");
    const assistantMessage = (messages.results || []).find((message) => message.role === "assistant");
    let answer;
    try {
      answer = JSON.parse(assistantMessage?.payloadJson || "null");
    } catch {
      answer = null;
    }
    if (!answer) return json({ error: "That public lesson could not be opened." }, 422);
    return json({
      conversationId: record.conversationId,
      question: ownerMessage?.body || record.title,
      privacy: "public",
      published: true,
      answer,
      saved: true,
    });
  } catch (error) {
    console.error("public-lesson", error);
    return json({ error: "We could not open that public lesson right now." }, 503);
  }
}

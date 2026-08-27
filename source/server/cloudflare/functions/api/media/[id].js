const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

import { authenticatedMember } from "../../_lib/members.js";

export async function onRequestGet(context) {
  if (!context.env.CARE_CIRCLE_MEDIA) {
    return json({ error: "Care Circle attachments are temporarily unavailable." }, 503);
  }
  try {
    const media = await context.env.WAITLIST_DB
      .prepare("SELECT r2_key AS r2Key, mime_type AS mimeType, status, member_id AS memberId FROM care_circle_media WHERE id = ?1 AND status IN ('approved', 'private')")
      .bind(context.params.id)
      .first();
    if (!media?.r2Key) return json({ error: "This Care Circle attachment is not available." }, 404);
    if (media.status === "private") {
      const url = new URL(context.request.url);
      const memberId = context.request.headers.get("x-care-circle-member") || url.searchParams.get("memberId") || "";
      const memberToken = context.request.headers.get("x-care-circle-token") || url.searchParams.get("memberToken") || "";
      const member = await authenticatedMember(context.env.WAITLIST_DB, memberId, memberToken);
      if (!member?.id || member.id !== media.memberId) return json({ error: "This private memory is not available." }, 403);
    }
    const object = await context.env.CARE_CIRCLE_MEDIA.get(media.r2Key);
    if (!object) return json({ error: "This Care Circle attachment is not available." }, 404);
    return new Response(object.body, {
      headers: {
        "content-type": media.mimeType,
        "cache-control": media.status === "private" ? "private, no-store" : "public, max-age=3600",
      },
    });
  } catch {
    return json({ error: "We could not load that Care Circle attachment right now." }, 503);
  }
}

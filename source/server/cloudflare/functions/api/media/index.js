import { syncBrevoContact } from "../../_lib/brevo.js";
import { authenticatedMember, memberDog } from "../../_lib/members.js";

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
const maxFileSize = 20 * 1024 * 1024;

const mediaKind = (mimeType) => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "";
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: "POST, OPTIONS" } });
}

export async function onRequestPost(context) {
  if (!context.env.CARE_CIRCLE_MEDIA) {
    return json({ error: "Care Circle uploads are temporarily unavailable. Your file was not uploaded." }, 503);
  }
  const contentType = context.request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) return json({ error: "Choose a photo, video, or voice recording to upload." }, 415);

  try {
    const form = await context.request.formData();
    const memberId = cleanText(form.get("memberId"), 80);
    const memberToken = cleanText(form.get("memberToken"), 160);
    const dogId = cleanText(form.get("dogId"), 80);
    const requestedPurpose = cleanText(form.get("purpose"), 20);
    const purpose = new Set(["memory", "profile"]).has(requestedPurpose) ? requestedPurpose : "community";
    const file = form.get("file");
    if (!memberId || !memberToken || !dogId) return json({ error: "Enroll your pet before uploading a Care Circle update." }, 401);
    if (!file || typeof file !== "object" || typeof file.arrayBuffer !== "function") return json({ error: "Choose a photo, video, or voice recording." }, 400);
    const mimeType = cleanText(file.type, 100).toLowerCase();
    const kind = mediaKind(mimeType);
    if (!kind) return json({ error: "Upload an image, short video, or voice recording." }, 400);
    if (purpose === "profile" && kind !== "image") return json({ error: "Choose an image for the profile photo." }, 400);
    if (file.size > maxFileSize) return json({ error: "Keep each upload under 20 MB so Care Circle stays quick for everyone." }, 400);

    const db = context.env.WAITLIST_DB;
    const member = await authenticatedMember(db, memberId, memberToken);
    if (!member?.id) return json({ error: "This profile session has expired. Create the profile again to continue." }, 401);
    const dog = await memberDog(db, dogId, memberId);
    if (!dog?.id) return json({ error: "We could not find that pet profile." }, 404);

    const mediaId = crypto.randomUUID();
    const safeFilename = cleanText(file.name, 120) || `${kind}-update`;
    const status = purpose === "community" ? "pending" : "private";
    const key = `${status}/${memberId}/${mediaId}`;
    await context.env.CARE_CIRCLE_MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: mimeType } });
    await db
      .prepare("INSERT INTO care_circle_media (id, member_id, dog_profile_id, r2_key, media_kind, mime_type, filename, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)")
      .bind(mediaId, memberId, dogId, key, kind, mimeType, safeFilename, status, new Date().toISOString())
      .run();
    if (purpose === "profile") {
      await db.prepare("UPDATE dog_profiles SET profile_media_id = ?1, updated_at = ?2 WHERE id = ?3 AND member_id = ?4")
        .bind(mediaId, new Date().toISOString(), dogId, memberId).run();
    }
    await syncBrevoContact({
      env: context.env,
      db,
      email: member.email,
      firstName: member.firstName,
      eventType: "care_circle_media_uploaded",
      eventProperties: { media_id: mediaId, pet_id: dogId, media_kind: kind, purpose },
      notificationProperties: { pet_name: dog.dogName, media_kind: kind, purpose },
      listKeys: ["BREVO_CARE_CIRCLE_LIST_ID"],
    });
    return json({ media: { id: mediaId, mediaKind: kind, filename: safeFilename, purpose } });
  } catch {
    return json({ error: "We could not save that attachment right now. Please try again." }, 503);
  }
}

import { sendBrevoEmail } from "../_lib/brevo.js";
import { authenticatedMember, memberDog } from "../_lib/members.js";

const allowedOrigins = new Set([
  "https://labian1.github.io",
  "https://woafmeow.com",
  "https://www.woafmeow.com",
]);
const corsHeaders = (request) => {
  const origin = request?.headers?.get("origin") || "";
  const localOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return {
    ...(allowedOrigins.has(origin) || localOrigin
      ? { "access-control-allow-origin": origin }
      : {}),
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
};
const json = (payload, status = 200, request) => new Response(JSON.stringify(payload), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...corsHeaders(request),
  },
});
const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const stateLabel = (value) => ({ same: "About the same", different: "Different", "not-sure": "Not sure" }[value] || value || "Not recorded");
const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");
const formatEmailDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date not recorded"
    : new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(date);
};
const timelineLabel = (entries) => {
  const dates = entries
    .map((entry) => String(entry.createdAt || ""))
    .filter(Boolean)
    .sort();
  if (!dates.length) return formatEmailDate(new Date());
  const first = formatEmailDate(dates[0]);
  const last = formatEmailDate(dates.at(-1));
  return first === last ? first : `${first}–${last}`;
};
const base64 = (value) => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: { allow: "POST, OPTIONS", ...corsHeaders(context.request) } });
}

export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch { return json({ error: "We could not read that email request." }, 400, context.request); }
  const memberId = cleanText(body.memberId, 80);
  const memberToken = cleanText(body.memberToken, 160);
  const dogId = cleanText(body.dogId, 80);
  const email = cleanText(body.email, 254).toLowerCase();
  if (!validEmail(email)) return json({ error: "Enter a valid veterinary email address." }, 400, context.request);

  try {
    const db = context.env.WAITLIST_DB;
    const member = await authenticatedMember(db, memberId, memberToken);
    if (!member?.id) return json({ error: "Reopen your care account before sending a record." }, 401, context.request);
    const pet = await memberDog(db, dogId, memberId);
    if (!pet?.id) return json({ error: "We could not find that pet profile." }, 404, context.request);
    const result = await db.prepare("SELECT day_number AS dayNumber, prompt, sleep_state AS sleep, mobility_state AS mobility, appetite_state AS appetite, note, created_at AS createdAt FROM dog_checkins WHERE dog_profile_id = ?1 ORDER BY created_at ASC").bind(dogId).all();
    const entries = result.results || [];
    const changed = entries.filter((entry) => [entry.sleep, entry.mobility, entry.appetite].includes("different"));
    const summary = [
      "WOAFMEOW HEALTH SUMMARY FOR VETERINARY REVIEW",
      `Prepared: ${new Date().toISOString().slice(0, 10)}`,
      "",
      `Pet: ${pet.dogName}`,
      `Species: ${pet.species || "Not recorded"}`,
      `Breed/type: ${pet.breed || "Not recorded"}`,
      `Age: ${pet.ageYears ?? "Not recorded"} years`,
      `Weight: ${pet.weightLbs ?? "Not recorded"}${pet.weightLbs ? " lb" : ""}`,
      `Care focus: ${pet.focus || "Not recorded"}`,
      `Known health conditions: ${pet.healthConditions || "None recorded"}`,
      `Medicines and supplements: ${pet.medications || "None recorded"}`,
      `Usual routine: ${pet.routineNotes || "None recorded"}`,
      "",
      `Saved observations: ${entries.length}`,
      `Observations with a reported change: ${changed.length}`,
      ...entries.slice(-7).flatMap((entry) => [
        "",
        `${entry.createdAt?.slice(0, 10) || `Day ${entry.dayNumber || "saved"}`}: ${entry.prompt || "Daily observation"}`,
        `Sleep: ${stateLabel(entry.sleep)}; movement: ${stateLabel(entry.mobility)}; appetite: ${stateLabel(entry.appetite)}`,
        `Owner note: ${entry.note || "No note added"}`,
      ]),
      "",
      "This owner-prepared record supports a veterinary conversation and is not a diagnosis.",
    ].join("\n");
    const csvRows = [
      ["record_type", "date", "field", "value"],
      ["profile", "", "pet_name", pet.dogName],
      ["profile", "", "species", pet.species],
      ["profile", "", "breed_or_type", pet.breed],
      ["profile", "", "age_years", pet.ageYears],
      ["profile", "", "weight_lb", pet.weightLbs],
      ["profile", "", "care_focus", pet.focus],
      ["profile", "", "known_health_conditions", pet.healthConditions],
      ["profile", "", "medicines_and_supplements", pet.medications],
      ["profile", "", "usual_routine", pet.routineNotes],
      ...entries.flatMap((entry) => [
        ["observation", entry.createdAt, "prompt", entry.prompt],
        ["observation", entry.createdAt, "sleep", entry.sleep],
        ["observation", entry.createdAt, "movement", entry.mobility],
        ["observation", entry.createdAt, "appetite", entry.appetite],
        ["observation", entry.createdAt, "owner_note", entry.note],
      ]),
    ];
    const originalRecords = csvRows.map((row) => row.map(csvCell).join(",")).join("\n");
    const safeName = pet.dogName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "pet";
    const timeline = timelineLabel(entries);
    const subject = `${pet.dogName}'s health timeline and original records — ${timeline}`;
    const delivery = await sendBrevoEmail({
      env: context.env,
      to: email,
      subject,
      recipientName: "Veterinary team",
      htmlContent: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#2c2521;line-height:1.6"><p style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#b64f31;font-weight:700">WoafMeow Health Timeline</p><h1 style="font-family:Georgia,serif;color:#17382d;font-size:32px;line-height:1.15">${escapeHtml(pet.dogName)}'s health timeline and records</h1><p>WoafMeow helps dog families organize changes noticed at home and original care records into a clearer timeline for veterinary review.</p><p><strong>${escapeHtml(member.firstName || "A pet parent")}</strong> shared the following for <strong>${escapeHtml(pet.dogName)}</strong> covering <strong>${escapeHtml(timeline)}</strong>:</p><ol><li>A concise, readable health summary.</li><li>The original profile fields and saved observations in CSV format.</li></ol><p>Please review the attached records and advise which findings need an appointment, testing, or a change in the current care plan.</p><p style="font-size:13px;color:#6d625d">This owner-prepared record supports a veterinary conversation and is not a diagnosis.</p></div>`,
      attachments: [
        { name: `${safeName}-health-summary.txt`, content: base64(summary) },
        { name: `${safeName}-original-health-records.csv`, content: base64(originalRecords) },
      ],
      senderEmail: "hello@woafmeow.com",
    });
    if (delivery.status !== "sent") return json({ error: "The veterinary email was not sent. No delivery was claimed; check the address and try again.", delivery: "failed" }, 503, context.request);
    return json({ message: `Sent from hello@woafmeow.com to ${email} with the health summary and original health records attached.`, delivery: "sent", sender: "hello@woafmeow.com", subject, attachmentCount: 2 }, 200, context.request);
  } catch (error) {
    if (error instanceof Response) throw error;
    return json({ error: "The veterinary email was not sent. Please try again.", delivery: "failed" }, 503, context.request);
  }
}

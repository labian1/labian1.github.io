import { sendBrevoEmail } from "../_lib/brevo.js";
import { authenticatedMember, memberDog } from "../_lib/members.js";

const json = (payload, status = 200) => new Response(JSON.stringify(payload), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});
const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const stateLabel = (value) => ({ same: "About the same", different: "Different", "not-sure": "Not sure" }[value] || value || "Not recorded");
const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const base64 = (value) => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: "POST, OPTIONS" } });
}

export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch { return json({ error: "We could not read that email request." }, 400); }
  const memberId = cleanText(body.memberId, 80);
  const memberToken = cleanText(body.memberToken, 160);
  const dogId = cleanText(body.dogId, 80);
  const email = cleanText(body.email, 254).toLowerCase();
  if (!validEmail(email)) return json({ error: "Enter a valid veterinary email address." }, 400);

  try {
    const db = context.env.WAITLIST_DB;
    const member = await authenticatedMember(db, memberId, memberToken);
    if (!member?.id) return json({ error: "Reopen your care account before sending a record." }, 401);
    const pet = await memberDog(db, dogId, memberId);
    if (!pet?.id) return json({ error: "We could not find that pet profile." }, 404);
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
    const delivery = await sendBrevoEmail({
      env: context.env,
      to: email,
      subject: `${pet.dogName}'s health summary and original care record`,
      recipientName: "Veterinary team",
      htmlContent: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#2c2521"><h1 style="color:#17382d">${pet.dogName}'s health record</h1><p>${member.firstName || "A pet parent"} shared two attachments for veterinary review:</p><ol><li>A concise, readable health summary.</li><li>The original profile fields and saved observations in CSV format.</li></ol><p>This owner-prepared record supports a veterinary conversation and is not a diagnosis.</p></div>`,
      attachments: [
        { name: `${safeName}-health-summary.txt`, content: base64(summary) },
        { name: `${safeName}-original-health-records.csv`, content: base64(originalRecords) },
      ],
    });
    if (delivery.status !== "sent") return json({ error: "The veterinary email was not sent. No delivery was claimed; check the address and try again." }, 503);
    return json({ message: `Sent to ${email} with the health summary and original health records attached.`, delivery: "sent", attachmentCount: 2 });
  } catch (error) {
    if (error instanceof Response) throw error;
    return json({ error: "The veterinary email was not sent. Please try again." }, 503);
  }
}

import assert from "node:assert/strict";
import { onRequestPost as sendVetSummary } from "../functions/api/vet-summary.js";
import { onRequestPost as sendGuide } from "../functions/api/newsletter.js";
import { hashToken } from "../functions/_lib/members.js";

const token = "test-member-token";
const tokenHash = await hashToken(token);
const member = { id: "member-1", email: "owner@example.com", firstName: "Avery", location: "Austin", membershipPlan: "free", mobileLinkCode: "" };
const pet = { id: "pet-1", dogName: "Luna", species: "dog", breed: "Labrador mix", ageYears: 12, weightLbs: 58, focus: "mobility", healthConditions: "Arthritis", medications: "Carprofen, morning", routineNotes: "Usually sleeps through the night" };
const entries = [{ dayNumber: 1, prompt: "Morning rise", sleep: "different", mobility: "different", appetite: "same", note: "Needed help after rest", createdAt: "2026-08-24T08:00:00.000Z" }];
const db = {
  prepare(sql) {
    return {
      bind(...values) {
        return {
          async first() {
            if (sql.includes("care_circle_members")) return values[0] === member.id && values[1] === tokenHash ? member : null;
            if (sql.includes("dog_profiles")) return values[0] === pet.id && values[1] === member.id ? pet : null;
            return null;
          },
          async all() { return { results: sql.includes("dog_checkins") ? entries : [] }; },
          async run() { return { success: true }; },
        };
      },
    };
  },
};

const originalFetch = globalThis.fetch;
let capturedEmail;
globalThis.fetch = async (url, options = {}) => {
  if (String(url).includes("/smtp/email")) {
    capturedEmail = JSON.parse(options.body);
    return new Response("{}", { status: 201 });
  }
  return new Response("{}", { status: 201 });
};

const vetResponse = await sendVetSummary({
  env: { WAITLIST_DB: db, BREVO_API_KEY: "test-key", BREVO_SENDER_EMAIL: "care@woafmeow.com" },
  request: new Request("https://example.test/api/vet-summary", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ memberId: member.id, memberToken: token, dogId: pet.id, email: "vet@example.com" }) }),
});
const vetResult = await vetResponse.json();
assert.equal(vetResponse.status, 200);
assert.equal(vetResult.delivery, "sent");
assert.equal(capturedEmail.attachment.length, 2);
assert.match(Buffer.from(capturedEmail.attachment[0].content, "base64").toString(), /WOAFMEOW HEALTH SUMMARY/);
assert.match(Buffer.from(capturedEmail.attachment[1].content, "base64").toString(), /known_health_conditions/);
assert.match(Buffer.from(capturedEmail.attachment[1].content, "base64").toString(), /Needed help after rest/);

globalThis.fetch = async () => new Response("service unavailable", { status: 503 });
const guideResponse = await sendGuide({
  env: { WAITLIST_DB: db, BREVO_API_KEY: "test-key", BREVO_SENDER_EMAIL: "care@woafmeow.com" },
  request: new Request("https://example.test/api/newsletter", { method: "POST", headers: { "content-type": "application/json", origin: "https://labian1.github.io" }, body: JSON.stringify({ email: "owner@example.com", guideConsent: true, marketingConsent: false }) }),
});
const guideResult = await guideResponse.json();
assert.equal(guideResponse.status, 202);
assert.equal(guideResult.delivery, "fallback");
assert.match(guideResult.guideUrl, /^https:\/\//);
assert.doesNotMatch(guideResult.message, /emailed to you/i);

globalThis.fetch = originalFetch;
console.log(JSON.stringify({ vetEmail: { status: vetResponse.status, attachments: capturedEmail.attachment.map((item) => item.name) }, guideFallback: { status: guideResponse.status, delivery: guideResult.delivery, guideUrl: guideResult.guideUrl } }, null, 2));

import assert from "node:assert/strict";
import { onRequestOptions as vetOptions, onRequestPost as sendVetSummary } from "../functions/api/vet-summary.js";
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
const capturedEmails = [];
globalThis.fetch = async (url, options = {}) => {
  if (String(url).includes("/smtp/email")) {
    capturedEmails.push(JSON.parse(options.body));
    return new Response("{}", { status: 201 });
  }
  if (String(url).includes("WoafMeow_Senior_Dog_Care_Field_Guide.pdf")) {
    return new Response(Buffer.from("%PDF-1.7\nverified guide fixture\n"), {
      status: 200,
      headers: { "content-type": "application/pdf" },
    });
  }
  return new Response("{}", { status: 201 });
};

const vetCorsResponse = await vetOptions({
  request: new Request("https://example.test/api/vet-summary", {
    method: "OPTIONS",
    headers: { origin: "https://labian1.github.io" },
  }),
});
assert.equal(vetCorsResponse.status, 204);
assert.equal(vetCorsResponse.headers.get("access-control-allow-origin"), "https://labian1.github.io");

const vetResponse = await sendVetSummary({
  env: { WAITLIST_DB: db, BREVO_API_KEY: "test-key", BREVO_SENDER_EMAIL: "care@woafmeow.com" },
  request: new Request("https://example.test/api/vet-summary", { method: "POST", headers: { "content-type": "application/json", origin: "https://labian1.github.io" }, body: JSON.stringify({ memberId: member.id, memberToken: token, dogId: pet.id, email: "vet@example.com" }) }),
});
const vetResult = await vetResponse.json();
assert.equal(vetResponse.status, 200);
assert.equal(vetResult.delivery, "sent");
assert.equal(vetResult.sender, "hello@woafmeow.com");
const vetEmail = capturedEmails.at(-1);
assert.equal(vetEmail.sender.email, "hello@woafmeow.com");
assert.match(vetEmail.subject, /Luna's health timeline and original records/);
assert.match(vetEmail.subject, /Aug 24, 2026/);
assert.match(vetEmail.htmlContent, /WoafMeow helps dog families organize changes noticed at home/);
assert.match(vetEmail.htmlContent, /Please review the attached records/);
assert.equal(vetEmail.attachment.length, 2);
assert.match(Buffer.from(vetEmail.attachment[0].content, "base64").toString(), /WOAFMEOW HEALTH SUMMARY/);
assert.match(Buffer.from(vetEmail.attachment[1].content, "base64").toString(), /known_health_conditions/);
assert.match(Buffer.from(vetEmail.attachment[1].content, "base64").toString(), /Needed help after rest/);

const sentGuideResponse = await sendGuide({
  env: {
    WAITLIST_DB: db,
    BREVO_API_KEY: "test-key",
    BREVO_SENDER_EMAIL: "hello@woafmeow.com",
    FORM_NOTIFICATION_EMAIL: "robert@example.com",
  },
  request: new Request("https://example.test/api/newsletter", { method: "POST", headers: { "content-type": "application/json", origin: "https://www.woafmeow.com" }, body: JSON.stringify({ email: "owner@example.com", guideConsent: true }) }),
});
const sentGuideResult = await sentGuideResponse.json();
assert.equal(sentGuideResponse.status, 200);
assert.equal(sentGuideResult.delivery, "sent");
assert.equal(sentGuideResult.teamNotification, "sent");
const guideEmail = capturedEmails.find((item) => item.subject === sentGuideResult.subject);
assert.equal(guideEmail.attachment.length, 1);
assert.equal(guideEmail.attachment[0].name, sentGuideResult.attachment);
const guideOwnerNotification = capturedEmails.find((item) => /Senior Dog Care Guide requested/.test(item.subject));
assert.ok(guideOwnerNotification, "guide request must notify the WoafMeow owner");

globalThis.fetch = async () => new Response("service unavailable", { status: 503 });
const failedVetResponse = await sendVetSummary({
  env: { WAITLIST_DB: db, BREVO_API_KEY: "test-key", BREVO_SENDER_EMAIL: "care@woafmeow.com" },
  request: new Request("https://example.test/api/vet-summary", { method: "POST", headers: { "content-type": "application/json", origin: "https://labian1.github.io" }, body: JSON.stringify({ memberId: member.id, memberToken: token, dogId: pet.id, email: "vet@example.com" }) }),
});
const failedVetResult = await failedVetResponse.json();
assert.equal(failedVetResponse.status, 503);
assert.equal(failedVetResult.delivery, "failed");
assert.match(failedVetResult.error, /was not sent/i);
assert.doesNotMatch(failedVetResult.error, /successfully sent|successfully delivered/i);

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
console.log(JSON.stringify({ vetEmail: { status: vetResponse.status, sender: vetResult.sender, subject: vetResult.subject, attachments: vetEmail.attachment.map((item) => item.name), truthfulFailureStatus: failedVetResponse.status }, guideEmail: { status: sentGuideResponse.status, delivery: sentGuideResult.delivery, attachment: sentGuideResult.attachment, teamNotification: sentGuideResult.teamNotification }, guideFallback: { status: guideResponse.status, delivery: guideResult.delivery, guideUrl: guideResult.guideUrl } }, null, 2));

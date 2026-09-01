import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { onRequestPost } from "../functions/api/activity.js";

const fetchCalls = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  fetchCalls.push({ url: String(url), init });
  return new Response("{}", { status: 201, headers: { "content-type": "application/json" } });
};

const db = {
  prepare() {
    return {
      bind() {
        return this;
      },
      async run() {
        return { success: true };
      },
    };
  },
};

const env = {
  WAITLIST_DB: db,
  BREVO_API_KEY: "test-api-key",
  BREVO_SENDER_EMAIL: "hello@woafmeow.com",
  FORM_NOTIFICATION_EMAIL: "owner@example.com",
  BREVO_CARE_CIRCLE_LIST_ID: "12",
};

try {
  const response = await onRequestPost({
    env,
    request: new Request("https://example.test/api/activity", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventType: "care_account_created",
        email: "member@example.com",
        ownerName: "Alex",
        petName: "Bailey",
        properties: { page_path: "/account/", private_note: { hidden: true } },
      }),
    }),
  });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).notification, "sent");
  assert.equal(fetchCalls.length, 3);
  const emailCall = fetchCalls.find(({ url }) => url.endsWith("/smtp/email"));
  assert.ok(emailCall, "Brevo SMTP request was made");
  const emailPayload = JSON.parse(emailCall.init.body);
  assert.equal(emailPayload.subject, "WoafMeow: New account created — Bailey");
  assert.equal(emailPayload.to[0].email, "owner@example.com");
  assert.match(emailPayload.htmlContent, /care_account_created/);
  assert.doesNotMatch(emailPayload.htmlContent, /hidden/);

  fetchCalls.length = 0;
  const invalid = await onRequestPost({
    env,
    request: new Request("https://example.test/api/activity", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventType: "page_view", email: "member@example.com" }),
    }),
  });
  assert.equal(invalid.status, 400);
  assert.equal(fetchCalls.length, 0);

  const frontend = await readFile(new URL("../../../woafypet-unified-preview/app.js", import.meta.url), "utf8");
  for (const eventType of [
    "care_account_created",
    "public_care_lesson_created",
    "health_record_saved",
    "health_timeline_change_saved",
  ]) {
    assert.match(frontend, new RegExp(`notifyWoafMeowOwner\\([\\s\\S]{0,120}[\"']${eventType}[\"']`));
  }
  assert.match(frontend, /await publishProfileQuestion/);
  assert.match(frontend, /await removePublicLesson/);
  console.log("Owner notification tests passed: Brevo delivery, allowlist, privacy filtering, and frontend action hooks.");
} finally {
  globalThis.fetch = originalFetch;
}

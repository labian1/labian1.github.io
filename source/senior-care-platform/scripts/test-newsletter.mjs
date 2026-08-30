#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  onRequestOptions,
  onRequestPost,
} from "../functions/api/newsletter.js";

const origin = "https://labian1.github.io";
const endpoint = "https://woafypet-senior-care.pages.dev/api/newsletter";
const guidePath = resolve(
  import.meta.dirname,
  "..",
  "hostinger-api",
  "WoafMeow_Senior_Dog_Care_Field_Guide.pdf",
);
const guideBytes = await readFile(guidePath);
const env = {
  BREVO_API_KEY: "test-key",
  BREVO_SENDER_EMAIL: "forms@example.com",
};

const request = (body) =>
  new Request(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });

const optionsResponse = await onRequestOptions({
  request: new Request(endpoint, { method: "OPTIONS", headers: { origin } }),
});
assert.equal(optionsResponse.status, 204);
assert.equal(optionsResponse.headers.get("access-control-allow-origin"), origin);

const missingConsent = await onRequestPost({
  request: request({ email: "owner@example.com" }),
  env,
});
assert.equal(missingConsent.status, 400);

let smtpPayload;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = String(input);
  if (url.endsWith("WoafMeow_Senior_Dog_Care_Field_Guide.pdf")) {
    return new Response(guideBytes, {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-length": String(guideBytes.byteLength),
      },
    });
  }
  if (url === "https://api.brevo.com/v3/smtp/email") {
    smtpPayload = JSON.parse(init.body);
    return new Response(JSON.stringify({ messageId: "test-message" }), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  }
  throw new Error(`Unexpected request: ${url}`);
};

try {
  const sentResponse = await onRequestPost({
    request: request({
      email: "owner@example.com",
      guideConsent: true,
      marketingConsent: false,
    }),
    env,
  });
  const sent = await sentResponse.json();
  assert.equal(sentResponse.status, 200);
  assert.equal(sent.delivery, "sent");
  assert.equal(sent.sender, "hello@woafmeow.com");
  assert.equal(sent.subject, "Your 2026 Senior Dog Care Field Guide | WoafMeow");
  assert.equal(sent.attachment, "WoafMeow_Senior_Dog_Care_Field_Guide.pdf");
  assert.equal(sent.updates, "not_requested");
  assert.equal(smtpPayload.sender.email, "hello@woafmeow.com");
  assert.equal(smtpPayload.subject, sent.subject);
  assert.match(smtpPayload.htmlContent, /10,000\+ pet owners/);
  assert.match(smtpPayload.htmlContent, /Explore the WoafyPet Bed/);
  assert.match(smtpPayload.htmlContent, /will not add you to future updates/);
  assert.equal(smtpPayload.attachment.length, 1);
  assert.equal(smtpPayload.attachment[0].name, sent.attachment);
  assert.deepEqual(
    Buffer.from(smtpPayload.attachment[0].content, "base64"),
    guideBytes,
  );

  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.endsWith("WoafMeow_Senior_Dog_Care_Field_Guide.pdf")) {
      return new Response(guideBytes, { status: 200 });
    }
    return new Response(JSON.stringify({ error: "provider failure" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  };
  const fallbackResponse = await onRequestPost({
    request: request({
      email: "owner@example.com",
      guideConsent: true,
      marketingConsent: false,
    }),
    env,
  });
  const fallback = await fallbackResponse.json();
  assert.equal(fallbackResponse.status, 202);
  assert.equal(fallback.delivery, "fallback");
  assert.equal(
    fallback.guideUrl,
    "https://woafypet-senior-care-8kt.pages.dev/assets/WoafMeow_Senior_Dog_Care_Field_Guide.pdf",
  );
} finally {
  globalThis.fetch = originalFetch;
}

console.log(
  `Newsletter delivery test passed: ${guideBytes.byteLength.toLocaleString()} PDF bytes, sender, subject, body, consent, CORS, and truthful fallback.`,
);

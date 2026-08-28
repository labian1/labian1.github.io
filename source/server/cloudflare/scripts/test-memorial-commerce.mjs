#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHmac, webcrypto } from "node:crypto";
import { onRequest as corsMiddleware } from "../functions/api/_middleware.js";
import { onRequestPost as createMemorialCheckout } from "../functions/api/memorial-tree-checkout.js";
import { onRequestPost as receiveStripeWebhook } from "../functions/api/stripe-webhook.js";
import { onRequestPost as submitContact } from "../functions/api/contact.js";

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const state = {
  events: new Map(),
  order: null,
  runs: [],
};

const db = {
  prepare(sql) {
    let values = [];
    return {
      bind(...nextValues) {
        values = nextValues;
        return this;
      },
      async run() {
        state.runs.push({ sql, values });
        if (sql.startsWith("INSERT INTO memorial_tree_orders")) {
          state.order = {
            id: values[0],
            email: values[1],
            customerName: values[2],
            petName: values[3],
            memory: values[4],
            amountCents: values[5],
            confirmationEmailStatus: "pending",
          };
        }
        if (sql.startsWith("INSERT OR IGNORE INTO stripe_webhook_events") && !state.events.has(values[0])) {
          state.events.set(values[0], "processing");
        }
        if (sql.includes("stripe_webhook_events SET status = 'processing'")) state.events.set(values[1], "processing");
        if (sql.includes("stripe_webhook_events SET status = 'processed'")) state.events.set(values[1], "processed");
        if (sql.includes("stripe_webhook_events SET status = 'failed'")) state.events.set(values[2], "failed");
        if (sql.includes("confirmation_email_status = 'sent'")) state.order.confirmationEmailStatus = "sent";
        return { success: true };
      },
      async first() {
        if (sql.includes("SELECT status FROM stripe_webhook_events")) return { status: state.events.get(values[0]) };
        if (sql.includes("FROM memorial_tree_orders")) return state.order;
        return null;
      },
      async all() {
        return { results: [] };
      },
    };
  },
};

const originalFetch = globalThis.fetch;
const fetchCalls = [];
globalThis.fetch = async (url, options = {}) => {
  fetchCalls.push({ url: String(url), options });
  if (String(url).includes("api.stripe.com")) {
    return new Response(JSON.stringify({ id: "cs_test_memorial", url: "https://checkout.stripe.com/c/pay/test-memorial" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ messageId: "brevo-test" }), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
};

try {
  const corsResponse = await corsMiddleware({
    request: new Request("https://woafypet-senior-care-8kt.pages.dev/api/contact", {
      method: "OPTIONS",
      headers: { origin: "https://www.woafmeow.com" },
    }),
    next: async () => new Response("unused"),
  });
  assert.equal(corsResponse.status, 204);
  assert.equal(corsResponse.headers.get("access-control-allow-origin"), "https://www.woafmeow.com");
  assert.match(corsResponse.headers.get("access-control-allow-methods"), /POST/);

  const checkoutResponse = await createMemorialCheckout({
    request: new Request("https://woafypet-senior-care-8kt.pages.dev/api/memorial-tree-checkout", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://www.woafmeow.com" },
      body: JSON.stringify({
        name: "Taylor Example",
        email: "taylor@example.com",
        petName: "Bobby",
        meaning: "He made every ordinary walk feel important.",
        pageContext: "https://www.woafmeow.com/memorial-tree/",
      }),
    }),
    env: {
      WAITLIST_DB: db,
      STRIPE_SECRET_KEY: "sk_test_not_real",
      BREVO_API_KEY: "brevo-test",
      BREVO_SENDER_EMAIL: "hello@woafmeow.com",
      FORM_NOTIFICATION_EMAIL: "robert@example.com",
    },
  });
  assert.equal(checkoutResponse.status, 200);
  const checkoutPayload = await checkoutResponse.json();
  assert.equal(checkoutPayload.checkoutUrl, "https://checkout.stripe.com/c/pay/test-memorial");
  const stripeCall = fetchCalls.find((call) => call.url.includes("api.stripe.com"));
  assert.ok(stripeCall, "Stripe Checkout must be called");
  assert.equal(stripeCall.options.headers["idempotency-key"], `memorial-tree-${state.order.id}`);
  const stripeBody = String(stripeCall.options.body);
  assert.match(stripeBody, /unit_amount%5D=1000/);
  assert.match(stripeBody, /woafmeow_memorial_tree_order_id/);
  assert.match(stripeBody, /CHECKOUT_SESSION_ID/);

  const event = {
    id: "evt_memorial_paid",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_memorial",
        payment_status: "paid",
        metadata: { woafmeow_memorial_tree_order_id: state.order.id },
      },
    },
  };
  const rawEvent = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const webhookSecret = "whsec_test_not_real";
  const signature = createHmac("sha256", webhookSecret).update(`${timestamp}.${rawEvent}`).digest("hex");
  const webhookRequest = () => new Request("https://woafypet-senior-care-8kt.pages.dev/api/stripe-webhook", {
    method: "POST",
    headers: { "stripe-signature": `t=${timestamp},v1=${signature}`, "content-type": "application/json" },
    body: rawEvent,
  });
  const webhookEnv = {
    WAITLIST_DB: db,
    STRIPE_WEBHOOK_SECRET: webhookSecret,
    BREVO_API_KEY: "brevo-test",
    BREVO_SENDER_EMAIL: "hello@woafmeow.com",
  };
  const webhookResponse = await receiveStripeWebhook({ request: webhookRequest(), env: webhookEnv });
  assert.equal(webhookResponse.status, 200);
  const emailCalls = fetchCalls.filter((call) => call.url.endsWith("/smtp/email"));
  assert.equal(emailCalls.length, 2);
  const memorialRequestEmail = emailCalls.map((call) => JSON.parse(call.options.body)).find((item) => /Memorial tree request/.test(item.subject));
  assert.ok(memorialRequestEmail, "memorial form must notify the WoafMeow owner");
  const email = emailCalls.map((call) => JSON.parse(call.options.body)).find((item) => /Bobby's memorial tree/.test(item.subject));
  assert.ok(email, "paid memorial must send a customer confirmation");
  assert.equal(email.sender.email, "hello@woafmeow.com");
  assert.match(email.subject, /Bobby's memorial tree/);
  assert.match(email.htmlContent, /does not claim the tree has already been planted/);
  assert.equal(state.order.confirmationEmailStatus, "sent");

  const duplicateResponse = await receiveStripeWebhook({ request: webhookRequest(), env: webhookEnv });
  assert.equal(duplicateResponse.status, 200);
  assert.equal(fetchCalls.filter((call) => call.url.endsWith("/smtp/email")).length, 2, "duplicate event must not send a second email");

  const contactRunCount = state.runs.length;
  const contactResponse = await submitContact({
    request: new Request("https://woafypet-senior-care-8kt.pages.dev/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Taylor",
        email: "taylor@example.com",
        topic: "wednesday-match",
        message: "I want to compare mobility routines with another dog parent.",
        consent: true,
        requestId: "WM-TEST",
        zip: "91789",
        dogAge: "10–12 years",
        issue: "Mobility or stiffness",
        availability: "Weekday afternoons",
        contact: "Calm public walk",
        matchGoal: "Someone a few steps ahead",
      }),
    }),
    env: {
      WAITLIST_DB: db,
      BREVO_API_KEY: "brevo-test",
      BREVO_SENDER_EMAIL: "hello@woafmeow.com",
      FORM_NOTIFICATION_EMAIL: "robert@example.com",
    },
  });
  assert.equal(contactResponse.status, 201);
  const contactPayload = await contactResponse.json();
  assert.match(contactPayload.message, /request is saved/);
  assert.equal(contactPayload.teamNotification, "sent");
  const contactInsert = state.runs.slice(contactRunCount).find((run) => run.sql.startsWith("INSERT INTO contact_messages"));
  assert.ok(contactInsert);
  assert.match(contactInsert.values[4], /ZIP\/postal code: 91789/);
  assert.match(contactInsert.values[4], /Preferred first contact: Calm public walk/);
  const wednesdayNotification = fetchCalls
    .filter((call) => call.url.endsWith("/smtp/email"))
    .map((call) => JSON.parse(call.options.body))
    .find((item) => /Wednesday meetup request/.test(item.subject));
  assert.ok(wednesdayNotification, "Wednesday form must notify the WoafMeow owner");
  assert.equal(wednesdayNotification.to[0].email, "robert@example.com");
  assert.match(wednesdayNotification.htmlContent, /91789/);

  console.log("Memorial checkout, owner notification, signed webhook email, idempotency, CORS, Wednesday storage, and Wednesday owner notification passed.");
} finally {
  globalThis.fetch = originalFetch;
}

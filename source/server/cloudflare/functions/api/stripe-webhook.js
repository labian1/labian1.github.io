import { sendBrevoEmail } from "../_lib/brevo.js";

const json = (payload, status = 200) => new Response(JSON.stringify(payload), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

const hex = (buffer) => [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const secureEqual = async (left, right) => {
  const encoder = new TextEncoder();
  const [leftDigest, rightDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftDigest);
  const rightBytes = new Uint8Array(rightDigest);
  if (typeof crypto.subtle.timingSafeEqual === "function") {
    return crypto.subtle.timingSafeEqual(leftBytes, rightBytes);
  }
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) difference |= leftBytes[index] ^ rightBytes[index];
  return difference === 0;
};

const verifyStripeSignature = async (payload, signatureHeader, secret) => {
  const values = String(signatureHeader || "").split(",").reduce((result, part) => {
    const [key, value] = part.trim().split("=", 2);
    if (key && value) {
      if (!result[key]) result[key] = [];
      result[key].push(value);
    }
    return result;
  }, {});
  const timestamp = values.t?.[0];
  const signatures = values.v1 || [];
  if (!timestamp || !signatures.length) return false;
  if (!Number.isFinite(Number(timestamp)) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = hex(digest);
  for (const signature of signatures) {
    if (await secureEqual(signature, expected)) return true;
  }
  return false;
};

const sendMemorialConfirmation = async ({ context, session, orderId, now }) => {
  const db = context.env.WAITLIST_DB;
  const order = await db.prepare("SELECT email, customer_name AS customerName, pet_name AS petName, memory, amount_cents AS amountCents, confirmation_email_status AS confirmationEmailStatus FROM memorial_tree_orders WHERE id = ?1")
    .bind(orderId).first();
  if (!order) throw new Error("Memorial tree order was not found.");
  if (session.payment_status !== "paid") {
    await db.prepare("UPDATE memorial_tree_orders SET status = 'payment_pending', stripe_session_id = ?1, updated_at = ?2 WHERE id = ?3")
      .bind(String(session.id || ""), now, orderId).run();
    return;
  }
  await db.prepare("UPDATE memorial_tree_orders SET status = 'paid', stripe_session_id = ?1, updated_at = ?2 WHERE id = ?3")
    .bind(String(session.id || ""), now, orderId).run();
  if (order.confirmationEmailStatus === "sent") return;

  const petName = String(order.petName || "your dog");
  const result = await sendBrevoEmail({
    env: context.env,
    to: order.email,
    recipientName: order.customerName,
    senderEmail: "hello@woafmeow.com",
    subject: `Payment confirmed: ${petName}'s memorial tree`,
    htmlContent: `<div style="font-family:Arial,sans-serif;color:#332b27;line-height:1.6;max-width:620px;margin:auto"><p style="font-size:13px;font-weight:700;letter-spacing:.08em;color:#b84f32">WOAFMEOW MEMORIAL TREE</p><h1 style="font-family:Georgia,serif;font-weight:500;color:#244f42">${escapeHtml(petName)}'s memory will keep growing.</h1><p>Hi ${escapeHtml(order.customerName)},</p><p>WoafMeow helps senior-dog families notice change, find practical care, and feel less alone through the hardest parts of loving a dog.</p><p>Your secure Stripe payment of <strong>$${(Number(order.amountCents || 1000) / 100).toFixed(2)}</strong> has been confirmed for ${escapeHtml(petName)}'s memorial tree request.</p><div style="padding:18px;border-left:4px solid #c65d3c;background:#faf4ee"><strong>The memory you shared</strong><br>${escapeHtml(order.memory)}</div><p>We will keep you updated at this email as the planting is arranged. This message confirms the payment and request; it does not claim the tree has already been planted.</p><p>If anything needs correcting, reply to <a href="mailto:hello@woafmeow.com">hello@woafmeow.com</a>.</p><p>With care,<br>The WoafMeow team</p></div>`,
  });
  if (result.status !== "sent") {
    await db.prepare("UPDATE memorial_tree_orders SET confirmation_email_status = 'failed', updated_at = ?1 WHERE id = ?2")
      .bind(new Date().toISOString(), orderId).run();
    throw new Error(`Memorial confirmation email failed: ${result.code || result.status}`);
  }
  await db.prepare("UPDATE memorial_tree_orders SET confirmation_email_status = 'sent', confirmation_email_sent_at = ?1, updated_at = ?1 WHERE id = ?2")
    .bind(new Date().toISOString(), orderId).run();
};

export async function onRequestPost(context) {
  if (!context.env.STRIPE_WEBHOOK_SECRET) return json({ error: "Stripe webhook verification is not configured." }, 503);
  const rawBody = await context.request.text();
  const signature = context.request.headers.get("stripe-signature");
  if (!await verifyStripeSignature(rawBody, signature, context.env.STRIPE_WEBHOOK_SECRET)) {
    return json({ error: "Invalid Stripe signature." }, 400);
  }
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid Stripe event." }, 400);
  }
  const acceptedTypes = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded"]);
  if (!acceptedTypes.has(event.type)) return json({ received: true });
  if (!event.id) return json({ error: "Stripe event id is missing." }, 400);

  const session = event.data?.object || {};
  const metadata = session.metadata || {};
  const now = new Date().toISOString();
  const db = context.env.WAITLIST_DB;
  try {
    await db.prepare("INSERT OR IGNORE INTO stripe_webhook_events (event_id, event_type, status, created_at, updated_at) VALUES (?1, ?2, 'processing', ?3, ?3)")
      .bind(String(event.id), String(event.type), now).run();
    const prior = await db.prepare("SELECT status FROM stripe_webhook_events WHERE event_id = ?1").bind(String(event.id)).first();
    if (prior?.status === "processed") return json({ received: true, duplicate: true });
    await db.prepare("UPDATE stripe_webhook_events SET status = 'processing', error = NULL, updated_at = ?1 WHERE event_id = ?2")
      .bind(now, String(event.id)).run();

    if (metadata.woafypet_order_id && session.payment_status === "paid") {
      await db.prepare("UPDATE marketplace_orders SET status = 'paid', stripe_session_id = ?1, updated_at = ?2 WHERE id = ?3")
        .bind(String(session.id || ""), now, String(metadata.woafypet_order_id)).run();
    }
    if (metadata.woafypet_membership_checkout_id && session.payment_status === "paid") {
      const checkoutId = String(metadata.woafypet_membership_checkout_id);
      const checkout = await db.prepare("SELECT member_id AS memberId, email, plan FROM membership_checkouts WHERE id = ?1").bind(checkoutId).first();
      await db.prepare("UPDATE membership_checkouts SET status = 'paid', stripe_session_id = ?1, updated_at = ?2 WHERE id = ?3")
        .bind(String(session.id || ""), now, checkoutId).run();
      if (checkout?.memberId) {
        await db.prepare("UPDATE care_circle_members SET membership_plan = ?1, updated_at = ?2 WHERE id = ?3")
          .bind(`care-plus-${checkout.plan || "monthly"}`, now, checkout.memberId).run();
      } else if (checkout?.email) {
        await db.prepare("UPDATE care_circle_members SET membership_plan = ?1, updated_at = ?2 WHERE email = ?3")
          .bind(`care-plus-${checkout.plan || "monthly"}`, now, String(checkout.email).toLowerCase()).run();
      }
    }
    if (metadata.woafmeow_memorial_tree_order_id) {
      await sendMemorialConfirmation({ context, session, orderId: String(metadata.woafmeow_memorial_tree_order_id), now });
    }

    await db.prepare("UPDATE stripe_webhook_events SET status = 'processed', updated_at = ?1 WHERE event_id = ?2")
      .bind(new Date().toISOString(), String(event.id)).run();
    return json({ received: true });
  } catch (error) {
    await db.prepare("UPDATE stripe_webhook_events SET status = 'failed', error = ?1, updated_at = ?2 WHERE event_id = ?3")
      .bind(String(error?.message || "Webhook processing failed.").slice(0, 500), new Date().toISOString(), String(event.id)).run()
      .catch(() => {});
    return json({ error: "Verified payment event could not be completed. Stripe should retry." }, 503);
  }
}

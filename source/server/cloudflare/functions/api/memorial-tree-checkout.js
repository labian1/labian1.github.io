import { sendOwnerFormNotification, syncBrevoContact } from "../_lib/brevo.js";
import { cleanText, corsHeaders, createStripeCheckout, json, validEmail } from "../_lib/commerce.js";

const amountCents = 1000;
const publicOrigins = new Set([
  "https://labian1.github.io",
  "https://woafmeow.com",
  "https://www.woafmeow.com",
]);

const returnOrigin = (value) => {
  try {
    const origin = new URL(String(value || "")).origin;
    if (publicOrigins.has(origin)) return origin;
  } catch {
    // Fall through to the currently published GitHub Pages origin.
  }
  return "https://www.woafmeow.com";
};

export async function onRequestPost(context) {
  const respond = (payload, status = 200) => json(payload, status, context.request);
  if (!(context.request.headers.get("content-type") || "").includes("application/json")) {
    return respond({ error: "Use a JSON request." }, 415);
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return respond({ error: "We could not read that memorial request." }, 400);
  }

  const customerName = cleanText(body.name, 100);
  const email = cleanText(body.email, 254).toLowerCase();
  const petName = cleanText(body.petName, 80);
  const memory = cleanText(body.meaning, 600);
  if (customerName.length < 2) return respond({ error: "Add your name." }, 400);
  if (!validEmail(email)) return respond({ error: "Enter a valid email address." }, 400);
  if (!petName) return respond({ error: "Add your dog's name." }, 400);
  if (memory.length < 12) return respond({ error: "Share one short memory to carry forward." }, 400);

  const db = context.env.WAITLIST_DB;
  const orderId = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    await db.prepare("INSERT INTO memorial_tree_orders (id, email, customer_name, pet_name, memory, amount_cents, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'checkout_pending', ?7, ?7)")
      .bind(orderId, email, customerName, petName, memory, amountCents, now)
      .run();

    await sendOwnerFormNotification({
      env: context.env,
      eventType: "memorial_tree_request",
      email,
      subject: `WoafMeow: Memorial tree request — ${petName}`,
      notificationProperties: { customer_name: customerName, pet_name: petName, order_id: orderId, amount_usd: "10.00" },
    });

    if (!context.env.STRIPE_SECRET_KEY) {
      await db.prepare("UPDATE memorial_tree_orders SET status = 'stripe_not_configured', updated_at = ?1 WHERE id = ?2")
        .bind(new Date().toISOString(), orderId).run();
      return respond({ error: "Secure payment is temporarily unavailable. No payment was taken. Please try again later.", orderId }, 503);
    }

    const origin = returnOrigin(body.pageContext);
    const params = new URLSearchParams({
      mode: "payment",
      customer_email: email,
      client_reference_id: orderId,
      success_url: `${origin}/memorial-tree/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/memorial-tree/?checkout=cancelled`,
      "metadata[woafmeow_memorial_tree_order_id]": orderId,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(amountCents),
      "line_items[0][price_data][product_data][name]": `Memorial tree for ${petName}`,
      "line_items[0][price_data][product_data][description]": "A living memorial requested through WoafMeow.",
    });
    const session = await createStripeCheckout({
      secret: context.env.STRIPE_SECRET_KEY,
      params,
      idempotencyKey: `memorial-tree-${orderId}`,
    });
    await db.prepare("UPDATE memorial_tree_orders SET stripe_session_id = ?1, status = 'checkout_opened', updated_at = ?2 WHERE id = ?3")
      .bind(session.id, new Date().toISOString(), orderId).run();
    await syncBrevoContact({
      env: context.env,
      db,
      email,
      firstName: customerName.split(" ")[0] || "",
      eventType: "memorial_tree_checkout_opened",
      eventProperties: { order_id: orderId, amount_cents: amountCents },
      listKeys: ["BREVO_MEMORIAL_LIST_ID"],
      sendOwnerNotification: false,
    });
    return respond({ checkoutUrl: session.url, orderId });
  } catch (error) {
    return respond({ error: error?.message || "Secure Stripe checkout could not be opened. No payment was taken." }, 503);
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: { allow: "POST, OPTIONS", ...corsHeaders(context.request) },
  });
}

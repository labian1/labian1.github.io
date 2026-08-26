export const STORE_PRODUCTS = Object.freeze({
  "living-memorial-tree": { title: "Living Memorial Tree", priceCents: 7900 },
  "photo-collar-memory-frame": { title: "Pet Portrait Memory Frame", priceCents: 8200 },
  "portrait-name-pendant": { title: "Pet Photo Memory Locket", priceCents: 6800 },
  "hand-thrown-ceramic-urn": { title: "Pawprint Bio Pet Urn", priceCents: 14800 },
  "portrait-signet-ring": { title: "Two Hearts Keepsake Ring", priceCents: 9400 },
  "paw-print-bracelet": { title: "Linked Memory Bracelet", priceCents: 5800 },
  "custom-portrait-miniature": { title: "Custom Portrait Miniature", priceCents: 12900 },
  "custom-plush-portrait": { title: "Custom Plush Portrait", priceCents: 17900 },
  "senior-pet-home-comfort-consult": { title: "Senior-Pet Home Comfort Consult", priceCents: 9500 },
});

export const MEMBERSHIP_PLANS = Object.freeze({
  monthly: { title: "WoafMeow Care+ Monthly", priceCents: 1400, interval: "month" },
  annual: { title: "WoafMeow Care+ Annual", priceCents: 13500, interval: "year" },
});

export const json = (payload, status = 200) => new Response(JSON.stringify(payload), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

export const cleanText = (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
export const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function createStripeCheckout({ secret, params, idempotencyKey = "" }) {
  if (!secret) return null;
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/x-www-form-urlencoded",
      ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
    },
    body: params.toString(),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.url) throw new Error(payload?.error?.message || "Secure checkout could not be opened.");
  return payload;
}

# WoafMeow server source

This folder contains the two server implementations retained for WoafMeow forms, accounts, care profiles, Care Circle, health tracking, directory submissions, memorial-tree checkout, and operational notifications.

## Cloudflare Pages

- `cloudflare/functions/` contains the Pages Function routes and shared helpers.
- `cloudflare/migrations/` contains the complete D1 schema history.
- `cloudflare/wrangler.jsonc` documents the production bindings.
- `cloudflare/wrangler.local.jsonc` provides a local-development configuration.
- `cloudflare/.dev.vars.example` lists local secret names without values.

Apply migrations locally from this directory with Wrangler, then serve a Pages build with the same `WAITLIST_DB` and `CARE_CIRCLE_MEDIA` bindings. Production secrets must be configured through Cloudflare rather than committed.

```sh
cd source/woafypet-unified-preview
node build-site.mjs

cd ../server/cloudflare
wrangler d1 migrations apply woafypet-senior-care-waitlist \
  --local \
  --config wrangler.local.jsonc \
  --persist-to .wrangler/state
wrangler pages dev ../../woafypet-unified-preview/dist \
  --d1 WAITLIST_DB=cca91b1d-01b9-4c3e-9712-ec3e3afc5a5f \
  --r2 CARE_CIRCLE_MEDIA \
  --ai AI \
  --persist-to .wrangler/state
```

The public site does not expose the retired physical-product store. The active commerce path is the server-priced $10 memorial-tree Stripe Checkout flow. Its signed webhook records payment idempotently and sends one confirmation from `hello@woafmeow.com` only after Stripe reports the session as paid.

## Hostinger

- `hostinger/index.php` is the same-origin `/api/*` router used by the Hostinger deployment.
- `hostinger/.env.example` lists the notification configuration without credentials.
- Runtime records belong in a protected `.woafmeow-data/` directory and must never be committed.

The Hostinger API requires PHP 8.1 or newer, PHP cURL for Brevo delivery, and write permission for its protected data directory.

## Required private configuration

- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL` (`hello@woafmeow.com`, verified in Brevo)
- `FORM_NOTIFICATION_EMAIL`
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
- Optional Brevo list IDs used by the Cloudflare helpers
- `ADMIN_DASHBOARD_KEY` for the private Cloudflare operations dashboard

The repository intentionally excludes credentials, customer submissions, health records, uploaded files, local databases, and deployment caches. Stripe must send `checkout.session.completed` and `checkout.session.async_payment_succeeded` to `https://woafypet-senior-care.pages.dev/api/stripe-webhook`.

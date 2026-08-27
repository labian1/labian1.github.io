# WoafMeow Commerce Setup

The store, Care+, and $10 memorial-tree checkout endpoints are implemented with server-locked prices, Cloudflare D1 order records, Brevo events, and Stripe Checkout.

## Required Cloudflare secret

Set the Stripe secret on the Pages project:

```sh
npx wrangler pages secret put STRIPE_SECRET_KEY --project-name woafypet-senior-care
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET --project-name woafypet-senior-care
```

Without `STRIPE_SECRET_KEY`, the site records the request and clearly says secure payment is unavailable and no payment was taken. It never pretends payment or delivery succeeded. `STRIPE_WEBHOOK_SECRET` must be the signing secret for the production endpoint below.

## Data locations

- Pet accounts, forms, shop orders, membership checkouts, memorial-tree orders, and processed Stripe event IDs: Cloudflare D1 database `woafypet-senior-care-waitlist`.
- Contact activity and lifecycle events: Brevo, when its API key and list IDs are configured.
- Uploaded pet photos, videos, and profile images: R2 bucket `woafypet-care-circle-media`.
- Staff review: `/senior-care-platform/admin/`, protected by `ADMIN_DASHBOARD_KEY`.

## Production payment reconciliation

Create a Stripe webhook for:

`https://woafypet-senior-care-8kt.pages.dev/api/stripe-webhook`

Subscribe it to `checkout.session.completed` and `checkout.session.async_payment_succeeded`. The handler verifies the Stripe signature, records every event ID for idempotency, and changes D1 status only when `payment_status` is `paid`. A memorial confirmation email is then sent once from `hello@woafmeow.com`; a failed email returns a retryable error to Stripe. Do not fulfill or send payment confirmation from the browser success URL alone.

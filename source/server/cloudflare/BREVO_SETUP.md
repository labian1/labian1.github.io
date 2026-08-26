# Brevo form sync

The live form endpoints keep the WoafMeow database as the source of record, then create or update the same opted-in contact in Brevo. A Brevo outage does not discard an owner's submission; it is recorded in `form_sync_log` with the delivery result.

Configure these Pages production secrets:

```sh
printf '%s' 'YOUR_BREVO_API_KEY' | wrangler pages secret put BREVO_API_KEY --project-name woafypet-senior-care
printf '%s' 'YOUR_ALL_FORMS_LIST_ID' | wrangler pages secret put BREVO_ALL_FORMS_LIST_ID --project-name woafypet-senior-care
printf '%s' 'YOUR_CARE_CIRCLE_LIST_ID' | wrangler pages secret put BREVO_CARE_CIRCLE_LIST_ID --project-name woafypet-senior-care
printf '%s' 'YOUR_WEBINAR_LIST_ID' | wrangler pages secret put BREVO_WEBINAR_LIST_ID --project-name woafypet-senior-care
printf '%s' 'YOUR_PROVIDER_LIST_ID' | wrangler pages secret put BREVO_PROVIDER_LIST_ID --project-name woafypet-senior-care
printf '%s' 'YOUR_NEWSLETTER_LIST_ID' | wrangler pages secret put BREVO_NEWSLETTER_LIST_ID --project-name woafypet-senior-care
printf '%s' 'YOUR_MEMORIAL_LIST_ID' | wrangler pages secret put BREVO_MEMORIAL_LIST_ID --project-name woafypet-senior-care
printf '%s' 'hello@woafmeow.com' | wrangler pages secret put BREVO_SENDER_EMAIL --project-name woafypet-senior-care
printf '%s' 'robert.luo@woafmeow.com' | wrangler pages secret put FORM_NOTIFICATION_EMAIL --project-name woafypet-senior-care
```

`BREVO_SENDER_EMAIL` must be the verified `hello@woafmeow.com` sender in Brevo. `FORM_NOTIFICATION_EMAIL` accepts one address or a comma/semicolon-separated list. A form is still saved when Brevo is unavailable; the separate contact, event, and owner-notification results are written to `form_sync_log`. A `missing_sender_email` or `missing_api_key` result means no owner email was attempted and must be treated as a deployment configuration failure.

Memorial-tree payment confirmations are transactional email. They are sent from `hello@woafmeow.com` only after a signed Stripe webhook reports the Checkout Session as paid. A browser return to the success URL never triggers or claims payment confirmation.

Use a Brevo automation for the Care Circle list to send the weekly Care Note. The platform syncs opted-in profile creation, weekly check-ins, Care Circle updates, replies, uploads, hosted-circle applications, joins, saved lessons, private memories, and Wednesday matching actions. Event and owner-notification payloads contain operational metadata only; private questions, health notes, medicine lists, matching safety notes, memory stories, and media never appear in notification emails.

Brevo uses the Contacts API with the `api-key` request header and `updateEnabled: true`, so resubmitting a form updates the existing contact instead of creating duplicates.

For Hostinger, copy `public_html/api/.env.example` to `public_html/api/.env`, then set `BREVO_API_KEY`, a Brevo-verified `BREVO_SENDER_EMAIL`, and `FORM_NOTIFICATION_EMAIL`; set `BREVO_WEBSITE_LIST_ID` when contact-list sync is enabled. Hostinger owner notifications use Brevo transactional email and log each attempt in the protected `.woafmeow-data/notification-log.json` file; PHP `mail()` is not used.

For local Cloudflare Pages development, copy the staged `.dev.vars.example` file to `.dev.vars`. Production Pages deployments must use encrypted secrets as shown above rather than committing a populated environment file.

## Private operations dashboard

Form and account records are stored in the Cloudflare D1 database bound as `WAITLIST_DB`. Set a separate production secret before opening `/senior-care-platform/admin/`:

```sh
printf '%s' 'A_LONG_PRIVATE_RANDOM_VALUE' | wrangler pages secret put ADMIN_DASHBOARD_KEY --project-name woafypet-senior-care
```

The dashboard requests that key only in the current browser session and does not put it in public page source. It shows enrollments, newsletter signups, webinar waitlist entries, provider and remembrance-partner requests, remembrance collection interest, and Care Circle research requests. Do not share the key with anyone who should not see owner contact data.

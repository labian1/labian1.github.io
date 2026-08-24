# WoafMeow website source

This folder contains the complete reproducible source for the WoafMeow GitHub Pages preview.

## Structure

- `woafypet-unified-preview/` — page generator, shared CSS and JavaScript, assets, route data, local preview server, and verification scripts.
- `senior-care-platform/data/` — source directory and care-content datasets consumed by the generator.
- `senior-care-platform/media/profiles/` — source-labeled profile images consumed by the generator.
- `server/` — Cloudflare Pages Functions, D1 migrations, Hostinger PHP API, environment templates, and backend deployment notes.

The compiled GitHub Pages site remains at the repository root.

## Build

```sh
cd source/woafypet-unified-preview
node --check build-site.mjs
node --check app.js
node build-site.mjs
node scripts/verify-static.mjs
```

The build writes generated pages to `source/woafypet-unified-preview/dist/`. To publish a reviewed build, copy that folder's contents to the repository root, preserving this `source/` directory.

Backend setup and endpoint details are documented in `source/server/README.md`.

## Preview

```sh
WOAFY_PREVIEW_PORT=4190 node preview-server.mjs
```

Then open `http://127.0.0.1:4190/`.

## Safety

- Generated screenshots, browser artifacts, and local runtime state are intentionally excluded.
- No API keys, OAuth secrets, customer submissions, or private health records are stored here.
- Never commit populated `.env`, `.dev.vars`, Wrangler state, D1 files, or Hostinger `.woafmeow-data` records.
- The public preview remains `noindex` and is not the official WoafMeow launch.

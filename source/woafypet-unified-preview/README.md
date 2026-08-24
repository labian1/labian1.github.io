# WoafyPet unified private preview

This isolated rebuild combines the focused senior-dog product, condition-first lessons, a public preview Care Circle, the Senior Dog Guide, Find Care, pet-loss support, memorial-tree transparency, and offline Wednesday introductions. It does not change either official domain.

## Authoritative implementation

- `build-site.mjs` owns routes and page content.
- `styles.css` owns the shared visual system and responsive layout.
- `app.js` owns the mobile menu, question-to-lesson routing, account and pet-profile state, Care Circle interactions, guide delivery, Health Timeline records, directory filtering, and request-form behavior.
- `preview-server.mjs` serves `dist/` with no-index and security headers.

## Build and verify

```sh
node --check build-site.mjs
node --check app.js
node build-site.mjs
node scripts/verify-static.mjs
WOAFY_PREVIEW_PORT=4190 node preview-server.mjs
node scripts/browser-smoke.mjs --base-url http://127.0.0.1:4190
```

The GitHub review site is intentionally `noindex` and is not the official launch. Guide and provider requests submit to the existing WoafMeow API endpoints; account, pet-profile, Care Circle, and Health Timeline data remain in the current browser for this review build. Do not use real customer health records in the public preview. Google sign-in still requires a production OAuth client ID and approved redirect origins before launch.

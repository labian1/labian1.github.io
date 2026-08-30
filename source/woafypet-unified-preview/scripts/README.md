# WoafMeow review-site verification

These scripts validate the generated review site in `../dist`. They do not publish it or change the official WoafMeow domain.

## Build and static verification

```sh
node build-site.mjs
node scripts/verify-static.mjs
```

The static verifier checks every generated route, six public Care Circle lessons, at least 500 provider profiles, 34 official care resources, local links and assets, required image metadata, prohibited copy, unique homepage imagery, active guide delivery forms, the account/pet-profile contract, lesson-personalization hooks, the private Health Timeline, and the provider directory.

## Browser verification

```sh
CHROME_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
NODE_PATH="/absolute/path/to/node_modules" \
node scripts/browser-smoke.mjs \
  --base-url http://127.0.0.1:4190 \
  --screenshots scripts/artifacts/release
```

The browser run checks every route at 1440×1000, 1024×900, and 390×844. It verifies status, navigation, horizontal overflow, image loading/containment, the merged homepage lesson section, account creation, breed selection, public profile disclosure, pet-specific chapter copy, quizzes, Care Circle interactions, guide delivery requests, profile-linked health-record and change tracking, directory filtering, and removed copy.

## Required product contracts

- Care Circle and public lessons are one connected system. Public lesson content remains readable, while asking a new question requires an owner account and pet profile.
- A completed owner profile includes owner name, email or Gmail address, dog name, age, breed, known conditions, and medicines. Lesson chapter guidance changes to match those details.
- The Health Timeline connects to that saved profile, keeps uploaded records and dated observations private in the browser, organizes condition and care-pattern mentions without diagnosing, and produces a printable veterinary-visit summary.
- The homepage contains one lesson-discovery section. It does not repeat the same topic grid or image.
- Homepage and route imagery must have valid dimensions, load successfully, stay inside its frame, and use `object-fit: contain` where the complete image is required.
- Guide forms use the live newsletter endpoint and only show success after the backend confirms that the email was sent.
- Find Care filters must change the visible providers and official directories; each care type retains at least three results.
- Preview pages remain `noindex,nofollow,noarchive` until an explicit production launch.

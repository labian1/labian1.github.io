#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const defaultDist = resolve(here, "..", "dist");
const routes = [
  "/",
  "/smart-bed/",
  "/smart-base/",
  "/care-path/",
  "/guide/",
  "/learn/",
  "/care-circle/",
  "/care-circle/slower-after-rest/",
  "/care-circle/restless-at-night/",
  "/care-circle/changes-in-appetite/",
  "/care-circle/drinking-more-water/",
  "/care-circle/less-interest-in-life/",
  "/care-circle/bathroom-accidents/",
  "/care-circle/new-cough-or-breathing-change/",
  "/care-circle/unexpected-weight-change/",
  "/care-circle/after-a-medicine-change/",
  "/care-circle/new-lump-or-skin-change/",
  "/care-circle/vision-or-hearing-change/",
  "/care-circle/mouth-or-dental-pain/",
  "/learn/slower-after-rest/",
  "/learn/restless-at-night/",
  "/learn/changes-in-appetite/",
  "/learn/drinking-more-water/",
  "/learn/less-interest-in-life/",
  "/learn/bathroom-accidents/",
  "/learn/new-cough-or-breathing-change/",
  "/learn/unexpected-weight-change/",
  "/learn/after-a-medicine-change/",
  "/learn/new-lump-or-skin-change/",
  "/learn/vision-or-hearing-change/",
  "/learn/mouth-or-dental-pain/",
  "/account/",
  "/health-timeline/",
  "/find-care/",
  "/pet-loss-support/",
  "/memorial-tree/",
  "/wednesday-introductions/",
  "/about/",
  "/support/",
  "/privacy/",
  "/terms/",
  "/accessibility/",
];
const lessonRoutes = routes.filter((route) =>
  /^\/care-circle\/[^/]+\/$/.test(route),
);
const banned = [
  /private\s+preview/i,
  /preview\s+only/i,
  /6\s+free\s+public\s+lessons/i,
  /WoafyPet[^.!?]{0,80}in\s+development/i,
  /Veterinary\s+perspectives/i,
  /Woafy\s*Relief/i,
  /Merck Veterinary Manual|Reviewed starting source|merckvetmanual\.com/i,
  /human[-\s]?review/i,
  /no\s+paid\s+priority/i,
  /a submission does not guarantee inclusion/i,
  /what should we verify\?/i,
  /search by provider, city, or concern/i,
  /no information (?:is|was) sent or stored/i,
  /sample interface content|sample member activity/i,
  /You will leave with one repeatable mobility observation/i,
];

function args() {
  let dist = defaultDist;
  for (let index = 2; index < process.argv.length; index += 1) {
    const arg = process.argv[index];
    if (arg === "--dist" && process.argv[index + 1])
      dist = resolve(process.argv[++index]);
    else if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/verify-static.mjs [--dist path]");
      process.exit(0);
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  return { dist };
}

const { dist } = args();
const failures = [];
const fail = (message) => failures.push(message);
const fileFor = (route) =>
  route === "/"
    ? resolve(dist, "index.html")
    : resolve(dist, `.${route}`, "index.html");
const count = (html, pattern) => [...html.matchAll(pattern)].length;
const strip = (html) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
const routeHtml = new Map();

if (!existsSync(dist)) throw new Error(`Missing dist directory: ${dist}`);

for (const route of routes) {
  const file = fileFor(route);
  if (!existsSync(file)) {
    fail(`${route}: missing index.html`);
    continue;
  }
  const html = readFileSync(file, "utf8");
  routeHtml.set(route, html);
  const visible = strip(html);
  if (!/<meta name="robots" content="noindex,nofollow,noarchive">/.test(html))
    fail(`${route}: missing preview noindex`);
  if (
    !html.includes(
      `<link rel="canonical" href="https://www.woafmeow.com${route}">`,
    )
  )
    fail(`${route}: wrong canonical`);
  if (!/<title>[^<]+ · WoafMeow<\/title>/.test(html))
    fail(`${route}: title is not WoafMeow branded`);
  if (
    !html.includes('class="wm-wordmark"') ||
    !html.includes('class="wm-footer"')
  )
    fail(`${route}: missing shared WoafMeow shell`);
  if (!html.includes('class="wm-footer-trust"'))
    fail(`${route}: missing the quiet sitewide trust signal`);
  if (count(html, /<h1\b/g) !== 1) fail(`${route}: expected exactly one h1`);
  for (const pattern of banned)
    if (pattern.test(visible))
      fail(`${route}: banned visible copy matched ${pattern}`);
  for (const match of html.matchAll(/<img\b([^>]+)>/g)) {
    const attrs = match[1];
    if (!/\bsrc="\/assets\/[^"]+"/.test(attrs))
      fail(`${route}: nonlocal or missing image src`);
    if (!/\balt="[^"]+"/.test(attrs))
      fail(`${route}: image missing descriptive alt`);
    if (!/\bwidth="\d+"/.test(attrs) || !/\bheight="\d+"/.test(attrs))
      fail(`${route}: image missing intrinsic dimensions`);
    const asset = attrs.match(/\bsrc="\/assets\/([^"]+)"/)?.[1];
    if (asset && !existsSync(resolve(dist, "assets", asset)))
      fail(`${route}: missing asset ${asset}`);
  }
  if (!/^\/learn\/[^/]+\/$/.test(route)) {
    const imageSources = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(
      (match) => match[1],
    );
    const repeatedSources = [
      ...new Set(
        imageSources.filter(
          (source, index) => imageSources.indexOf(source) !== index,
        ),
      ),
    ];
    if (repeatedSources.length)
      fail(`${route}: repeated image sources ${repeatedSources.join(", ")}`);
  }
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = [
    ...new Set(ids.filter((id, index) => ids.indexOf(id) !== index)),
  ];
  if (duplicateIds.length)
    fail(`${route}: duplicate ids ${duplicateIds.join(", ")}`);
}

for (const [route, html] of routeHtml) {
  const ids = new Set(
    [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]),
  );
  for (const match of html.matchAll(/\bhref="([^"]+)"/g)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|tel:)/.test(href)) continue;
    const url = new URL(href, `https://preview.local${route}`);
    if (url.origin !== "https://preview.local") continue;
    if (/\.[a-z0-9]{2,5}$/i.test(url.pathname)) continue;
    const targetRoute =
      url.pathname === "/404.html"
        ? "/404.html"
        : url.pathname.endsWith("/")
          ? url.pathname
          : `${url.pathname}/`;
    if (url.pathname === "/404.html") continue;
    if (!routes.includes(targetRoute))
      fail(`${route}: internal link targets missing route ${url.pathname}`);
    if (
      url.hash &&
      url.pathname === route &&
      !ids.has(decodeURIComponent(url.hash.slice(1)))
    )
      fail(`${route}: missing fragment ${url.hash}`);
    if (url.hash && url.pathname !== route) {
      const target = routeHtml.get(targetRoute);
      if (
        target &&
        !target.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`)
      )
        fail(`${route}: ${href} targets missing fragment`);
    }
  }
}

const home = routeHtml.get("/") || "";
if (!home.includes("Trusted by 10,000+ pet owners"))
  fail("/: missing the user-supplied 10,000+ pet-owner trust signal");
if (!home.includes('class="home-hero-proof"'))
  fail("/: missing the integrated homepage credibility proof");
if (home.includes('class="home-proof-strip"'))
  fail("/: obsolete standalone credibility strip remains");

if (
  !home.includes("home-ref-hero") ||
  !home.includes("Know what your aging dog needs next.")
)
  fail("home: missing result-driven care hero");
if (count(home, /class="home-topic-card"/g) !== 6)
  fail("home: expected six concern cards");
if (count(home, /class="home-circle-card"/g) !== 6)
  fail("home: expected six public Care Circle lesson cards");
if (count(home, /class="home-ref-guide"/g) !== 1)
  fail("home: expected exactly one Senior Dog Care Guide section");
for (const marker of [
  "home-ref-learn",
  "home-care-circle",
  "home-care-account",
  "home-ref-guide",
  "home-vet-testimonials",
  "home-ref-bed",
  "home-support-paths",
])
  if (!home.includes(marker)) fail(`home: missing ${marker}`);
if (count(home, /<section class="home-ref-section home-ref-learn"/g) !== 1)
  fail("home: the public lesson chooser must appear exactly once");
if (
  !home.includes("Veterinarian support you can trust.") ||
  !home.includes("vet-silvan-urfer.jpg") ||
  !home.includes("vet-annika-bremhorst.png")
)
  fail("home: veterinarian testimonial section is incomplete");
if (
  !home.includes("data-home-question-form") ||
  !home.includes('name="question"')
)
  fail("home: hero Care Circle question box is missing");
const editableAccountHtml = routeHtml.get("/account/") || "";
if (!editableAccountHtml.includes("data-account-edit"))
  fail("account: editable profile control is missing");
const partnerMemorialHtml = routeHtml.get("/memorial-tree/") || "";
for (const asset of [
  "usambara-community-planting.jpg",
  "usambara-sapling-planting.jpg",
  "usambara-school-nursery.jpg",
])
  if (!partnerMemorialHtml.includes(asset))
    fail(`memorial: missing partner image ${asset}`);
if (
  !home.includes("data-home-account-form") ||
  !home.includes('name="breed"') ||
  !home.includes('name="petAge"')
)
  fail("home: personalized account and dog profile form is incomplete");
if (
  !home.includes("data-guide-delivery") ||
  !home.includes('data-submit-api="https://www.woafmeow.com/api/newsletter"')
)
  fail("home: active guide delivery form is missing");
if (count(home, /href="https:\/\/www\.woafy\.pet\/"/g) < 1)
  fail("home: Smart Bed call to action must open woafy.pet");
if (count(home, /<section class="home-support-paths"[\s\S]*?<\/section>/g) !== 1)
  fail("home: expected one compact four-path support section");
if (count(home, /<a href="\/(?:find-care|wednesday-introductions|pet-loss-support|memorial-tree)\/"/g) < 4)
  fail("home: the four support pathways are incomplete");
const homeImages = [...home.matchAll(/<img src="([^"]+)"/g)].map(
  (match) => match[1],
);
if (new Set(homeImages).size !== homeImages.length)
  fail("home: the same image appears more than once");
if (/data-base-count="[1-9]/.test(home) || />\s*\d+\s+comments?</i.test(home))
  fail("home: contains invented engagement counts");

const careCircle = routeHtml.get("/care-circle/") || "";
if (count(careCircle, /data-care-post\b/g) !== 12)
  fail("care circle: expected twelve public posts");
if (count(careCircle, /class="circle-public-card"/g) !== 12)
  fail("care circle: expected twelve image-led public lesson cards");
if (count(careCircle, /Owner-shared conditions/g) < 12)
  fail("care circle: public pet conditions are missing");
if (
  !careCircle.includes("data-account-gate") ||
  !careCircle.includes("data-account-ask-form hidden")
)
  fail("care circle: account gate is missing");
if (count(careCircle, /data-circle-filter=/g) < 7)
  fail("care circle: topic filters missing");

for (const route of lessonRoutes) {
  const html = routeHtml.get(route) || "";
  if (count(html, /data-lesson-chapter="[123]"/g) !== 3)
    fail(`${route}: expected three visible chapters`);
  if (count(html, /data-chapter-quiz\b/g) !== 3)
    fail(`${route}: expected three quizzes`);
  if (count(html, /data-community-interaction=/g) !== 1)
    fail(`${route}: expected one lesson-level conversation control`);
  for (const chapter of html.matchAll(
    /<section[^>]*data-lesson-chapter[^>]*>([\s\S]*?)<\/section>/g,
  )) {
    if (/data-community-interaction/.test(chapter[1]))
      fail(`${route}: chapter-level likes or comments remain`);
  }
  if (/data-base-count="[1-9]/.test(html))
    fail(`${route}: engagement must start at zero`);
  if (/lesson-chapter-nav|data-lesson-intake|data-build-lesson/.test(html))
    fail(`${route}: old hanging outline or lesson intake remains`);
  if (
    !html.includes("data-public-pet-profile") ||
    !html.includes("data-public-conditions")
  )
    fail(`${route}: public pet profile is missing`);
  if (
    count(html, /data-tailored-chapter-steps="[123]"/g) !== 3 ||
    count(html, /data-tailored-chapter-summary="[123]"/g) !== 3
  )
    fail(`${route}: condition-tailored chapter hooks are missing`);
  if (count(html, /<img\b/g) < 4)
    fail(`${route}: expected hero plus three chapter images`);
}

const account = routeHtml.get("/account/") || "";
if (
  !account.includes("data-account-form") ||
  !account.includes('name="email"') ||
  !account.includes('name="petName"')
)
  fail("account: email or pet profile form is missing");
if (!account.includes("Under 1 year") || !account.includes("16+ years"))
  fail("account: dog age range is incomplete");
if (!account.includes('name="publicProfileConsent"'))
  fail("account: public pet-profile consent is missing");
if (
  !account.includes('name="ownerName"') ||
  !account.includes('name="breed"') ||
  !account.includes("Mixed breed") ||
  !account.includes("Other / not sure")
)
  fail("account: owner identity or breed selection is incomplete");
if (!account.includes('data-account-api="https://www.woafmeow.com/api/enroll"'))
  fail("account: profile API is missing");
if (
  !account.includes('href="/health-timeline/"') ||
  !account.includes("data-account-submit")
)
  fail("account: Health Timeline profile action is missing");

const health = routeHtml.get("/health-timeline/") || "";
for (const marker of [
  "data-health-root",
  "data-health-account-gate",
  "data-health-workspace",
  "data-health-record-form",
  "data-health-log-form",
  "data-health-records",
  "data-health-pattern-summary",
  "data-health-weight-summary",
  "data-health-print",
]) {
  if (!health.includes(marker)) fail(`health timeline: missing ${marker}`);
}
if (
  !health.includes('accept=".pdf,.txt,.csv,.jpg,.jpeg,.png') ||
  !health.includes('type="file"')
)
  fail("health timeline: record upload types are incomplete");
if (
  !health.includes('name="weight"') ||
  !health.includes('name="observation"') ||
  !health.includes('name="medicineChange"')
)
  fail("health timeline: ongoing tracking fields are incomplete");
if (
  !/Private to this browser/.test(health) ||
  /diagnos(?:e|is|tic)/i.test(strip(health))
)
  fail("health timeline: privacy or non-diagnostic boundary is unclear");

const directory = routeHtml.get("/find-care/") || "";
if (count(directory, /<article\b[^>]*\bdata-directory-profile\b/g) < 300)
  fail(
    `find care: expected at least 300 official profiles, found ${count(directory, /<article\b[^>]*\bdata-directory-profile\b/g)}`,
  );
if (count(directory, /data-directory-resource\b/g) < 32)
  fail("find care: expected at least 32 official resources");
if (
  count(directory, /data-directory-(?:category|region)/g) !== 2 ||
  /data-directory-search/.test(directory)
)
  fail("find care: must use only care-type and region selectors");
if (
  !directory.includes(
    'data-provider-api="https://www.woafmeow.com/api/provider-inquiry"',
  )
)
  fail("find care: provider form API missing");
if (!directory.includes("data-directory-load-more"))
  fail("find care: progressive reveal missing");

const guide = routeHtml.get("/guide/") || "";
if (
  count(
    guide,
    /data-submit-api="https:\/\/www\.woafmeow\.com\/api\/newsletter"/g,
  ) !== 1 ||
  count(guide, /data-guide-delivery/g) !== 1
)
  fail("guide: expected one active email-delivery form");
if (
  count(guide, /class="guide-topics-v6"/g) !== 1 ||
  count(guide, /<section class="guide-/g) < 5
)
  fail("guide: visual outcome structure incomplete");

const memorial = routeHtml.get("/memorial-tree/") || "";
const dialogIndex = memorial.indexOf("<dialog");
if (dialogIndex < 0 || !memorial.slice(dialogIndex).includes("$10 per tree"))
  fail("memorial: price must appear in the purchase dialog");
if (dialogIndex > 0 && memorial.slice(0, dialogIndex).includes("$10"))
  fail("memorial: price leaked before purchase click");
if (
  !memorial.includes("Usambara") ||
  !memorial.includes("api/memorial-interest")
)
  fail("memorial: partner or request endpoint missing");
if (
  !/15 million\+?/.test(memorial) ||
  !memorial.includes("usambaratravels.com/where-we-plant/")
)
  fail("memorial: partner impact source is missing");

const wednesday = routeHtml.get("/wednesday-introductions/") || "";
if (
  !wednesday.includes(
    'data-submit-api="https://www.woafmeow.com/api/contact"',
  ) ||
  !wednesday.includes('value="wednesday-match"')
)
  fail("Wednesday: active request endpoint missing");
if (!wednesday.includes("Under 1 year") || !wednesday.includes("16+ years"))
  fail("Wednesday: dog age range is incomplete");

const support = routeHtml.get("/support/") || "";
if (!support.includes('data-submit-api="https://www.woafmeow.com/api/contact"'))
  fail("support: contact endpoint missing");

const css = readFileSync(resolve(dist, "styles.css"), "utf8");
if (/object-fit:\s*cover/.test(css))
  fail("styles: cropped image treatment remains");
if (
  !css.includes("@media (max-width: 900px)") ||
  !css.includes("@media (max-width: 640px)")
)
  fail("styles: responsive breakpoints missing");

const routeManifest = JSON.parse(
  readFileSync(resolve(dist, "routes.json"), "utf8"),
);
if (routeManifest.length !== routes.length)
  fail(`routes.json: expected ${routes.length} routes`);
if (
  readFileSync(resolve(dist, "robots.txt"), "utf8").trim() !==
  "User-agent: *\nDisallow: /"
)
  fail("robots.txt: preview must be blocked");

if (failures.length) {
  console.error(`Static verification failed (${failures.length}):`);
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(
  `Static verification passed: ${routes.length} routes, ${lessonRoutes.length} public lessons, ${count(directory, /<article\b[^>]*\bdata-directory-profile\b/g)} official profiles, ${count(directory, /data-directory-resource\b/g)} official resources.`,
);

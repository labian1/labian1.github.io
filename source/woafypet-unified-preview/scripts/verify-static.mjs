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
  /How we make money/i,
  /Revenue comes from WoafyPet products/i,
  /Private until you choose otherwise/i,
  /Other\s*\/\s*not sure/i,
  /A focused answer for/i,
  /I was Bobby/i,
  /You will know how much the bowl changes and what happens alongside it/i,
];
const exactSocialUrls = [
  "https://discord.gg/9wNjFp2dNX",
  "http://instagram.com/woafy.pet",
  "https://www.facebook.com/share/g/1DfE2k8M5W/?mibextid=wwXIfr",
  "https://linkedin.com/company/woafmeow",
];
// Generated design exports are references, never production page assets.
const bannedLegacyImageNames = ["exec-", "codex-clipboard-", "hero-bed.webp"];

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
  if (!/<meta name="robots" content="index,follow,max-image-preview:large">/.test(html))
    fail(`${route}: missing production index directives`);
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
  const primaryNavigation =
    html.match(/<nav class="wm-nav"[\s\S]*?<\/nav>/)?.[0] || "";
  if (!primaryNavigation.includes('href="/care-circle/"'))
    fail(`${route}: Care Circle navigation target is wrong`);
  if (
    !primaryNavigation.includes(
      'class="wm-bed-link" href="/smart-bed/"',
    )
  )
    fail(`${route}: WoafyPet Smart Bed navigation link is missing`);
  const socialNavigation =
    html.match(/<nav class="wm-footer-socials"[\s\S]*?<\/nav>/)?.[0] || "";
  for (const href of exactSocialUrls)
    if (!socialNavigation.includes(`href="${href}"`))
      fail(`${route}: missing exact footer social URL ${href}`);
  if (count(html, /<h1\b/g) !== 1) fail(`${route}: expected exactly one h1`);
  for (const pattern of banned)
    if (pattern.test(visible))
      fail(`${route}: banned visible copy matched ${pattern}`);
  for (const match of html.matchAll(/<img\b([^>]+)>/g)) {
    const attrs = match[1];
    const dynamicPreview =
      /\bdata-(?:(?:pet-photo|question-image)-preview|account-pet-photo)\b/.test(
        attrs,
      );
    if (!dynamicPreview && !/\bsrc="\/assets\/[^"]+"/.test(attrs))
      fail(`${route}: nonlocal or missing image src`);
    if (!/\balt="[^"]+"/.test(attrs))
      fail(`${route}: image missing descriptive alt`);
    if (
      !dynamicPreview &&
      (!/\bwidth="\d+"/.test(attrs) || !/\bheight="\d+"/.test(attrs))
    )
      fail(`${route}: image missing intrinsic dimensions`);
    const asset = attrs.match(/\bsrc="\/assets\/([^"]+)"/)?.[1];
    if (asset && !existsSync(resolve(dist, "assets", asset)))
      fail(`${route}: missing asset ${asset}`);
    if (
      asset &&
      bannedLegacyImageNames.some((legacyName) => asset.includes(legacyName))
    )
      fail(`${route}: banned legacy image remains ${asset}`);
  }
  if (!/^\/learn\/[^/]+\/$/.test(route)) {
    const imageSources = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(
      (match) => match[1],
    );
    const repeatedSources = [
      ...new Set(
        imageSources.filter(
          (source, index) =>
            source !== "/assets/woafmeow-logo-coral.png" &&
            imageSources.indexOf(source) !== index,
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
if (!home.includes('class="home-contract-trust"'))
  fail("/: missing the approved trust and differentiation strip");
if (home.includes('class="home-trust-proof"'))
  fail("/: obsolete circular trust strip remains");
if (home.includes('class="home-proof-strip"'))
  fail("/: obsolete standalone credibility strip remains");

if (
  !home.includes("home-contract-hero") ||
  !home.includes("Senior dog care.") ||
  !home.includes("Start with understanding.")
)
  fail("home: missing result-driven care hero");
for (const removed of [
  "Educational guidance—not a diagnosis. Urgent changes still need veterinary care.",
  "Six everyday care paths",
  "Public examples with owner consent",
  "WoafyPet Full Smart Bed · current prototype",
  "What WoafMeow does",
  "Why it is different",
])
  if (home.includes(removed)) fail(`home: removed copy remains ${removed}`);
if (/class="home-topic-card"|class="home-ref-learn"|class="home-care-circle"|class="home-care-hub"|class="home-circle-card"|class="home-vet-testimonials"|class="home-support-paths"/.test(home))
  fail("home: obsolete or duplicate homepage section remains");
if (count(home, /class="home-contract-guide"/g) !== 1)
  fail("home: expected exactly one Senior Dog Care Guide section");
for (const marker of [
  "home-contract-hero",
  "home-contract-trust",
  "home-contract-circle",
  "home-contract-care-grid",
  "home-contract-evidence",
  "home-contract-guide",
  "home-contract-bed",
  "home-contract-product",
  "home-contract-close",
  "profile-gate-dialog",
])
  if (!home.includes(marker)) fail(`home: missing ${marker}`);
if (
  !home.includes("Dog-aging expertise. Clear next steps.") ||
  !home.includes("vet-silvan-urfer.jpg") ||
  !home.includes('<figcaption class="home-vet-credential">')
)
  fail("home: concise veterinary-evidence section is incomplete");
if (home.includes('<section class="home-care-account"'))
  fail("home: permanent registration section should not be visible");
if (
  !home.includes('class="home-hero-chat"') ||
  !home.includes('action="/care-circle/"') ||
  !home.includes('name="q"')
)
  fail("home: working Care Circle hero chatbox is missing");
if (home.includes("data-home-question-form"))
  fail("home: legacy question shortcut still bypasses per-question privacy");
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
  !home.includes("data-first-action-dialog") ||
  !home.includes("data-pet-photo-input") ||
  !home.includes('<select name="breed" required>') ||
  !home.includes("Mixed breed — known mix") ||
  !home.includes("Mixed breed — unknown mix") ||
  !home.includes('name="weightRange"') ||
  !home.includes('name="conditions"') ||
  !home.includes('name="petAge"')
)
  fail("home: personalized account and dog profile form is incomplete");
if (
  !home.includes("product-prototype-golden-full-v2.png") ||
  !home.includes("bed-layers.png") ||
  !home.includes("Better rest. Earlier health alerts.") ||
  !home.includes('aria-label="Layer 5: Smart Base"') ||
  !home.includes("Step in with less effort") ||
  !home.includes("Reduce joint pressure") ||
  !home.includes("Turn and rise more easily") ||
  !home.includes("machine washable") ||
  !home.includes("Scratch-resistant") ||
  !home.includes("waterproof") ||
  !home.includes("Smart Base")
)
  fail("home: Bed + Smart Base system is incomplete");
if (home.includes('class="home-bed-pair-card"'))
  fail("home: nested product image remains over the dog-in-bed image");
if (
  !home.includes("product-visualization-smart-base.png") ||
  !home.includes("Get health-change alerts sooner.") ||
  !home.includes("another dog bed") ||
  !home.includes("Broken sleep may signal discomfort") ||
  !home.includes("pain or bathroom needs") ||
  !home.includes("harder entry or reduced mobility") ||
  !home.includes("chronic-disease change") ||
  home.includes("Flags sustained changes. It does not diagnose a condition.")
)
  fail("home: verified Smart Base product story is missing");
if (
  !home.includes("Silvan R. Urfer, Dr. med. vet.") ||
  !home.includes("Dog Aging Project")
)
  fail("home: Silvan Urfer credential is missing");
if (home.includes("smart-base-weekly-trend-v1.png"))
  fail("home: incorrect generated Smart Base device remains");
if (
  !home.includes("senior-dog-care-guide-book-v2.png") ||
  !home.includes('href="/guide/"') ||
  !home.includes("Explore the guide")
)
  fail("home: Senior Dog Care Guide book section is incomplete");
for (const path of [
  "/find-care/",
  "/wednesday-introductions/",
  "/pet-loss-support/",
  "/memorial-tree/",
])
  if (!home.includes(`href="${path}"`))
    fail(`home: missing bottom support pathway ${path}`);
if (
  !home.includes(
    'href="https://www.woafy.pet/smart-bed/">Explore Bed + Smart Base →',
  ) ||
  !home.includes(
    'href="https://www.woafy.pet/smart-base/">See how early alerts work →',
  )
)
  fail("home: product calls to action must use the WoafyPet domain");
const homeImages = [...home.matchAll(/<img src="([^"]+)"/g)].map(
  (match) => match[1],
).filter((source) => source !== "/assets/woafmeow-logo-coral.png");
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
if (!careCircle.includes("data-account-gate"))
  fail("care circle: account gate is missing");
if (count(careCircle, /data-account-ask-form\b/g) !== 1)
  fail("care circle: expected exactly one account ask form");
if (count(careCircle, /data-question-image-input\b/g) !== 1)
  fail("care circle: optional question photo upload is missing");
if (count(careCircle, /data-circle-filter=/g) < 7)
  fail("care circle: topic filters missing");
if (count(careCircle, /name="lessonVisibility"/g) !== 2)
  fail("care circle: compact per-question privacy choice is incomplete");

for (const route of lessonRoutes) {
  const html = routeHtml.get(route) || "";
  if (count(html, /data-lesson-chapter="[1234]"/g) !== 4)
    fail(`${route}: expected four visible chapters`);
  if (count(html, /data-chapter-quiz\b/g) !== 4)
    fail(`${route}: expected four quizzes`);
  if (count(html, /data-community-interaction=/g) !== 0)
    fail(`${route}: lesson-level likes or comments remain`);
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
    count(html, /data-tailored-part="[1234]"/g) !== 4 ||
    count(html, /data-tailored-chapter-steps="[1234]"/g) !== 4 ||
    count(html, /data-tailored-chapter-summary="[1234]"/g) !== 4
  )
    fail(`${route}: condition-tailored chapter hooks are missing`);
  if (
    count(html, /class="lesson-personal-context"/g) !== 1 ||
    count(html, /data-tailored-context/g) !== 1
  )
    fail(`${route}: dog-specific lesson context must appear exactly once`);
  if (/class="tailored-context"|class="lesson-result-v7"/.test(html))
    fail(`${route}: repeated or obsolete focused-answer section remains`);
  const lessonMain = html.match(/<main\b[\s\S]*?<\/main>/)?.[0] || "";
  const lessonImages = [
    ...lessonMain.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g),
  ].map((match) => match[1]);
  if (lessonImages.length < 5 || new Set(lessonImages).size < 5)
    fail(`${route}: expected a distinct hero image and four chapter images`);
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
if (account.includes('name="publicProfileConsent"'))
  fail("account: legacy account-wide public consent is still present");
if (!account.includes("Choose Public or Private separately"))
  fail("account: per-question privacy explanation is missing");
if (
  !account.includes('name="ownerName"') ||
  !account.includes('<select name="breed" required>') ||
  !account.includes("Mixed breed — unknown mix") ||
  !account.includes('name="weightRange"') ||
  !account.includes('value="Arthritis or joint pain"') ||
  !account.includes("data-private-lessons-list")
)
  fail("account: structured dog profile or private lesson library is incomplete");
if (account.includes("data-account-api"))
  fail("account: profile must not perform an account-wide server sync");
if (
  !account.includes('href="/health-timeline/"') ||
  !account.includes("data-account-submit")
)
  fail("account: Health Timeline profile action is missing");
if (!account.includes("data-pet-photo-input"))
  fail("account: dog profile photo upload is missing");

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
  "data-health-share-form",
  "data-health-vet-name",
  "data-health-vet-email",
  "data-health-share-note",
  "data-health-email-vet",
  "data-health-web-share",
  "data-health-share-status",
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
    'data-provider-api="https://woafypet-senior-care-8kt.pages.dev/api/provider-inquiry"',
  )
)
  fail("find care: provider form API missing");
if (!directory.includes("data-directory-load-more"))
  fail("find care: progressive reveal missing");
if (/directory-credibility|provider-source-mark/.test(directory))
  fail("find care: credibility pills or provider placeholders remain");

const guide = routeHtml.get("/guide/") || "";
if (
  count(
    guide,
    /data-submit-api="https:\/\/woafypet-senior-care-8kt\.pages\.dev\/api\/newsletter"/g,
  ) !== 1 ||
  count(guide, /data-guide-delivery/g) !== 1
)
  fail("guide: expected one active email-delivery form");
if (
  !guide.includes('name="guideConsent" value="true"') ||
  guide.includes('name="marketingConsent"') ||
  guide.includes('name="consent" value="true"') ||
  !guide.includes("WoafMeow_Senior_Dog_Care_Field_Guide.pdf") ||
  !existsSync(
    resolve(
      dist,
      "assets",
      "WoafMeow_Senior_Dog_Care_Field_Guide.pdf",
    ),
  )
)
  fail("guide: PDF delivery asset or guide-only consent is incomplete");
if (
  count(guide, /class="guide-topics-v6"/g) !== 1 ||
  count(guide, /<section class="guide-/g) < 5
)
  fail("guide: visual outcome structure incomplete");

const runtime = readFileSync(resolve(dist, "app.js"), "utf8");
if (
  !runtime.includes("woafmeow-public-lessons-v1") ||
  !runtime.includes("data-delete-public-lesson") ||
  !runtime.includes('result.delivery !== "sent"')
)
  fail("runtime: owner deletion or truthful guide-delivery receipt is missing");
if (
  !lessonRoutes.every((route) =>
    (routeHtml.get(route) || "").includes("Delete my public post"),
  )
)
  fail("Care Circle lessons: owner delete control is missing");

const memorial = routeHtml.get("/memorial-tree/") || "";
const dialogIndex = memorial.indexOf("<dialog");
if (dialogIndex < 0 || !memorial.slice(dialogIndex).includes("$10 per tree"))
  fail("memorial: price must appear in the purchase dialog");
if (!memorial.includes("Stripe collects the $10 payment"))
  fail("memorial: secure-payment price disclosure is missing");
if (
  !memorial.includes("Usambara") ||
  !memorial.includes("api/memorial-tree-checkout") ||
  !memorial.includes("data-checkout-form")
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
    'data-submit-api="https://woafypet-senior-care-8kt.pages.dev/api/contact"',
  ) ||
  !wednesday.includes('value="wednesday-match"')
)
  fail("Wednesday: active request endpoint missing");
if (!wednesday.includes("Under 1 year") || !wednesday.includes("16+ years"))
  fail("Wednesday: dog age range is incomplete");

const support = routeHtml.get("/support/") || "";
if (!support.includes('data-submit-api="https://woafypet-senior-care-8kt.pages.dev/api/contact"'))
  fail("support: contact endpoint missing");
const petLoss = routeHtml.get("/pet-loss-support/") || "";
if (!petLoss.includes('href="/memorial-tree/"') || !petLoss.includes("Plant a memorial tree"))
  fail("pet loss: memorial-tree pathway is missing");
if (!support.includes('class="contact-direct"') || !support.includes("Talk to a real person."))
  fail("support: direct contact page is missing");
if (/support-faq|Common questions|FAQs/i.test(support))
  fail("support: removed FAQ content remains");

const about = routeHtml.get("/about/") || "";
if (
  !about.includes("Bobby was eight when joint cancer took him.") ||
  !about.includes("I’m Robert Luo—Bobby’s person") ||
  !about.includes("we did not understand Bobby’s health change in time") ||
  !about.includes("he was very good at hiding pain") ||
  !about.includes("OUR MISSION · HOW WE HELP")
)
  fail("about: Bobby's first-person story or combined mission is missing");
if (/A NOTE FROM ROBERT|Robert, Co-Founder of WoafMeow/i.test(about))
  fail("about: removed generic Robert note remains");
if (/story-mission-v7|story-build-v7|story-values/.test(about))
  fail("about: old split mission and values sections remain");
for (const [route, html] of routeHtml) {
  for (const quote of html.matchAll(/<blockquote\b[\s\S]*?<\/blockquote>/gi)) {
    const quoteEnd = (quote.index || 0) + quote[0].length;
    const attributionWindow = `${quote[0]}${html.slice(quoteEnd, quoteEnd + 280)}`;
    if (!/<cite\b|<\/blockquote>\s*<strong>\s*(?:Silvan|Dr\.|Robert|Annika)/i.test(attributionWindow)) {
      fail(`${route}: quotation is missing a named speaker`);
    }
  }
}
if ([...routeHtml.values()].some((html) => />FAQs?</i.test(html)))
  fail("site: FAQ navigation remains");

const css = readFileSync(resolve(dist, "styles.css"), "utf8");
for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const selector = rule[1];
  const declarations = rule[2];
  if (
    /object-fit:\s*cover/.test(declarations) &&
    !/home-contract-(?:support|circle|complete)|circle-public-card|match-issues|loss-first-days|directory-hero-v6|practice-band-v6|health-hero|memorial-partner-gallery/.test(selector)
  )
    fail("styles: cropping is only allowed for explicit editorial media frames");
}
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
const robots = readFileSync(resolve(dist, "robots.txt"), "utf8");
if (!robots.includes("Allow: /") || !robots.includes("https://www.woafmeow.com/sitemap.xml"))
  fail("robots.txt: production crawl and sitemap directives missing");
if (!existsSync(resolve(dist, "CNAME")) || readFileSync(resolve(dist, "CNAME"), "utf8").trim() !== "www.woafmeow.com")
  fail("CNAME: production domain missing");
if (!existsSync(resolve(dist, "sitemap.xml")))
  fail("sitemap.xml: production sitemap missing");

if (failures.length) {
  console.error(`Static verification failed (${failures.length}):`);
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(
  `Static verification passed: ${routes.length} routes, ${lessonRoutes.length} public lessons, ${count(directory, /<article\b[^>]*\bdata-directory-profile\b/g)} official profiles, ${count(directory, /data-directory-resource\b/g)} official resources.`,
);

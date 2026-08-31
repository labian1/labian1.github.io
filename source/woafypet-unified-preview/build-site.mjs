import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, "dist");
const ASSET_VERSION = "20260830.1";
const GUIDE_PDF_NAME = "WoafMeow_Senior_Dog_Care_Field_Guide.pdf";
const BACKEND_ORIGIN = "https://woafypet-senior-care-8kt.pages.dev";
const PUBLIC_ORIGIN = "https://www.woafmeow.com";
const REFINEMENT_MARKER =
  "/* 2026-08-24 reference-contract refinement: natural images, compact rhythm, premium product storytelling */";

const imageMeta = {
  "woafmeow-logo-coral.png": [512, 64],
  "hero-bed.webp": [1680, 946],
  "bed-portrait.webp": [1120, 1400],
  "resting-dog.webp": [940, 1671],
  "owner-comfort.webp": [1120, 1400],
  "head-bolster.webp": [940, 1671],
  "cleaning-cover.webp": [940, 1671],
  "smart-base.webp": [1600, 899],
  "bed-layers.png": [795, 634],
  "bobby.jpg": [640, 858],
  "senior-dog-home.webp": [1672, 941],
  "mobility-dog.webp": [1448, 1086],
  "owner-dog-couch.webp": [1122, 1402],
  "memorial-tree.webp": [1600, 1064],
  "lesson-mobility.webp": [1800, 1217],
  "lesson-appetite.webp": [1800, 1201],
  "wednesday.webp": [1800, 1200],
  "pet-loss.webp": [1800, 2700],
  "lesson-night.webp": [1600, 1600],
  "sleep-dog-home.webp": [1122, 1402],
  "owner-senior-dog.webp": [1448, 1086],
  "grief-support.webp": [1448, 1086],
  "problem-mobility-senior-lab.jpg": [1800, 1183],
  "problem-restless-night-senior-black-lab.jpg": [1800, 3201],
  "problem-appetite-owner-and-dogs.jpg": [1800, 2700],
  "problem-restless-night-dog-sleeping.jpg": [1800, 1200],
  "problem-appetite-owner-offering-food.jpg": [1800, 1200],
  "problem-daily-routine-senior-dark-dog.jpg": [1800, 1192],
  "guide-recognize-older-golden.jpg": [1800, 1125],
  "guide-observe-beagle-owner.jpg": [1800, 1200],
  "guide-action-brown-dog-resting.jpg": [1800, 1200],
  "guide-solutions-white-brown-dog.jpg": [1800, 1200],
  "guide-vet-care-brown-dog.jpg": [1800, 1198],
  "community-owner-match.jpg": [1800, 1200],
  "product-prototype-golden.webp": [1083, 1452],
  "product-prototype-golden-full-v2.png": [1672, 941],
  "product-prototype-akita.webp": [1084, 1451],
  "product-hero-official.png": [1600, 686],
  "product-visualization-smart-base.png": [1600, 899],
  "bed-smart-base-system-v2.png": [1758, 895],
  "bed-smart-base-system-branded.png": [1758, 895],
  "smart-base-weekly-trend-v1.png": [1448, 1086],
  "senior-dog-care-guide-book-v2.png": [1452, 1083],
  "real-home-owner-dog.jpg": [1800, 1200],
  "real-care-circle-owner-dog.jpg": [1800, 1201],
  "real-senior-care-at-home.jpg": [1800, 1013],
  "real-pet-loss-support.jpg": [1800, 1200],
  "real-memorial-tree-planting.jpg": [1600, 1064],
  "real-owner-match-walk.jpg": [1800, 2700],
  "real-comfort-hug.jpg": [1800, 1217],
  "real-companion-moment.jpg": [1800, 1200],
  "real-holding-dog.jpg": [1800, 1200],
  "real-golden-outdoors.jpg": [1800, 1200],
  "real-golden-forest.jpg": [1800, 2385],
  "deborah-silverstein.jpg": [160, 200],
  "melissa-goldberg.jpg": [1024, 1536],
  "katherine-todd.jpg": [512, 512],
  "ryan-veterinary-hospital.jpg": [1440, 500],
  "uc-davis-vmth.png": [1000, 863],
  "virginia-tech-vth.jpg": [1024, 683],
  "cornell-companion-animal-hospital.png": [845, 475],
  "cornell-behavior-medicine.jpg": [900, 600],
  "uf-small-animal-hospital.jpg": [1680, 1120],
  "msu-small-animal-clinic.png": [1900, 800],
  "tamu-small-animal-hospital.jpg": [2178, 1446],
  "bobbi-conner.jpg": [731, 1024],
  "cornell-sports-rehab.png": [900, 600],
  "cornell-nutrition.jpg": [900, 600],
  "christopher-frye.jpg": [600, 650],
  "vet-silvan-urfer.jpg": [1200, 1200],
  "vet-annika-bremhorst.png": [1000, 600],
  "vet-annika-bremhorst-official.jpg": [800, 533],
  "usambara-community-planting.jpg": [689, 915],
  "usambara-mangrove-planting.jpg": [741, 334],
  "vca-official-brand.webp": [800, 349],
  "bluepearl-official-brand.png": [512, 512],
  "usambara-sapling-planting.jpg": [1055, 818],
  "usambara-school-nursery.jpg": [640, 427],
};

function loadJson(pathname) {
  return JSON.parse(readFileSync(pathname, "utf8"));
}

const seniorCareData = join(ROOT, "..", "senior-care-platform", "data");
const seniorCareMedia = join(ROOT, "..", "senior-care-platform", "media");
const originalDirectoryProfiles = [
  ...loadJson(join(seniorCareData, "directoryEntries.people.json")),
  ...loadJson(
    join(seniorCareData, "directoryEntries.public-profiles.json"),
  ).filter((entry) => !entry.inactive && entry.address && entry.phone),
]
  .filter(
    (entry) => entry.image && existsSync(join(seniorCareMedia, entry.image)),
  )
  .map((entry) => ({
    ...entry,
    asset: basename(entry.image),
    categories: entry.categories.map((category) =>
      category === "nutritionists" ? "nutrition-weight" : category,
    ),
  }));
const directoryCardImages = [
  "guide-vet-care-brown-dog.jpg",
  "real-senior-care-at-home.jpg",
  "real-companion-moment.jpg",
  "real-comfort-hug.jpg",
  "real-holding-dog.jpg",
  "guide-observe-beagle-owner.jpg",
];
const expandedDirectoryProfiles = loadJson(
  join(ROOT, "data", "find-care-profiles.expanded.json"),
).map((entry) => ({
  ...entry,
  address: entry.coverage,
  asset: "",
  brandAsset: "bluepearl-official-brand.png",
  brandAlt: "BluePearl Pet Hospital official brand mark",
  verified: true,
}));
const vcaDirectoryProfiles = loadJson(
  join(ROOT, "data", "find-care-profiles.vca.json"),
).map((entry) => ({
  ...entry,
  address: entry.coverage,
  asset: "",
  brandAsset: "vca-official-brand.webp",
  brandAlt: "VCA Animal Hospitals official brand mark",
  verified: true,
}));
const directoryProfiles = [
  ...originalDirectoryProfiles,
  ...expandedDirectoryProfiles,
  ...vcaDirectoryProfiles,
];
const directoryResources = loadJson(
  join(seniorCareData, "directoryEntries.json"),
);

const directoryCategories = [
  ["senior-veterinarians", "Senior veterinary care"],
  ["pain-mobility-rehab", "Pain & mobility rehabilitation"],
  ["nutrition-weight", "Nutrition & weight"],
  ["behavior-anxiety", "Behavior & nighttime changes"],
  ["emergency-vets", "Emergency care"],
  ["specialty-hospitals", "Specialty hospitals"],
  ["oncology-specialists", "Oncology & internal medicine"],
  ["clinical-trials", "Clinical trials"],
  ["veterinary-social-workers", "Veterinary social work"],
  ["hospice-palliative-care", "Hospice & palliative care"],
  ["quality-of-life-consults", "Quality-of-life consultations"],
  ["in-home-euthanasia", "In-home euthanasia"],
  ["grief-counselors", "Pet loss grief support"],
  ["memorial-aftercare", "Memorial & aftercare"],
];

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function image(name, alt, options = {}) {
  const [width, height] = imageMeta[name] || [];
  const className = options.className
    ? ` class="${escapeHtml(options.className)}"`
    : "";
  const loading = "eager";
  const priority = options.eager ? ' fetchpriority="high"' : "";
  return `<img src="/assets/${name}" alt="${escapeHtml(alt)}" width="${width}" height="${height}" loading="${loading}" decoding="async"${priority}${className}>`;
}

function icon(name) {
  const paths = {
    rest: '<path d="M5 16.5h14M7 14V9.5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2V14M5 14V6m14 8V6M8.5 11h7"/>',
    notice:
      '<path d="M4 12s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z"/><circle cx="12" cy="12" r="2.2"/>',
    act: '<path d="M12 3v4m0 10v4M3 12h4m10 0h4M6.3 6.3l2.8 2.8m5.8 5.8 2.8 2.8m0-11.4-2.8 2.8m-5.8 5.8-2.8 2.8"/><circle cx="12" cy="12" r="3"/>',
    guide:
      '<path d="M5 4.5h10a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3V4.5Z"/><path d="M8 4.5V17a3 3 0 0 0 3 3M9.5 9h5m-5 3h5"/>',
    proof:
      '<path d="M12 3 5 6v5c0 4.7 2.8 8.1 7 10 4.2-1.9 7-5.3 7-10V6l-7-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
    heart:
      '<path d="M20.8 8.7c0 5.2-8.8 10.3-8.8 10.3S3.2 13.9 3.2 8.7A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.8 2.3Z"/>',
    tree: '<path d="M12 21v-8m0 3-3-3m3 1 4-4"/><path d="M7 14a4 4 0 0 1-1-7.9A5 5 0 0 1 15.8 7 3.5 3.5 0 0 1 16 14H7Z"/>',
    people:
      '<circle cx="9" cy="8" r="3"/><path d="M3.5 19v-1.5A4.5 4.5 0 0 1 8 13h2a4.5 4.5 0 0 1 4.5 4.5V19M16 5.5a2.5 2.5 0 0 1 0 5M17 13a4 4 0 0 1 3.5 4v1"/>',
    care: '<path d="M4 13h4l2-6 3.5 10 2-6H20"/><path d="M19.5 7.5A4.5 4.5 0 0 0 12 5.2 4.5 4.5 0 0 0 4.5 7.5"/>',
  };
  return `<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.heart}</svg>`;
}

const button = (label, href, style = "primary") =>
  `<a class="button ${style}" href="${href}">${escapeHtml(label)} <span aria-hidden="true">→</span></a>`;

function sectionHeading(kicker, title, copy = "", align = "") {
  return `<div class="section-heading ${align}"><span class="eyebrow">${escapeHtml(kicker)}</span><h2>${escapeHtml(title)}</h2>${copy ? `<p>${escapeHtml(copy)}</p>` : ""}</div>`;
}

function previewForm({
  id,
  title,
  copy,
  fields,
  submit = "Join the preview list",
  compact = false,
}) {
  return `<form class="preview-form${compact ? " compact" : ""}" id="${escapeHtml(id)}" data-preview-form data-form-title="${escapeHtml(title)}">
    <div class="form-heading"><h2>${escapeHtml(title)}</h2>${copy ? `<p>${escapeHtml(copy)}</p>` : ""}</div>
    <div class="form-grid">${fields.join("")}</div>
    <label class="consent-row"><input type="checkbox" name="privacyConsent" required><span>I agree that WoafyPet may use these details to respond to this request.</span></label>
    <button class="button primary" type="submit">${escapeHtml(submit)} <span aria-hidden="true">→</span></button>
    <p class="form-note" data-form-note role="status" aria-live="polite"></p>
  </form>`;
}

function providerInquiryForm() {
  const locations = [
    ["Albuquerque, New Mexico", "Albuquerque, New Mexico"],
    ["Atlanta, Georgia", "Atlanta, Georgia"],
    ["Austin, Texas", "Austin, Texas"],
    ["Baltimore, Maryland", "Baltimore, Maryland"],
    ["Boston, Massachusetts", "Boston, Massachusetts"],
    ["Chicago, Illinois", "Chicago, Illinois"],
    ["Dallas–Fort Worth, Texas", "Dallas–Fort Worth, Texas"],
    ["Denver, Colorado", "Denver, Colorado"],
    ["Detroit, Michigan", "Detroit, Michigan"],
    ["Houston, Texas", "Houston, Texas"],
    ["Los Angeles, California", "Los Angeles, California"],
    ["Miami, Florida", "Miami, Florida"],
    ["Minneapolis–Saint Paul, Minnesota", "Minneapolis–Saint Paul, Minnesota"],
    ["Nashville, Tennessee", "Nashville, Tennessee"],
    ["New York City, New York", "New York City, New York"],
    ["Philadelphia, Pennsylvania", "Philadelphia, Pennsylvania"],
    ["Phoenix, Arizona", "Phoenix, Arizona"],
    ["Portland, Oregon", "Portland, Oregon"],
    ["Raleigh–Durham, North Carolina", "Raleigh–Durham, North Carolina"],
    ["Sacramento, California", "Sacramento, California"],
    ["San Diego, California", "San Diego, California"],
    [
      "San Francisco Bay Area, California",
      "San Francisco Bay Area, California",
    ],
    ["Seattle, Washington", "Seattle, Washington"],
    ["St. Louis, Missouri", "St. Louis, Missouri"],
    ["Tampa, Florida", "Tampa, Florida"],
    ["Washington, District of Columbia", "Washington, District of Columbia"],
    ["Calgary, Alberta", "Calgary, Alberta"],
    ["Montreal, Quebec", "Montreal, Quebec"],
    ["Toronto, Ontario", "Toronto, Ontario"],
    ["Vancouver, British Columbia", "Vancouver, British Columbia"],
    ["London, United Kingdom", "London, United Kingdom"],
    ["Sydney, New South Wales", "Sydney, New South Wales"],
    ["Melbourne, Victoria", "Melbourne, Victoria"],
    ["Multiple locations or online", "Multiple locations or online"],
  ];
  return `<form class="preview-form" id="practice-request" data-provider-inquiry-form data-provider-email="robert.luo@woafmeow.com" action="mailto:robert.luo@woafmeow.com" method="post" enctype="text/plain">
    <div class="form-heading"><h2>Submit your practice for review.</h2></div>
    <input name="requestType" type="hidden" value="directory-listing">
    <input name="coverage" type="hidden" value="">
    <label hidden aria-hidden="true"><span>Leave this field blank</span><input name="companyWebsite" tabindex="-1" autocomplete="off"></label>
    <div class="form-grid">
      <label><span>Your name</span><input name="contactName" autocomplete="name" maxlength="100" required></label>
      <label><span>Work email</span><input name="email" type="email" autocomplete="email" maxlength="254" required></label>
      <label><span>Practice or service name</span><input name="organization" autocomplete="organization" maxlength="180" required></label>
      <label><span>City and region</span><select name="coveragePreset" data-coverage-preset required><option value="">Choose one</option>${locations.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join("")}<option value="other">Another city or region</option></select></label>
      <label class="field-wide" data-coverage-other hidden><span>Enter your city and region</span><input name="coverageOther" maxlength="200" autocomplete="address-level2"></label>
      <label class="field-wide"><span>Service category</span><select name="serviceType" required><option value="">Choose one</option><option>Senior-dog veterinary care</option><option>Rehabilitation or mobility</option><option>Emergency care</option><option>Hospice or palliative care</option><option>Grief or aftercare support</option><option>Other</option></select></label>
      <label class="field-wide"><span>Credential and official website</span><input name="website" type="url" maxlength="500" placeholder="https://" required></label>
      <label class="field-wide"><span>How can you help pet owners?</span><textarea name="message" maxlength="1000" placeholder="Describe who you help, the care you provide, and the best first step for families." required></textarea></label>
    </div>
    <label class="consent-row"><input type="checkbox" name="consent" required><span>I am authorized to share these details and agree that WoafyPet may contact me about this directory submission.</span></label>
    <button class="button primary" type="submit">Submit your practice for review <span aria-hidden="true">→</span></button>
    <p class="form-note" data-provider-inquiry-note role="status" aria-live="polite"></p>
  </form>`;
}

const field = {
  name: '<label><span>Your name</span><input name="name" autocomplete="name" maxlength="100" required></label>',
  email:
    '<label><span>Email</span><input name="email" type="email" autocomplete="email" maxlength="254" required></label>',
  emailWide:
    '<label class="field-wide"><span>Email</span><input name="email" type="email" autocomplete="email" maxlength="254" required></label>',
  zip: '<label><span>ZIP or postal code</span><input name="postalCode" autocomplete="postal-code" maxlength="14" required></label>',
  dogAge:
    '<label><span>Dog age <em>(optional)</em></span><input name="dogAge" inputmode="decimal" maxlength="5"></label>',
};

const lessons = [
  {
    slug: "slower-after-rest",
    topic: "Mobility",
    title: "Slower after rest",
    eyebrow: "Movement · 3 chapters + quizzes",
    intro:
      "Turn a vague slower morning into a useful first-rise record and a safer plan for today.",
    image: "problem-mobility-senior-lab.jpg",
    imageAlt: "Senior yellow Labrador moving carefully outdoors",
    conditionLabel: "Which movement is hardest?",
    conditionOptions: [
      "Getting up after sleep",
      "Turning or using stairs",
      "Starting a walk",
      "Recovering after activity",
    ],
    impactOptions: [
      "Still doing everything",
      "Avoiding one activity",
      "Needs help with movement",
      "Sudden change or cannot stand",
    ],
    chapters: [
      {
        title: "Measure one natural first rise",
        result:
          "Record the first rise clearly enough to compare again tomorrow.",
        copy: "Watch one ordinary rise after a familiar nap. Time the pause, count the first stiff steps, and note whether the feet slip or movement loosens.",
        steps: [
          "Use the same rest place and time of day when possible.",
          "Record the surface, pause, first 10–15 steps, and recovery.",
          "Never repeat stairs, jumps, or standing tests for a video.",
        ],
        quiz: {
          question: "Which note is most useful?",
          options: [
            ["vague", "He looked old this morning."],
            [
              "specific",
              "After his morning nap, he paused 8 seconds before standing and loosened after 12 steps.",
            ],
            ["test", "I made him stand five times to check."],
          ],
          answer: "specific",
          correct:
            "Exactly. Timing, context, and what happened next make the change useful.",
          retry:
            "Choose the observation with timing, context, and no forced repetition.",
        },
      },
      {
        title: "Make the usual route easier today",
        result: "You will know which low-risk home change to try first.",
        copy: "Reduce slipping and unnecessary effort while keeping the routine familiar enough to see what actually helps.",
        steps: [
          "Add traction on the normal rise and water route.",
          "Keep water, toileting, and a comfortable rest place easy to reach.",
          "Change one environmental detail at a time and record the result.",
        ],
        quiz: {
          question: "What is the safest first change for slipping feet?",
          options: [
            ["traction", "Add traction on the route your dog already uses."],
            ["exercise", "Add extra stairs to strengthen the legs."],
            ["medicine", "Give a human pain medicine."],
          ],
          answer: "traction",
          correct:
            "Right. Improve footing without forcing more effort or giving unapproved medicine.",
          retry:
            "Choose the option that reduces risk without testing or medicating the dog.",
        },
      },
      {
        title: "Build a vet-ready mobility summary",
        result: "You will have the exact points to bring to the appointment.",
        copy: "Lead with when the change began, how often it happens, what helps, and which daily activity has become harder.",
        steps: [
          "List current medicines, supplements, injuries, and recent activity changes.",
          "Bring one safe video of an ordinary rise when available.",
          "Ask what improvement should look like and which changes need same-day advice.",
        ],
        quiz: {
          question:
            "What belongs in the first sentence of the veterinary call?",
          options: [
            ["guess", "I think this must be arthritis."],
            [
              "timeline",
              "For 10 days, she has paused after naps and now avoids the two kitchen steps.",
            ],
            ["age", "She is old, so I expected this."],
          ],
          answer: "timeline",
          correct:
            "Yes. Start with the change, timeline, and lost function—not a guessed diagnosis.",
          retry:
            "Choose the answer that reports a specific change and timeline.",
        },
      },
    ],
    urgent:
      "Seek prompt veterinary help for sudden inability to stand, dragging a limb, crying out, collapse, severe swelling, or rapid decline after an injury.",
    community: {
      question:
        "My dog is stiff for the first minute after naps. What should I record?",
      excerpt:
        "Start with one natural first rise: surface, pause, first steps, slipping, and recovery.",
      helpful: 46,
      replies: [
        [
          "Maya",
          "Timing the first 15 steps made our appointment much more specific.",
        ],
        [
          "Jon",
          "A runner on the hallway route helped us see the difference safely.",
        ],
      ],
    },
  },
  {
    slug: "restless-at-night",
    topic: "Sleep",
    title: "Restless at night",
    eyebrow: "Sleep · 3 chapters + quizzes",
    intro:
      "Separate pacing, wake-ups, toileting, thirst, breathing, and confusion into a clear night pattern.",
    image: "problem-restless-night-dog-sleeping.jpg",
    imageAlt: "Dog sleeping peacefully on a bed at home",
    conditionLabel: "What happens first at night?",
    conditionOptions: [
      "Pacing or cannot settle",
      "Wakes to go outside",
      "Panting or vocalizing",
      "Seems lost or confused",
    ],
    impactOptions: [
      "One unusual night",
      "Two or three nights a week",
      "Most nights",
      "Severe distress or breathing trouble",
    ],
    chapters: [
      {
        title: "Build a 7-night wake-up timeline",
        result:
          "You will see whether the same trigger, time, and behavior repeat.",
        copy: "Write the time, first behavior, where your dog went, what happened before bed, and what finally helped them settle.",
        steps: [
          "Separate pacing, panting, vocalizing, thirst, and toileting.",
          "Note meals, medicines, visitors, activity, and room temperature.",
          "Record ordinary nights; do not keep your dog awake to test a theory.",
        ],
        quiz: {
          question: "Which record is most useful?",
          options: [
            [
              "pattern",
              "1:40 a.m.: paced to the back door, urinated, then settled in 6 minutes.",
            ],
            ["label", "Bad night again."],
            ["cause", "Definitely dementia."],
          ],
          answer: "pattern",
          correct:
            "Correct. Time, sequence, and what helped create a usable pattern.",
          retry:
            "Choose the note that describes the sequence without guessing the cause.",
        },
      },
      {
        title: "Reduce nighttime friction",
        result:
          "You will know how to make tonight calmer without masking the pattern.",
        copy: "Keep the route predictable and change only one environmental detail at a time.",
        steps: [
          "Keep water and a clear toileting route available.",
          "Use gentle night lighting and traction on the familiar path.",
          "Check noise, temperature, and access to the usual rest place.",
        ],
        quiz: {
          question: "Which change preserves useful information?",
          options: [
            ["one", "Add a night light on the usual bathroom route."],
            ["many", "Move the bed, food, water, and bedtime all at once."],
            ["restrict", "Remove water so the dog cannot wake to drink."],
          ],
          answer: "one",
          correct:
            "Yes. One safe change is easier to evaluate and does not restrict water.",
          retry:
            "Choose one low-risk environmental change—not several changes or water restriction.",
        },
      },
      {
        title: "Ask the right nighttime questions",
        result:
          "You will bring a concise night pattern and know what needs faster help.",
        copy: "Night changes can have many causes. Share the sequence rather than diagnosing it at home.",
        steps: [
          "Ask whether pain, bathroom urgency, medication timing, senses, or cognitive changes need evaluation.",
          "Bring short clips only when they capture ordinary behavior safely.",
          "Ask which signs mean after-hours care rather than waiting.",
        ],
        quiz: {
          question: "What is the best appointment question?",
          options: [
            ["broad", "Why is he weird at night?"],
            [
              "focused",
              "Could pain, urinary urgency, medication timing, or cognitive change explain this 2 a.m. pacing pattern?",
            ],
            ["certainty", "Can you confirm it is dementia without an exam?"],
          ],
          answer: "focused",
          correct:
            "Exactly. A focused question keeps several reasonable causes open for evaluation.",
          retry:
            "Choose the question that shares the pattern without demanding a diagnosis.",
        },
      },
    ],
    urgent:
      "Breathing difficulty, repeated unproductive retching, collapse, a swollen abdomen, inability to urinate, severe distress, or sudden confusion needs urgent veterinary advice.",
    community: {
      question:
        "What details matter when my senior dog starts pacing at 2 a.m.?",
      excerpt:
        "Record the first behavior, exact time, bathroom trip, breathing, and what finally helps.",
      helpful: 38,
      replies: [
        [
          "Nina",
          "Separating thirst from pacing showed us the wake-ups were not all the same.",
        ],
        [
          "Alex",
          "Our vet asked for medication timing, which I had not thought to include.",
        ],
      ],
    },
  },
  {
    slug: "changes-in-appetite",
    topic: "Food",
    title: "Changes in appetite",
    eyebrow: "Food · 3 chapters + quizzes",
    intro:
      "Measure what was offered, what was eaten, and how eating looks before guessing at a cause.",
    image: "guide-recognize-older-golden.jpg",
    imageAlt: "Caregiver offering food to a dog at home",
    conditionLabel: "Which eating change is closest?",
    conditionOptions: [
      "Leaves part of the meal",
      "Approaches then walks away",
      "Chews or drops food differently",
      "Refuses food completely",
    ],
    impactOptions: [
      "One meal",
      "Less for one day",
      "Less for two or more days",
      "Weak, vomiting, painful, or dehydrated",
    ],
    chapters: [
      {
        title: "Measure the meal change",
        result:
          "You will replace ‘eating less’ with amounts, timing, and paired signs.",
        copy: "Use the same scoop or scale and record what was offered, what remained, treats, water, vomiting, stool, and recent weight when available.",
        steps: [
          "Measure before and after the meal.",
          "Keep treats and table food in the same record.",
          "Add medication timing and any recent food change.",
        ],
        quiz: {
          question: "Which note gives the clearest amount?",
          options: [
            [
              "amount",
              "Offered 2 cups at 6 p.m.; ate about ¾ cup and no treats.",
            ],
            ["mood", "Did not seem hungry."],
            ["guess", "Probably bored with the food."],
          ],
          answer: "amount",
          correct:
            "Correct. Offered amount, eaten amount, time, and extras make the change measurable.",
          retry:
            "Choose the note with quantities and timing, not a mood or guessed cause.",
        },
      },
      {
        title: "Watch how eating happens",
        result: "You will spot mouth, nausea, or effort clues worth reporting.",
        copy: "The way your dog approaches food can be as useful as the amount eaten.",
        steps: [
          "Note dropping food, chewing on one side, or preferring soft food.",
          "Record lip licking, repeated swallowing, approaching then leaving, or hiding.",
          "Do not add supplements or make a restrictive diet change without veterinary guidance.",
        ],
        quiz: {
          question: "Which behavior should be recorded separately?",
          options: [
            ["chewing", "Drops kibble and chews only on the left side."],
            ["preference", "Likes chicken better than kibble."],
            ["pressure", "Finishes when hand-fed after repeated prompting."],
          ],
          answer: "chewing",
          correct:
            "Yes. A new chewing pattern is specific context for the veterinary team.",
          retry:
            "Choose the new eating behavior that could show discomfort or effort.",
        },
      },
      {
        title: "Prepare the appetite call",
        result:
          "You will know what to report and when waiting is not appropriate.",
        copy: "Combine the timeline with the whole routine: water, bathroom, energy, weight, medicines, and medical history.",
        steps: [
          "List dental history, conditions, and all current medicines.",
          "Ask how soon your dog should be examined.",
          "Confirm what food, water, weight, vomiting, and stool changes to monitor next.",
        ],
        quiz: {
          question: "Which update changes the urgency of the call?",
          options: [
            ["urgent", "Has not eaten, vomited twice, and seems weak."],
            ["brand", "Prefers one flavor."],
            ["bowl", "Uses a blue bowl."],
          ],
          answer: "urgent",
          correct:
            "Right. Poor intake paired with vomiting and weakness needs prompt veterinary advice.",
          retry:
            "Choose the paired signs that suggest the dog may need faster help.",
        },
      },
    ],
    urgent:
      "Repeated vomiting, abdominal swelling, marked weakness, blood, pain, dehydration, known diabetes with poor appetite, or a dog who stops eating needs prompt veterinary advice.",
    community: {
      question:
        "My dog walks to the bowl and then leaves. What should I watch?",
      excerpt:
        "Measure the amount, then note chewing, swallowing, nausea clues, water, stool, and energy.",
      helpful: 41,
      replies: [
        [
          "Elena",
          "Recording how she chewed was more helpful than saying she was picky.",
        ],
        [
          "Sam",
          "The one-page meal log kept treats from disappearing from the story.",
        ],
      ],
    },
  },
  {
    slug: "drinking-more-water",
    topic: "Water",
    title: "Drinking more water",
    eyebrow: "Water · 3 chapters + quizzes",
    intro:
      "Turn extra refills, longer drinks, and bathroom changes into a clear same-day record.",
    image: "guide-observe-beagle-owner.jpg",
    imageAlt: "Beagle beside a caregiver during an ordinary home routine",
    conditionLabel: "What changed first?",
    conditionOptions: [
      "Refilling the bowl more often",
      "Longer or more frequent drinks",
      "More urine or accidents",
      "Drinking change with weakness or vomiting",
    ],
    impactOptions: [
      "Noticed today",
      "Two to seven days",
      "More than a week",
      "Cannot urinate, collapses, or seems very ill",
    ],
    chapters: [
      {
        title: "Measure one normal day",
        result:
          "Measure how much water your dog drinks in 24 hours.",
        copy: "Measure what goes into the bowl and what remains after 24 hours, accounting for spills and other animals.",
        steps: [
          "Use the same bowl and measuring cup for one ordinary day.",
          "Record refill times, urine frequency, accidents, appetite, and energy.",
          "Never restrict water unless a veterinarian specifically directs it.",
        ],
        quiz: {
          question: "What is the safest way to measure a drinking change?",
          options: [
            [
              "measure",
              "Measure bowl additions and leftovers while keeping water freely available.",
            ],
            ["restrict", "Offer less water to see if bathroom trips stop."],
            ["guess", "Count how often the dog looks at the bowl."],
          ],
          answer: "measure",
          correct:
            "Correct. Measure without restricting access to fresh water.",
          retry:
            "Choose the method that measures intake while keeping water available.",
        },
      },
      {
        title: "Pair water with the whole routine",
        result: "You will know which related signs belong in the same record.",
        copy: "Thirst becomes more informative when paired with urine, appetite, weight, vomiting, medicines, and energy.",
        steps: [
          "Note larger urine clumps, longer urination, urgency, or accidents.",
          "Add recent medicines, food changes, heat, and activity.",
          "Use a recent weight when available; do not force extra weigh-ins.",
        ],
        quiz: {
          question: "Which paired detail belongs in the same note?",
          options: [
            ["urine", "The dog is also urinating more often overnight."],
            ["color", "The water bowl is silver."],
            ["breed", "Another dog of this breed drinks a lot."],
          ],
          answer: "urine",
          correct:
            "Yes. Urine frequency helps the veterinary team interpret the drinking change.",
          retry:
            "Choose the related body-function change, not an irrelevant detail or comparison.",
        },
      },
      {
        title: "Make the call specific",
        result:
          "You will have a measured timeline and know the urgent exceptions.",
        copy: "Report when it started, approximate intake, urine changes, appetite, energy, medicines, and any vomiting.",
        steps: [
          "Ask how soon the dog should be examined and what samples may be useful.",
          "Mention conditions such as diabetes, kidney disease, or hormone disorders.",
          "Inability to urinate, collapse, severe weakness, or distress needs urgent care.",
        ],
        quiz: {
          question: "What should lead the call?",
          options: [
            [
              "data",
              "For three days, the bowl needs two extra refills and she urinates twice overnight.",
            ],
            ["diagnosis", "I know this is kidney disease."],
            ["delay", "I will wait a month to get a better average."],
          ],
          answer: "data",
          correct: "Exactly. Lead with the measured change and paired signs.",
          retry:
            "Choose the answer with timing, measurement, and related signs.",
        },
      },
    ],
    urgent:
      "Inability to urinate, collapse, severe weakness, repeated vomiting, marked dehydration, or severe distress needs urgent veterinary care.",
    community: {
      question: "How can I tell if my dog is actually drinking more?",
      excerpt:
        "Measure one ordinary 24-hour period without restricting water, then pair it with urine and energy changes.",
      helpful: 29,
      replies: [
        [
          "Priya",
          "Accounting for the second dog stopped us from overestimating the change.",
        ],
        ["Dale", "The refill times were easier to share than a guess in cups."],
      ],
    },
  },
  {
    slug: "less-interest-in-life",
    topic: "Daily life",
    title: "Less interest in daily life",
    eyebrow: "Connection · 3 chapters + quizzes",
    intro:
      "Separate one quiet day from repeated changes in greeting, play, grooming, exploring, and closeness.",
    image: "problem-daily-routine-senior-dark-dog.jpg",
    imageAlt: "Senior dark dog with a gray muzzle resting outdoors",
    conditionLabel: "Which routine changed most?",
    conditionOptions: [
      "Greeting or seeking attention",
      "Walks, sniffing, or play",
      "Grooming or family routines",
      "Hiding, distress, or sudden confusion",
    ],
    impactOptions: [
      "One quiet day",
      "Several days",
      "Most days this month",
      "Sudden severe change",
    ],
    chapters: [
      {
        title: "Define the missing moment",
        result:
          "You will identify one routine that changed instead of labeling your dog withdrawn.",
        copy: "Choose a familiar moment—greeting, sniff walk, mealtime, grooming, or resting near family—and compare what happens now.",
        steps: [
          "Record whether the dog starts, joins, finishes, or avoids the routine.",
          "Note time, environment, effort, and what helps engagement return.",
          "Look for paired movement, sleep, appetite, bathroom, hearing, or vision changes.",
        ],
        quiz: {
          question: "Which observation is clearest?",
          options: [
            [
              "specific",
              "For five evenings, she stays in the hallway instead of joining us after dinner.",
            ],
            ["label", "She seems depressed."],
            ["test", "I repeatedly called her until she came over."],
          ],
          answer: "specific",
          correct:
            "Correct. A repeated change in a familiar routine is specific and shareable.",
          retry:
            "Choose the natural, repeated routine change without a diagnosis or forced test.",
        },
      },
      {
        title: "Make connection easier",
        result:
          "You will choose one lower-effort way to keep a valued routine available.",
        copy: "Reduce the effort required to join without forcing interaction.",
        steps: [
          "Bring the familiar rest place closer to family activity.",
          "Offer shorter sniff time, gentle grooming, or quiet contact based on preference.",
          "Stop if the dog turns away, stiffens, pants, hides, or seems uncomfortable.",
        ],
        quiz: {
          question: "What is the most respectful first step?",
          options: [
            [
              "choice",
              "Offer a shorter familiar activity and let the dog choose whether to join.",
            ],
            ["force", "Keep calling until the dog participates."],
            ["new", "Introduce several new activities at once."],
          ],
          answer: "choice",
          correct:
            "Yes. Preserve choice and reduce effort rather than forcing engagement.",
          retry:
            "Choose the option that keeps the routine available without pressure.",
        },
      },
      {
        title: "Report the whole pattern",
        result:
          "You will connect the behavior change to other daily functions for evaluation.",
        copy: "Interest changes can reflect many physical, sensory, cognitive, or emotional factors. Bring the pattern, not a label.",
        steps: [
          "Share onset, frequency, preferred routines, and paired physical changes.",
          "List medicines, recent events, hearing or vision changes, and sleep disruption.",
          "Ask which evaluations and home observations should come next.",
        ],
        quiz: {
          question: "Which summary keeps useful possibilities open?",
          options: [
            [
              "whole",
              "She stopped joining us after dinner and is also slower on stairs and waking at night.",
            ],
            ["certain", "She is definitely depressed."],
            ["normal", "Old dogs lose interest, so nothing can help."],
          ],
          answer: "whole",
          correct:
            "Exactly. The whole pattern supports a better professional evaluation.",
          retry:
            "Choose the summary that connects specific changes without assuming a cause.",
        },
      },
    ],
    urgent:
      "Sudden confusion, collapse, breathing trouble, severe pain, inability to stand, seizures, or a rapid major behavior change needs prompt veterinary help.",
    community: {
      question:
        "My dog stopped joining us after dinner. Is that worth recording?",
      excerpt:
        "Yes—name the missing routine, when it changed, what helps, and any paired movement or sleep changes.",
      helpful: 35,
      replies: [
        [
          "June",
          "Writing down the exact missing routine felt much clearer than saying he was sad.",
        ],
        [
          "Theo",
          "Moving his bed closer let him join without crossing the slippery floor.",
        ],
      ],
    },
  },
  {
    slug: "bathroom-accidents",
    topic: "Bathroom",
    title: "New bathroom accidents",
    eyebrow: "Bathroom · 3 chapters + quizzes",
    intro:
      "Record timing, urgency, route, posture, urine or stool, and mobility without blame.",
    image: "guide-action-brown-dog-resting.jpg",
    imageAlt: "Brown senior dog resting at home near a familiar doorway",
    conditionLabel: "Which change is closest?",
    conditionOptions: [
      "Cannot reach the usual place in time",
      "Urinates more often",
      "Strains or changes posture",
      "Accident with pain, weakness, or blood",
    ],
    impactOptions: [
      "One accident",
      "Two or three this week",
      "Daily or increasing",
      "Cannot urinate or severe distress",
    ],
    chapters: [
      {
        title: "Record the accident without blame",
        result: "You will know the time, sequence, and body clues that matter.",
        copy: "Note when it happened, the last bathroom trip, route, urgency, posture, amount, appearance, and whether the dog seemed aware or distressed.",
        steps: [
          "Separate urine, stool, leakage, urgency, and inability to reach the door.",
          "Add water, meals, medicines, sleep, mobility, and recent routine changes.",
          "Do not punish, restrict water, or delay an urgent call to finish a log.",
        ],
        quiz: {
          question: "Which note is most useful?",
          options: [
            [
              "sequence",
              "Two hours after the last walk, she stood slowly, hurried to the door, and leaked a small amount on the way.",
            ],
            ["blame", "She knew better and did it anyway."],
            ["restrict", "I removed water after dinner to test it."],
          ],
          answer: "sequence",
          correct:
            "Correct. The sequence, timing, and movement context are useful and blame-free.",
          retry:
            "Choose the detailed, neutral observation that does not restrict water.",
        },
      },
      {
        title: "Make the route easier",
        result:
          "You will reduce distance and slipping while the cause is evaluated.",
        copy: "Offer more frequent access and make the familiar route safer without changing every cue.",
        steps: [
          "Add traction, lighting, and a shorter route when possible.",
          "Offer calm, more frequent opportunities at predictable times.",
          "Use washable protection while preserving dignity and normal access.",
        ],
        quiz: {
          question: "What is a safe immediate support?",
          options: [
            ["access", "Offer a shorter, well-lit, non-slip route more often."],
            ["punish", "Scold the dog so the accident is memorable."],
            ["water", "Remove water for the evening."],
          ],
          answer: "access",
          correct:
            "Yes. Easier access supports comfort without punishment or water restriction.",
          retry:
            "Choose the option that improves access and preserves dignity.",
        },
      },
      {
        title: "Know what needs faster care",
        result:
          "You will be ready to report urgency, output, pain, and paired changes.",
        copy: "Bathroom changes can involve mobility, infection, pain, medication, digestion, or other conditions. Let the veterinary team evaluate the cause.",
        steps: [
          "Report frequency, amount, color, straining, pain, thirst, vomiting, and energy.",
          "List medicines and conditions, plus any recent diet or schedule change.",
          "Inability to urinate, repeated straining, collapse, or severe pain is urgent.",
        ],
        quiz: {
          question: "Which sign should not wait for a tracker?",
          options: [
            ["urgent", "Repeatedly strains but cannot pass urine."],
            ["minor", "One accident after a delayed walk."],
            ["routine", "Needs one extra daytime trip."],
          ],
          answer: "urgent",
          correct:
            "Correct. Inability to urinate or repeated unproductive straining needs urgent care.",
          retry: "Choose the sign that can become an emergency.",
        },
      },
    ],
    urgent:
      "Inability to urinate, repeated unproductive straining, blood with weakness, collapse, severe pain, or a swollen painful abdomen needs urgent veterinary care.",
    community: {
      question:
        "How do I record accidents without making my dog feel punished?",
      excerpt:
        "Stay neutral, make access easier, and record timing, urgency, posture, amount, and paired signs.",
      helpful: 33,
      replies: [
        [
          "Rosa",
          "A washable runner and earlier break helped while we waited for the appointment.",
        ],
        [
          "Ken",
          "The route detail showed that standing up—not remembering the door—was the hard part.",
        ],
      ],
    },
  },
  {
    slug: "new-cough-or-breathing-change",
    topic: "Breathing",
    title: "A new cough or breathing change",
    eyebrow: "Breathing · 3 chapters + quizzes",
    intro:
      "Separate an occasional sound from a repeated breathing pattern and know which signs should not wait.",
    image: "real-home-owner-dog.jpg",
    imageAlt: "Dog resting near a caregiver who is observing breathing comfort",
    conditionLabel: "Which change is closest?",
    conditionOptions: [
      "New cough",
      "Faster breathing at rest",
      "Noisier or harder breathing",
      "Blue gums, collapse, or severe distress",
    ],
    impactOptions: [
      "Happened once",
      "Repeats some days",
      "Happens daily",
      "Breathing looks difficult now",
    ],
    chapters: [
      {
        title: "Record one natural breathing moment",
        result:
          "You will capture timing, sound, posture, and recovery without provoking another episode.",
        copy: "Observe your dog at rest. Note what happened immediately before the change, how long it lasted, and how your dog recovered.",
        steps: [
          "Record whether your dog was asleep, resting, eating, drinking, or active.",
          "Note cough sound, breathing effort, posture, gum color, and time to settle.",
          "Never exercise or excite your dog to recreate a breathing change.",
        ],
        quiz: {
          question: "Which record is most useful?",
          options: [
            [
              "specific",
              "While asleep, he coughed three times, sat upright, and settled again after 40 seconds.",
            ],
            ["vague", "His breathing was weird."],
            ["test", "I made him run to see if it happened again."],
          ],
          answer: "specific",
          correct:
            "Correct. Context, duration, posture, and recovery make the observation useful.",
          retry:
            "Choose the natural observation with timing and no forced test.",
        },
      },
      {
        title: "Count resting breaths safely",
        result:
          "You will have one calm resting count to share with the care team.",
        copy: "When your dog is fully asleep or quietly resting, count chest rises without touching or waking them.",
        steps: [
          "Count one rise and fall as one breath for 30 seconds, then double it.",
          "Repeat only at another naturally calm time if your veterinarian asks.",
          "Stop counting and seek help if breathing looks difficult, gums change color, or your dog cannot settle.",
        ],
        quiz: {
          question: "When should you count?",
          options: [
            ["rest", "During natural sleep or quiet rest."],
            ["walk", "Immediately after a brisk walk."],
            ["stress", "While the dog is panting at the clinic."],
          ],
          answer: "rest",
          correct:
            "Yes. A natural resting count provides the clearest context.",
          retry: "Choose the calm, unforced moment.",
        },
      },
      {
        title: "Make the veterinary call specific",
        result:
          "You will know what to report first and what needs emergency care.",
        copy: "Lead with onset, frequency, effort, gum color, recovery, and any paired appetite, energy, heart, or medicine change.",
        steps: [
          "Bring one short natural video if it can be taken safely.",
          "List heart, airway, allergy, pain, and current medicine history.",
          "Trouble breathing, blue or gray gums, collapse, or severe distress needs immediate care.",
        ],
        quiz: {
          question: "Which sign needs emergency help?",
          options: [
            ["emergency", "Blue-gray gums with labored breathing."],
            ["record", "One cough after drinking that did not repeat."],
            ["routine", "A quiet sigh before sleep."],
          ],
          answer: "emergency",
          correct:
            "Correct. Color change and labored breathing should not wait.",
          retry: "Choose the sign showing oxygen or breathing distress.",
        },
      },
    ],
    urgent:
      "Labored breathing, blue or gray gums, collapse, inability to settle, severe weakness, or choking needs immediate veterinary care.",
    community: {
      question:
        "My dog has started coughing while resting. What details should I capture?",
      excerpt:
        "Record the natural moment, sound, breathing effort, posture, gum color, duration, and recovery—without recreating it.",
      helpful: 31,
      replies: [
        [
          "Mina",
          "The sleeping video and exact duration helped us explain it clearly.",
        ],
        ["Rob", "Writing down medicine timing made the pattern easier to see."],
      ],
    },
  },
  {
    slug: "unexpected-weight-change",
    topic: "Weight",
    title: "An unexpected weight change",
    eyebrow: "Weight · 3 chapters + quizzes",
    intro:
      "Confirm the trend, connect it to appetite and daily function, and prepare a clearer veterinary conversation.",
    image: "problem-appetite-owner-and-dogs.jpg",
    imageAlt: "Dog owner observing two dogs while reviewing a change in body condition",
    conditionLabel: "Which change is closest?",
    conditionOptions: [
      "Clothes or harness fit changed",
      "Ribs or spine feel different",
      "Home scale trend changed",
      "Rapid loss with weakness or illness",
    ],
    impactOptions: [
      "Not sure yet",
      "Small repeated change",
      "Clear change this month",
      "Rapid or severe change",
    ],
    chapters: [
      {
        title: "Confirm a real trend",
        result:
          "You will distinguish one uncertain reading from a repeated change.",
        copy: "Use the same scale, time of day, and setup when possible. Pair weight with body shape and normal routines.",
        steps: [
          "Record the date, scale, surface, time, and whether your dog ate recently.",
          "Note ribs, spine, waist, harness fit, and muscle over the hips and shoulders.",
          "Do not restrict food or water to produce a cleaner number.",
        ],
        quiz: {
          question: "Which comparison is strongest?",
          options: [
            ["repeat", "Three weekly readings on the same scale and setup."],
            ["single", "One reading on an unfamiliar scale."],
            ["restrict", "A reading after withholding water."],
          ],
          answer: "repeat",
          correct: "Correct. Repeated, comparable measurements reveal a trend.",
          retry: "Choose the repeated comparison without restricting care.",
        },
      },
      {
        title: "Connect weight to daily systems",
        result: "You will know which paired changes belong in the same record.",
        copy: "Weight rarely tells the whole story. Add appetite, chewing, water, urine, stool, vomiting, medicines, movement, and energy.",
        steps: [
          "Measure what was offered and eaten for several ordinary meals.",
          "Record thirst, bathroom changes, nausea clues, and activity.",
          "List new medicines, dose changes, and known conditions beside the timeline.",
        ],
        quiz: {
          question: "What belongs beside the weight trend?",
          options: [
            [
              "whole",
              "Appetite, water, bathroom, medicines, movement, and energy.",
            ],
            ["number", "Only the scale number."],
            ["guess", "A guessed diagnosis."],
          ],
          answer: "whole",
          correct: "Yes. Paired systems give the number meaningful context.",
          retry:
            "Choose the answer that connects weight to the whole daily pattern.",
        },
      },
      {
        title: "Know when the change should not wait",
        result:
          "You will have a concise call summary and recognize urgent paired signs.",
        copy: "Share the amount and speed of change, the measurement method, and what else changed at the same time.",
        steps: [
          "State the earliest reliable weight and the newest comparable weight.",
          "Describe appetite, vomiting, diarrhea, breathing, weakness, thirst, and urine changes.",
          "Rapid loss with collapse, repeated vomiting, a swollen abdomen, or severe weakness needs prompt care.",
        ],
        quiz: {
          question: "Which summary is most useful?",
          options: [
            [
              "timeline",
              "On the same scale, she lost 1.8 kg in four weeks and now leaves half her meals.",
            ],
            ["label", "She is getting skinny."],
            ["normal", "Old dogs lose weight, so I waited."],
          ],
          answer: "timeline",
          correct:
            "Correct. Amount, time, method, and paired function make the change clear.",
          retry:
            "Choose the summary with a comparable trend and paired change.",
        },
      },
    ],
    urgent:
      "Rapid weight loss with collapse, severe weakness, repeated vomiting, breathing difficulty, a swollen painful abdomen, or inability to eat or drink needs prompt veterinary help.",
    community: {
      question:
        "My dog's harness feels loose. Is their weight changing?",
      excerpt:
        "Repeat comparable measurements and pair the trend with appetite, water, bathroom, medicines, movement, and energy.",
      helpful: 27,
      replies: [
        ["Ari", "Using the same clinic scale showed the change was real."],
        [
          "Leah",
          "Adding appetite and medicine changes made the call much clearer.",
        ],
      ],
    },
  },
  {
    slug: "after-a-medicine-change",
    topic: "Medicines",
    title: "A change after a new medicine",
    eyebrow: "Medicines · 3 chapters + quizzes",
    intro:
      "Build a dose-and-symptom timeline, protect the prescribed plan, and know when to call the care team sooner.",
    image: "real-senior-care-at-home.jpg",
    imageAlt: "Senior dog resting at home while a caregiver reviews daily care",
    conditionLabel: "What changed after the medicine?",
    conditionOptions: [
      "Sleep or energy",
      "Eating, drinking, or bathroom",
      "Movement or comfort",
      "Collapse, breathing trouble, or severe reaction",
    ],
    impactOptions: [
      "Mild and brief",
      "Repeats after doses",
      "Affects daily life",
      "Severe or urgent now",
    ],
    chapters: [
      {
        title: "Build the dose-and-change timeline",
        result:
          "You will show exactly when the new pattern began relative to each dose.",
        copy: "Record medicine name, amount, scheduled time, actual time, food, and the change that followed.",
        steps: [
          "Copy the label instructions exactly into the record.",
          "Note missed, late, vomited, or uncertain doses without correcting them yourself.",
          "Add eating, drinking, urine, stool, sleep, movement, and behavior changes.",
        ],
        quiz: {
          question: "What makes the timeline useful?",
          options: [
            [
              "timing",
              "Exact dose time beside the start and end of the change.",
            ],
            ["memory", "I think it happened sometime after a pill."],
            ["adjust", "I doubled the next dose to make up for it."],
          ],
          answer: "timing",
          correct:
            "Correct. Exact dose and symptom timing supports safer advice.",
          retry: "Choose precise timing without changing the prescription.",
        },
      },
      {
        title: "Protect the prescribed plan",
        result:
          "You will know what to do while waiting for the prescribing team.",
        copy: "Do not stop, double, split, or substitute a prescription unless the veterinary team instructs you to do so.",
        steps: [
          "Call the prescribing clinic or its after-hours route with the timeline.",
          "Keep packaging, concentration, and all other medicines available for the call.",
          "Prevent access to dropped pills and never add human medicine.",
        ],
        quiz: {
          question: "What is the safest next step?",
          options: [
            ["call", "Call the prescribing team with the exact timeline."],
            ["double", "Double the next dose after a missed one."],
            ["human", "Add a human medicine for comfort."],
          ],
          answer: "call",
          correct:
            "Yes. The prescribing team should guide any medication change.",
          retry:
            "Choose the option that preserves the prescription and gets professional advice.",
        },
      },
      {
        title: "Recognize a possible severe reaction",
        result:
          "You will know which signs need emergency help rather than a routine callback.",
        copy: "Severe breathing, swelling, collapse, seizures, repeated vomiting, profound weakness, or suspected overdose should not wait.",
        steps: [
          "Bring or photograph the label and note the possible amount involved.",
          "Call emergency veterinary care or poison guidance as directed locally.",
          "Do not induce vomiting unless a professional specifically instructs you.",
        ],
        quiz: {
          question: "Which situation needs urgent help?",
          options: [
            ["urgent", "Facial swelling and difficult breathing after a dose."],
            ["routine", "A brief nap at the usual time."],
            [
              "guess",
              "The tablet looked a different color under kitchen light.",
            ],
          ],
          answer: "urgent",
          correct:
            "Correct. Swelling with breathing difficulty is an emergency.",
          retry: "Choose the severe whole-body or breathing reaction.",
        },
      },
    ],
    urgent:
      "Trouble breathing, facial swelling, collapse, seizure, repeated vomiting, profound weakness, suspected overdose, or a severe sudden reaction needs immediate veterinary care.",
    community: {
      question:
        "My dog changed after new medicine. What should I record?",
      excerpt:
        "Put the exact dose time beside the new symptom, meals, water, bathroom changes, sleep, movement, and recovery.",
      helpful: 36,
      replies: [
        ["Jo", "The dose timeline made the after-hours call much faster."],
        ["Casey", "I had the bottle and concentration ready, which helped."],
      ],
    },
  },
  {
    slug: "new-lump-or-skin-change",
    topic: "Skin",
    title: "A new lump or skin change",
    eyebrow: "Skin · 3 practical chapters",
    intro:
      "Map what changed, protect irritated skin, and bring a measurable record to the veterinary visit.",
    image: "real-companion-moment.jpg",
    imageAlt: "Older dog resting at home while a skin change is monitored",
    conditionLabel: "Which change is closest?",
    conditionOptions: ["New lump", "Existing lump changed", "Sore or irritated skin", "Bleeding, painful, or rapidly growing area"],
    impactOptions: ["Not affecting daily life", "Licking or scratching", "Painful or limiting movement", "Rapid or severe change"],
    chapters: [
      {
        title: "Create a useful skin map",
        result: "You will know the exact place, size, surface, and first reliable date.",
        copy: "A photo beside a ruler and a simple body map are more useful than memory alone.",
        steps: ["Photograph the area in the same light with a ruler beside it.", "Record location, length, width, texture, color, warmth, and whether it moves under the skin.", "Note licking, scratching, limping, appetite, energy, and any other new lumps."],
        quiz: { question: "Which record is easiest to compare?", options: [["measure", "A dated photo with a ruler, body location, and written measurement."], ["memory", "I think it looks bigger than last month."], ["squeeze", "I squeezed it to see what came out."]], answer: "measure", correct: "Correct. A dated measurement makes change visible.", retry: "Choose the option that records the area without irritating it." },
      },
      {
        title: "Protect the area today",
        result: "You will reduce rubbing and licking without hiding the change.",
        copy: "Keep the surface clean and dry, and stop repeated trauma while you arrange advice.",
        steps: ["Prevent licking or chewing with a well-fitted barrier recommended for your dog.", "Keep collars, harnesses, bedding, and rough surfaces from rubbing the area.", "Do not cut, squeeze, drain, or apply human creams unless a veterinarian directs you."],
        quiz: { question: "What is the safest home step?", options: [["protect", "Prevent licking and keep the area clean and dry."], ["drain", "Puncture the lump so it can drain."], ["cream", "Apply a human pain cream."]], answer: "protect", correct: "Yes. Protection preserves the area for assessment.", retry: "Choose the low-risk step that avoids squeezing or medication." },
      },
      {
        title: "Prepare the skin-change appointment",
        result: "You will give the care team a concise change timeline and recognize signs that should not wait.",
        copy: "Bring the first photo, newest measurement, growth speed, medicines, and every whole-body change.",
        steps: ["State when it first appeared and how quickly it changed.", "Bring the photo series and list of medicines, flea products, and recent procedures.", "Seek prompt care for rapid growth, persistent bleeding, severe pain, dark tissue, fever, weakness, or trouble breathing."],
        quiz: { question: "Which change deserves a faster call?", options: [["rapid", "The area doubled quickly and now bleeds."], ["stable", "A tiny mark looks unchanged in two dated photos."], ["unknown", "The coat color looks different in sunlight."]], answer: "rapid", correct: "Correct. Rapid growth with bleeding should be assessed promptly.", retry: "Choose the rapidly changing or painful finding." },
      },
    ],
    urgent: "Rapid growth, persistent bleeding, severe pain, facial swelling, dark or dying tissue, fever, collapse, or breathing difficulty needs prompt veterinary help.",
    community: { question: "I found a new lump. What should I record?", excerpt: "Use a dated photo, ruler, exact body location, texture, growth speed, and whole-body changes.", helpful: 0, replies: [] },
  },
  {
    slug: "vision-or-hearing-change",
    topic: "Senses",
    title: "A change in vision or hearing",
    eyebrow: "Senses · 3 practical chapters",
    intro:
      "Separate a gradual sensory change from sudden confusion, make familiar routes safer, and document what still works.",
    image: "real-comfort-hug.jpg",
    imageAlt: "Older dog resting in a familiar home environment",
    conditionLabel: "What are you noticing?",
    conditionOptions: ["Startles when approached", "Misses cues or sounds", "Bumps into things", "Sudden disorientation or eye pain"],
    impactOptions: ["Occasional", "Daily but manageable", "Limits normal routines", "Sudden or severe"],
    chapters: [
      {
        title: "Test ordinary moments safely",
        result: "You will identify whether the pattern involves sound, sight, attention, movement, or several systems together.",
        copy: "Observe familiar cues without frightening your dog or forcing a response.",
        steps: ["Record response to their name, a familiar hand signal, food preparation, and a normal doorway.", "Note lighting, distance, which side you approached, and whether your dog was awake.", "Film one natural example and record head tilt, circling, eye redness, cloudiness, or imbalance."],
        quiz: { question: "Which observation is most useful?", options: [["context", "In daylight she follows a hand cue, but at dusk she misses the last stair."], ["frighten", "I clapped behind her repeatedly until she jumped."], ["label", "She is just getting old."]], answer: "context", correct: "Correct. Context shows what still works and when difficulty appears.", retry: "Choose the calm, repeatable observation with lighting and function." },
      },
      {
        title: "Make familiar routes predictable",
        result: "You will reduce surprises without removing independence.",
        copy: "Consistency, traction, lighting, and a gentle approach can protect confidence.",
        steps: ["Keep furniture, bowls, beds, and bathroom routes in consistent places.", "Add even lighting and traction at stairs, thresholds, and dark hallways.", "Approach where your dog can see or smell you, then use a gentle touch cue before handling."],
        quiz: { question: "Which change supports confidence?", options: [["predictable", "Keep routes consistent and add lighting and traction."], ["move", "Move all furniture to test adaptation."], ["startle", "Wake the dog with a sudden touch."]], answer: "predictable", correct: "Yes. Predictability lowers surprise and preserves familiar choices.", retry: "Choose the stable, well-lit environment." },
      },
      {
        title: "Know when a sensory change is urgent",
        result: "You will distinguish a gradual adjustment from pain or sudden neurologic change.",
        copy: "Sudden blindness, a painful red eye, collapse, severe imbalance, seizures, or acute confusion should not wait.",
        steps: ["Record whether onset was sudden or gradual and whether one side seems different.", "Share eye appearance, balance, appetite, medicines, sleep, and recent injury or illness.", "Protect your dog from stairs and hazards while seeking prompt veterinary advice for sudden changes."],
        quiz: { question: "Which situation needs prompt care?", options: [["sudden", "Sudden bumping into walls with a red painful eye."], ["gradual", "A gradual need for brighter hallway lighting."], ["routine", "Sleeping through a quiet conversation."]], answer: "sudden", correct: "Correct. Sudden vision loss with eye pain needs prompt assessment.", retry: "Choose the sudden, painful, or neurologic change." },
      },
    ],
    urgent: "Sudden blindness, a painful red or enlarged eye, collapse, seizure, severe imbalance, head tilt with distress, or acute confusion needs prompt veterinary care.",
    community: { question: "Is my dog losing hearing or vision?", excerpt: "Compare calm, familiar cues in consistent light and record side, distance, alertness, balance, and eye changes.", helpful: 0, replies: [] },
  },
  {
    slug: "mouth-or-dental-pain",
    topic: "Mouth",
    title: "Possible mouth or dental pain",
    eyebrow: "Mouth · 3 practical chapters",
    intro:
      "Spot eating mechanics that suggest oral discomfort, protect nutrition, and prepare a safer dental conversation.",
    image: "problem-appetite-owner-offering-food.jpg",
    imageAlt: "Dog owner gently observing a dog during a quiet home moment",
    conditionLabel: "What changed first?",
    conditionOptions: ["Drops food", "Chews on one side", "Bad breath or drooling", "Facial swelling or cannot eat"],
    impactOptions: ["Still finishes meals", "Eats more slowly", "Leaves food or avoids chewing", "Cannot eat, drink, or settle"],
    chapters: [
      {
        title: "Watch how the meal changes",
        result: "You will capture chewing mechanics rather than only the amount eaten.",
        copy: "The way food is picked up, chewed, dropped, and swallowed can reveal a useful pattern.",
        steps: ["Film the first minute of an ordinary meal without opening the mouth by force.", "Record side preference, dropped food, pawing, drooling, odor, swallowing, and time to finish.", "Measure food and water offered and consumed, plus any weight change."],
        quiz: { question: "Which detail best describes mouth function?", options: [["mechanics", "She picks up kibble, drops it, and chews only on the left."], ["amount", "She ate less."], ["force", "I forced her mouth open to look."]], answer: "mechanics", correct: "Correct. Specific eating mechanics help localize the problem.", retry: "Choose the specific, naturally observed chewing behavior." },
      },
      {
        title: "Protect food and comfort",
        result: "You will support intake without giving unsafe medication or masking a worsening problem.",
        copy: "Ask the veterinary team about an appropriate temporary texture and keep a close intake record.",
        steps: ["Offer the normal diet in the safest texture your veterinary team recommends.", "Keep water easy to reach and record actual intake and vomiting.", "Avoid hard chews, mouth handling, human pain medicine, and leftover antibiotics."],
        quiz: { question: "What is the safest next step?", options: [["call", "Call the veterinary team about food texture and pain assessment."], ["human", "Give human pain medicine."], ["hard", "Offer a hard chew to clean the teeth."]], answer: "call", correct: "Yes. Oral pain and diet changes deserve professional guidance.", retry: "Choose the step that gets safe diet and pain advice." },
      },
      {
        title: "Recognize signs that should not wait",
        result: "You will know when reduced eating has become an urgent pain, airway, or hydration problem.",
        copy: "Facial swelling, uncontrolled bleeding, trauma, inability to swallow, breathing trouble, or complete refusal of food and water needs faster help.",
        steps: ["Photograph visible facial swelling without pressing it.", "Bring the meal video, intake totals, medicines, and timing of the first change.", "Seek urgent care for breathing trouble, inability to swallow, major trauma, severe bleeding, or collapse."],
        quiz: { question: "Which sign should not wait?", options: [["airway", "Facial swelling with difficulty swallowing or breathing."], ["slow", "Taking a little longer to finish one meal."], ["odor", "Mild odor noticed during brushing."]], answer: "airway", correct: "Correct. Swelling that affects swallowing or breathing is urgent.", retry: "Choose the airway, severe bleeding, or collapse sign." },
      },
    ],
    urgent: "Facial swelling, breathing or swallowing difficulty, uncontrolled oral bleeding, major trauma, collapse, severe pain, or inability to eat or drink needs prompt veterinary care.",
    community: { question: "My dog drops kibble and chews on one side. What details will help the vet?", excerpt: "Record the first minute of eating, side preference, dropped food, drooling, odor, meal duration, intake, and weight trend.", helpful: 0, replies: [] },
  },
];

const routeLabels = {
  "/": "Home",
  "/smart-bed/": "The Smart Bed",
  "/smart-base/": "Smart Base",
  "/care-path/": "Care Path",
  "/guide/": "Free Guide",
  "/learn/": "Care Library",
  "/care-circle/": "Care Circle",
  "/find-care/": "Find Care",
  "/pet-loss-support/": "Pet Loss Support",
  "/memorial-tree/": "Memorial Tree",
  "/wednesday-introductions/": "Wednesday Introductions",
  "/about/": "About",
  "/support/": "Support",
  "/privacy/": "Privacy",
  "/terms/": "Terms",
  "/accessibility/": "Accessibility",
  "/account/": "Account",
  "/health-timeline/": "Health Timeline",
};

function legacyHeader() {
  return `<header class="site-header" data-header>
    <a class="wordmark" href="/" aria-label="WoafyPet home">Woafy<span>Pet</span></a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-navigation" data-menu-toggle><span></span><span></span><span></span><span class="sr-only">Open navigation</span></button>
    <nav class="site-nav" id="site-navigation" aria-label="Primary navigation" data-site-nav>
      <a href="/#senior-pet-problems">Senior Pet Problems</a>
      <a href="/care-circle/">Care Circle</a>
      <a class="nav-cta" href="/guide/">Care Guide</a>
      <a href="/smart-bed/">WoafyPet Bed</a>
      <a href="/#meet-someone">Meet Someone</a>
    </nav>
  </header>`;
}

function legacyFooter() {
  return `<footer class="site-footer">
    <div class="footer-top">
      <div class="footer-brand"><a class="wordmark light" href="/">Woafy<span>Pet</span></a><p>Clearer guidance, thoughtful connection, and better rest for dogs—and the people who love them.</p></div>
      <div><h2>Learn</h2><a href="/care-circle/">Public Care Circle</a><a href="/learn/">Care lessons</a><a href="/guide/">Senior Dog Guide</a><a href="/find-care/">Find Care</a></div>
      <div><h2>Support</h2><a href="/wednesday-introductions/">1:1 Owner Match</a><a href="/pet-loss-support/">Pet loss support</a><a href="/memorial-tree/">Memorial tree</a><a href="/support/">Contact us</a></div>
      <div><h2>WoafyPet Bed</h2><a href="/smart-bed/">Explore the Bed</a><a href="/smart-base/">Smart Base</a><a href="/smart-bed/">How it helps</a><a href="/about/">Our story</a></div>
    </div>
    <div class="footer-bottom"><span>© 2026 WoafyPet.</span><nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/accessibility/">Accessibility</a></nav></div>
  </footer>`;
}

function legacyPage({ route, title, description, body, bodyClass = "" }) {
  const canonical = `${PUBLIC_ORIGIN}${route}`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="theme-color" content="#fbf7ef">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/styles.css?v=${ASSET_VERSION}">
  <title>${escapeHtml(title)} · WoafyPet</title>
</head>
<body class="${escapeHtml(bodyClass)}">
  <a class="skip-link" href="#main-content">Skip to content</a>
  ${header()}
  <main id="main-content">${body}</main>
  ${footer()}
  <script src="/app.js?v=${ASSET_VERSION}" defer></script>
</body>
</html>`;
}

function lessonCards(limit = lessons.length) {
  return `<div class="lesson-grid">${lessons
    .slice(0, limit)
    .map(
      (lesson, index) => `<article class="lesson-card">
    <a class="card-image" href="/learn/${lesson.slug}/">${image(lesson.image, lesson.imageAlt)}</a>
    <div class="card-copy"><span class="card-index">0${index + 1}</span><span class="lesson-topic">${escapeHtml(lesson.topic)}</span><h3><a href="/learn/${lesson.slug}/">${escapeHtml(lesson.title)}</a></h3><p>${escapeHtml(lesson.intro)}</p><div class="lesson-card-meta"><span>${icon("heart")}Helpful ${lesson.community.helpful}</span><span>${icon("people")}Replies ${lesson.community.replies.length}</span></div><a class="text-link" href="/learn/${lesson.slug}/">Start the lesson <span aria-hidden="true">→</span></a></div>
  </article>`,
    )
    .join("")}</div>`;
}

function legacyHomePageV3() {
  return page({
    route: "/",
    title: "Help your aging dog live better",
    description:
      "WoafyPet helps senior-dog families understand common changes, learn practical next steps, find care, and meet someone navigating the same issue.",
    bodyClass: "home-page",
    body: `<section class="care-home-hero" id="ask-care-circle">
      <div class="care-hero-copy"><h1>Help your aging dog live better—and know what to do next.</h1><p class="lead">Ask about the change you are seeing. Get clear guidance on what to watch, what you can do today, and when to call your veterinarian.</p>
        <form class="care-question-panel care-question-form" data-care-question-form method="get" action="/care-path/" aria-label="Ask WoafyPet a senior-dog care question"><div class="care-question-control"><span class="care-question-icon">${icon("notice")}</span><input id="care-question" name="q" type="search" required maxlength="300" aria-label="What changed with your dog?" placeholder="What changed with your dog?"><button type="submit" aria-label="Find my lesson"><span aria-hidden="true">→</span><span class="sr-only">Find my lesson</span></button></div><div class="question-examples" aria-label="Example questions"><strong>Examples:</strong><span>Trouble getting up</span><span>Restless at night</span><span>Eating less</span></div></form>
      </div>
      <figure class="care-hero-media">${image("real-home-owner-dog.jpg", "Caregiver spending a quiet moment at home with a dog", { eager: true })}</figure>
    </section>

    <section class="vet-answer-strip" aria-label="Veterinary-guided senior-dog answers"><div>${icon("care")}<strong>Veterinary-guided answers for aging dogs.</strong></div><p>Understand the change, take a safer first step, and prepare the right question for your veterinarian.</p><a href="/care-circle/">Browse public answers <span aria-hidden="true">→</span></a></section>

    <section class="section problem-section" id="senior-pet-problems"><div class="wrap">${sectionHeading("", "What’s getting harder for your senior dog?", "Common changes can help you understand what to notice, what to do, and when to call.", "center")}<div class="problem-grid">
      <article class="problem-card"><figure>${image("problem-mobility-senior-lab.jpg", "Senior yellow Labrador resting at home")}</figure><div><h3>Stiffness or trouble moving</h3><p>Time one natural first rise, make the usual route safer today, and prepare a vet-ready mobility note.</p><a class="text-link" href="/learn/slower-after-rest/">Start the mobility lesson →</a></div></article>
      <article class="problem-card"><figure>${image("problem-restless-night-senior-black-lab.jpg", "Older black Labrador with a gray muzzle resting on a bed")}</figure><div><h3>Restless nights</h3><p>Map the wake-up sequence, make tonight easier, and know which signs need a faster call.</p><a class="text-link" href="/learn/restless-at-night/">Start the nighttime lesson →</a></div></article>
      <article class="problem-card"><figure>${image("problem-appetite-owner-and-dogs.jpg", "Caregiver offering food while two different dogs wait nearby")}</figure><div><h3>Eating less or picky</h3><p>Measure what was offered and eaten, spot chewing or nausea clues, and prepare the right appetite call.</p><a class="text-link" href="/learn/changes-in-appetite/">Start the eating lesson →</a></div></article>
      <article class="problem-card"><figure>${image("problem-daily-routine-senior-dark-dog.jpg", "Senior dark dog with a gray muzzle resting outdoors")}</figure><div><h3>Less interest in life</h3><p>Name the missing routine, offer a lower-effort way to join, and record the whole pattern.</p><a class="text-link" href="/learn/less-interest-in-life/">Start the daily-life lesson →</a></div></article>
    </div></div></section>

    <section class="section guide-overview" id="senior-dog-guide"><div class="wrap">${sectionHeading("", "The Complete Senior Dog Care Guide", "See what changed, make today safer, and prepare the right veterinary questions.", "center")}<div class="guide-roadmap" aria-label="What the Senior Dog Care Guide covers">
      <article class="guide-step"><div><h3>1. Recognize the issue</h3><p>Name the first sign, when it began, and which daily routine is now harder.</p></div><figure>${image("guide-recognize-older-golden.jpg", "Older golden retriever receiving a gentle check-in")}</figure></article>
      <article class="guide-step"><div><h3>2. Know what to record</h3><p>Capture timing, frequency, and what happens before and after the change.</p></div><figure>${image("guide-observe-beagle-owner.jpg", "Beagle with a caregiver observing the daily routine")}</figure></article>
      <article class="guide-step"><div><h3>3. Make today easier</h3><p>Reduce slipping, effort, and nighttime friction without forcing a test.</p></div><figure>${image("guide-action-brown-dog-resting.jpg", "Brown dog resting comfortably at home")}</figure></article>
      <article class="guide-step"><div><h3>4. Compare real options</h3><p>Understand veterinary, rehabilitation, home-support, and comfort-care paths.</p></div><figure>${image("guide-solutions-white-brown-dog.jpg", "White and brown senior dog outdoors with a caregiver")}</figure></article>
      <article class="guide-step"><div><h3>5. Know when to call</h3><p>Recognize red flags and bring the exact details your care team needs.</p></div><figure>${image("guide-vet-care-brown-dog.jpg", "Brown dog receiving veterinary care")}</figure></article>
    </div><div class="section-end-action">${button("Get Free Complete Guide Now", "/guide/")}</div></div></section>

    <section class="section bed-comfort-story" id="woafypet-bed"><div class="wrap bed-comfort-grid"><div class="bed-comfort-copy">${sectionHeading("PREMIUM ORTHOPEDIC COMFORT", "Deeper rest. Easier mornings.", "A supportive sleep space made for older dogs who need more comfort and less effort.")}<div class="bed-comfort-points"><article>${icon("rest")}<div><strong>Low step-in</strong><span>Easier to enter and exit.</span></div></article><article>${icon("guide")}<div><strong>Supportive layers</strong><span>Steady comfort from edge to center.</span></div></article><article>${icon("heart")}<div><strong>Washable cover</strong><span>Simple to remove and refresh.</span></div></article></div>${button("Explore the WoafyPet Bed", "/smart-bed/")}</div><figure class="bed-comfort-media">${image("product-prototype-golden.webp", "Golden retriever sleeping in the WoafyPet orthopedic bed")}</figure></div></section>

    <section class="section bed-tracking-story"><div class="wrap bed-tracking-grid"><div class="bed-tracking-intro">${sectionHeading("SMART TRACKING", "See the changes rest can reveal.", "Smart Base quietly follows the patterns that are easy to miss—without a collar or camera.")}<figure class="bed-tracking-visual">${image("bed-layers.png", "Exploded visualization of the WoafyPet bed and Smart Base layers")}</figure></div><div class="tracking-metrics" aria-label="WoafyPet Smart Base tracking metrics"><article>${icon("rest")}<div><strong>Rest duration</strong><span>See when nights become shorter or less consistent.</span></div></article><article>${icon("notice")}<div><strong>Restlessness</strong><span>Notice when sleep includes more movement and interruptions.</span></div></article><article>${icon("heart")}<div><strong>Bed visits</strong><span>Know when your dog uses their familiar sleep space less often.</span></div></article><article>${icon("care")}<div><strong>Weight trend</strong><span>Bring gradual changes into a clearer care conversation.</span></div></article><p>Designed for awareness and better conversations with your veterinarian—not diagnosis.</p></div></div></section>

    <section class="section match-feature" id="meet-someone"><div class="wrap match-feature-grid"><div class="match-feature-copy">${sectionHeading("OFFLINE 1:1 OWNER MATCHING", "You’re not alone. Find someone who understands.", "A private Wednesday introduction to one nearby owner living through the same senior-dog issue. Contact is shared only after both people say yes.")}<div class="match-points"><span>${icon("notice")}Same issue</span><span>${icon("heart")}Private offer</span><span>${icon("people")}Both say yes</span></div>${button("Find someone like me", "/wednesday-introductions/")}</div><figure>${image("community-owner-match.jpg", "Two dog owners meeting in a public outdoor place with their dog")}</figure></div></section>

    <section class="care-support-section">${sectionHeading("", "Get the right support for every chapter.", "", "center")}<div class="care-support-grid"><a class="care-support-card" href="/find-care/"><figure>${image("real-senior-care-at-home.jpg", "Senior dog resting at home while a family considers the right care")}</figure><div>${icon("care")}<span><strong>Find Care</strong><p>Search veterinarians, mobility support, hospice, and aftercare resources.</p><b>Find the right care →</b></span></div></a><a class="care-support-card" href="/pet-loss-support/"><figure>${image("real-pet-loss-support.jpg", "Caregiver sharing a close moment with a beloved dog")}</figure><div>${icon("heart")}<span><strong>Pet Loss Support</strong><p>Follow a clear path before goodbye and through the first 72 hours.</p><b>Get support →</b></span></div></a><a class="care-support-card" href="/memorial-tree/"><figure>${image("real-memorial-tree-planting.jpg", "Hands planting a young memorial tree")}</figure><div>${icon("tree")}<span><strong>Memorial Tree</strong><p>Create a living tribute with the planting details shown clearly.</p><b>Create a memorial →</b></span></div></a></div></section><section class="journey-cta"><div>${icon("heart")}<span><strong>We’re here for every step of your journey.</strong><span>Clear guidance. Real support. Better days together.</span></span></div></section>`,
  });
}

function homePage() {
  const problemCards = [
    [
      "problem-restless-night-senior-black-lab.jpg",
      "Senior yellow Labrador resting at home",
      "Stiffness or trouble moving",
      "Measure one natural rise, make the usual route safer, and prepare a useful mobility note.",
      "/learn/slower-after-rest/",
    ],
    [
      "problem-restless-night-dog-sleeping.jpg",
      "Dog sleeping peacefully on a bed at home",
      "Restless nights",
      "Map the wake-up sequence, make tonight easier, and know which signs need a faster call.",
      "/learn/restless-at-night/",
    ],
    [
      "problem-appetite-owner-offering-food.jpg",
      "Caregiver offering food to a dog at home",
      "Eating less or picky",
      "Measure what is eaten, spot chewing or nausea clues, and prepare the right appetite call.",
      "/learn/changes-in-appetite/",
    ],
    [
      "problem-daily-routine-senior-dark-dog.jpg",
      "Senior dark dog with a gray muzzle",
      "Less interest in life",
      "Name the missing routine, offer a lower-effort way to join, and record the whole pattern.",
      "/learn/less-interest-in-life/",
    ],
  ];
  return page({
    route: "/",
    title: "Help your dog live better",
    description:
      "WoafyPet helps families understand changes in their dogs, take useful next steps, find care, and build real support.",
    bodyClass: "home-page home-v5",
    body: `<section class="care-home-hero" id="ask-care-circle">
      <div class="care-hero-copy"><h1>Help your dog live better—and know what to do next.</h1><p class="lead">Tell us what changed. Get a practical lesson for what to notice, what to do today, and what to ask your veterinarian.</p>
        <form class="care-question-panel care-question-form" data-care-question-form method="get" action="/care-path/" aria-label="Ask WoafyPet a dog-care question"><div class="care-question-control"><span class="care-question-icon">${icon("notice")}</span><input id="care-question" name="q" type="search" required maxlength="300" aria-label="What changed with your dog?" placeholder="What changed with your dog?"><button type="submit" aria-label="Find my lesson"><span aria-hidden="true">→</span><span class="sr-only">Find my lesson</span></button></div><div class="question-examples"><strong>Try:</strong><span>Trouble getting up</span><span>Restless at night</span><span>Eating less</span></div></form>
      </div>
      <figure class="care-hero-media">${image("real-home-owner-dog.jpg", "Caregiver spending a quiet moment at home with a dog", { eager: true })}</figure>
    </section>

    <section class="vet-answer-strip"><div>${icon("care")}<strong>Veterinary-guided answers for the changes you notice.</strong></div><a href="/care-circle/">See real owner questions and answers →</a></section>

    <section class="problem-showcase" id="senior-pet-problems"><div class="problem-showcase-backdrop"><div class="problem-showcase-heading"><h2>What’s getting harder for your dog?</h2><p>Spot the pattern. Take the next useful step.</p></div><div class="problem-showcase-cards">${problemCards.map(([asset, alt, title, copy, href]) => `<article><figure>${image(asset, alt)}</figure><div><h3>${title}</h3><p>${copy}</p><a href="${href}">See the lesson →</a></div></article>`).join("")}</div></div></section>

    <section class="guide-showcase" id="senior-dog-guide"><div class="guide-showcase-media"><figure>${image("guide-observe-beagle-owner.jpg", "Caregiver reviewing a practical guide beside a dog")}</figure><div class="guide-sheet" aria-hidden="true"><strong>Your 7-day plan</strong><span>✓ Spot what changed</span><span>✓ Make today easier</span><span>✓ Know when to call</span></div></div><div class="guide-showcase-copy"><h2>The Complete Senior Dog Care Guide</h2><p>Understand the most common changes, what they can look like at home, what to record, which low-risk steps can help today, and when your veterinarian should hear from you.</p><div class="guide-benefits"><article>${icon("notice")}<div><h3>Clear answers</h3><p>Turn “something feels off” into a useful pattern.</p></div></article><article>${icon("act")}<div><h3>Practical next steps</h3><p>Make routines safer without guessing at a diagnosis.</p></div></article><article>${icon("care")}<div><h3>Better vet conversations</h3><p>Bring the details that help your care team act.</p></div></article></div>${button("Get Free Complete Guide Now", "/guide/")}</div></section>

    <section class="bed-v6-comfort" id="woafypet-bed"><div class="bed-v6-copy"><h2>WoafyPet Smart Bed: comfort they can feel every night.</h2><p>For the dog who pauses before lying down, shifts all night, or wakes up stiff.</p><div class="bed-v6-benefits"><article>${icon("rest")}<div><strong>Less effort getting in</strong><span>A low front opening keeps the familiar bed easier to reach.</span></div></article><article>${icon("heart")}<div><strong>Support from edge to center</strong><span>Orthopedic foam and a steady bolster support different resting positions.</span></div></article><article>${icon("guide")}<div><strong>Simple daily care</strong><span>A removable cover makes the sleep space easier to refresh.</span></div></article></div>${button("See the WoafyPet Smart Bed", "/smart-bed/")}</div><figure>${image("product-prototype-golden.webp", "Golden retriever sleeping in the real gray WoafyPet Smart Bed prototype")}</figure></section>

    <section class="bed-v6-insights"><figure>${image("bed-layers.png", "WoafyPet Smart Bed layers with the Smart Base beneath the comfort system")}</figure><div class="bed-v6-copy"><h2>Know when their rest begins to change.</h2><p>The Smart Base turns ordinary nights into four simple trends—without a collar or camera.</p><div class="tracking-result-grid"><article><strong>Rest duration</strong><span>Is total rest becoming shorter?</span></article><article><strong>Night movement</strong><span>Are interruptions becoming more frequent?</span></article><article><strong>Heart rate</strong><span>Is their resting heart rate shifting from normal?</span></article><article><strong>Weight trend</strong><span>Is gradual change worth discussing sooner?</span></article></div><div class="bed-v6-result">See the pattern. Save the timeline. Ask a better veterinary question.</div>${button("Explore the WoafyPet Smart Bed", "/smart-bed/")}</div></section>

    <section class="match-feature" id="meet-someone"><div class="wrap match-feature-grid"><div class="match-feature-copy"><h2>You’re not alone. Meet someone who gets it.</h2><p>Tell us what your dog is going through. We look for one nearby owner facing the same issue, then make an offline introduction when both people want it.</p><div class="match-points"><span>${icon("notice")}Same issue</span><span>${icon("heart")}Local fit</span><span>${icon("people")}Real conversation</span></div>${button("Find someone like me", "/wednesday-introductions/")}</div><figure>${image("community-owner-match.jpg", "Two dog owners connecting outdoors with a dog")}</figure></div></section>

    <section class="care-support-section"><h2>Get the right support for every chapter.</h2><div class="care-support-grid"><a class="care-support-card" href="/find-care/"><figure>${image("guide-vet-care-brown-dog.jpg", "Dog receiving attentive veterinary care")}</figure><div><strong>Find Care</strong><p>Explore real clinics, specialists, and support services.</p><b>Find care →</b></div></a><a class="care-support-card" href="/pet-loss-support/"><figure>${image("real-pet-loss-support.jpg", "Caregiver holding a beloved dog close")}</figure><div><strong>Pet Loss Support</strong><p>Know what to do before goodbye and in the first days after.</p><b>Get support →</b></div></a><a class="care-support-card" href="/memorial-tree/"><figure>${image("real-memorial-tree-planting.jpg", "Hands planting a young memorial tree")}</figure><div><strong>Memorial Tree</strong><p>Create a living tribute that keeps their story growing.</p><b>Create a memorial →</b></div></a></div></section>`,
  });
}

function smartBedPage() {
  return page({
    route: "/smart-bed/",
    title: "The WoafyPet Smart Bed",
    description:
      "Explore the WoafyPet supportive smart bed, its comfort-first design, Smart Base, care approach, and validation status.",
    bodyClass: "product-page",
    body: `
    <section class="hero inner-hero product-hero"><div class="hero-copy"><span class="status testing">FLAGSHIP SMART BED</span><h1>Supportive rest first.<br><em>Context underneath.</em></h1><p class="lead">Orthopedic support first. Smart insight quietly included. The Full Smart Bed brings a senior-friendly sleep surface and the Smart Base into one considered system—without asking your dog to wear another device.</p><div class="actions">${button("Request founder access", "/support/#founder-access")}</div><p class="quiet-note">Final dimensions, materials, performance, price, and availability are not yet published.</p></div><figure class="hero-media">${image("product-prototype-golden.webp", "Golden retriever sleeping in the current gray WoafyPet prototype bed", { eager: true })}<figcaption><span>Prototype shown</span><span>Current gray bed form · Final specifications remain in validation</span></figcaption></figure></section>
    <section class="benefit-strip three"><article>${icon("rest")}<div><strong>Comfort-first form</strong><span>Low entry, bolstered edge, steady sleep area.</span></div></article><article>${icon("notice")}<div><strong>Smart Base included</strong><span>Planned context around rest and bed use.</span></div></article><article>${icon("proof")}<div><strong>Claims stay gated</strong><span>Specifications publish after validation.</span></div></article></section>
    <section class="section"><div class="wrap"><div class="heading-row">${sectionHeading("THE COMPLETE SYSTEM", "One bed, designed as connected layers.", "The exploded view shows how the comfort system, orthopedic support, Smart Base and non-slip foundation work together.")}<span class="status testing">FIVE CONNECTED LAYERS</span></div><div class="layers-grid"><figure>${image("bed-layers.png", "Exploded WoafyPet bed layers and Smart Base")}</figure><ol class="number-list"><li><span>01</span><div><h3>Washable comfort cover</h3><p>A soft contact surface designed to be removable and easier to care for.</p></div></li><li><span>02</span><div><h3>Supportive foam system</h3><p>Construction is being refined for pressure distribution, edge use, and older-dog comfort.</p></div></li><li><span>03</span><div><h3>Protective inner layer</h3><p>Barrier construction and cleaning performance remain part of material testing.</p></div></li><li><span>04</span><div><h3>Smart Base foundation</h3><p>The planned sensing layer beneath the bed, designed to turn repeated use into simple trends.</p></div></li></ol></div></div></section>
    <section class="section warm-panel"><div class="wrap"><div class="heading-row">${sectionHeading("DESIGNED AROUND DAILY LIFE", "The details that make a bed easier to live with.", "The photographed bed is the current gray prototype. Final fit, materials, and construction remain in validation.")}</div><div class="feature-gallery"><article><figure>${image("product-prototype-golden.webp", "Golden retriever resting its head on the bolster of the current gray WoafyPet prototype")}</figure><div><small>PROTOTYPE SHOWN</small><h3>A familiar place to settle</h3><p>The current prototype pairs a low front opening with a bolstered edge. Final geometry remains in validation.</p></div></article><article><figure>${image("product-prototype-akita.webp", "Akita resting in the current gray WoafyPet prototype bed")}</figure><div><small>PROTOTYPE SHOWN</small><h3>Observed with different resting styles</h3><p>The gray prototype is being observed with different dogs and sleep positions. Final fit guidance is not yet published.</p></div></article><article><figure>${image("product-visualization-smart-base.png", "WoafyPet Smart Base concept")}</figure><div><small>SMART BASE</small><h3>No screen beside the dog</h3><p>The physical experience should feel like a calm bed. Any digital view belongs with the caregiver, not in the sleeping space.</p></div></article></div></div></section>
    <section class="section"><div class="wrap product-split reverse"><div class="product-copy">${sectionHeading("SMART BASE", "Track rest without another wearable.", "The Smart Base is planned to sit beneath the comfort system and summarize repeatable signals. It is not designed to diagnose pain, illness, or emergencies.")}<ul class="check-list"><li>Bed-use and rest-pattern context under validation</li><li>Compatibility and calibration still being tested</li><li>Plain weekly trends instead of frightening scores</li><li>Clear routes to education and veterinary conversation prep</li></ul>${button("Explore Smart Base", "https://www.woafy.pet/smart-base/")}</div><figure class="product-media landscape">${image("product-visualization-smart-base.png", "Planned modular WoafyPet Smart Base")}</figure></div></section>
    <section class="section proof-band"><div class="wrap">${sectionHeading("WHAT IS INCLUDED IN THIS PREVIEW", "A product architecture—not a purchase promise.", "We are sharing enough to make the direction concrete while keeping unresolved decisions visible.", "center")}<div class="boundary-grid"><article><span class="status testing">BEING VALIDATED</span><h3>Bed construction</h3><p>Materials, sizes, foam behavior, edge support, cleaning, durability, and production tolerances.</p></article><article><span class="status testing">BEING VALIDATED</span><h3>Smart Base performance</h3><p>Repeatability, floor conditions, load geometry, useful signals, and calibration behavior.</p></article><article><span class="status locked">NOT CLAIMED</span><h3>Medical conclusions</h3><p>No diagnosis, pain localization, heart or breathing monitoring, emergency detection, or replacement for veterinary care.</p></article></div></div></section>
    <section class="final-cta"><div><span class="eyebrow">BUILD WITH US</span><h2>Tell us what a better senior-dog bed must get right.</h2><p>Founder access will open in small research groups before any public sale.</p></div><div class="actions">${button("Request founder access", "/support/#founder-access", "light")}${button("Read the free guide", "/guide/", "outline-light")}</div></section>`,
  });
}

function smartBasePage() {
  const fields = [
    field.name,
    field.email,
    '<label class="field-wide"><span>What bed does your dog use now?</span><input name="currentBed" maxlength="180" required></label>',
    '<label class="field-wide"><span>What change would you most want to understand? <em>(optional)</em></span><textarea name="goal" maxlength="500"></textarea></label>',
  ];
  return page({
    route: "/smart-base/",
    title: "Smart Base",
    description:
      "See the in-development WoafyPet Smart Base sensing foundation, planned signals, compatibility questions, and research waitlist.",
    bodyClass: "product-page",
    body: `
    <section class="hero inner-hero base-hero"><div class="hero-copy"><span class="status testing">SMART BASE RESEARCH</span><h1>The quiet layer beneath better context.</h1><p class="lead">Notice routine changes without putting another device on your dog. Smart Base is the sensing foundation inside the Full Smart Bed, and we are studying whether it can reliably work under selected existing beds.</p><div class="actions">${button("Join Smart Base research", "#base-research")}</div></div><figure class="hero-media contain-media">${image("product-visualization-smart-base.png", "Planned modular WoafyPet Smart Base", { eager: true })}<figcaption><span>SMART BASE SYSTEM</span><span>Final geometry and compatibility are not locked</span></figcaption></figure></section>
    <section class="section"><div class="wrap">${sectionHeading("WHY KEEP SMART BASE", "Because observation can be useful—even when a new bed is not the answer.", "The module is strategically important. The standalone version stays off sale until compatibility, repeatability, and production design are proven.", "center")}<div class="job-grid"><article>${icon("notice")}<span>01</span><h3>Observe</h3><p>Explore repeatable context around bed use, settling, rest timing, and movement near the bed.</p></article><article>${icon("proof")}<span>02</span><h3>Validate</h3><p>Test how floor contact, bed construction, dog size, placement, and calibration change the signal.</p></article><article>${icon("guide")}<span>03</span><h3>Explain</h3><p>Translate only stable patterns into plain language that supports better notes and questions.</p></article></div></div></section>
    <section class="section warm-panel"><div class="wrap testing-grid"><div>${sectionHeading("COMPATIBILITY BEFORE COMMERCE", "A universal claim would be premature.", "A base beneath an existing bed has more variables than the integrated system. That is why the standalone path begins as a controlled research program.")}<ul class="check-list"><li>Bed footprint, stiffness, and contact surface</li><li>Dog weight range and typical sleep position</li><li>Floor level, material, and stability</li><li>Sensor placement, calibration, and repeatability</li><li>Cable, sealing, cleaning, and long-term safety</li></ul></div><div class="status-board"><h3>Current decision gates</h3><div><span>Mechanical design</span><b class="status testing">OPEN</b></div><div><span>Compatibility matrix</span><b class="status testing">OPEN</b></div><div><span>Repeatability tests</span><b class="status testing">OPEN</b></div><div><span>Production economics</span><b class="status testing">OPEN</b></div><div><span>Standalone availability</span><b class="status locked">NOT SET</b></div></div></div></section>
    <section class="section"><div class="wrap form-media-grid"><figure>${image("real-care-circle-owner-dog.jpg", "Dog owner sitting closely with a dog at home")}</figure>${previewForm({ id: "base-research", title: "Help test the right compatibility questions.", copy: "Join the research list for the standalone Smart Base concept.", fields, submit: "Join Smart Base research" })}</div></section>`,
  });
}

function carePathPage() {
  return page({
    route: "/care-path/",
    title: "Your Care Circle lesson path",
    description:
      "Turn a senior-dog care question into one reviewed starting lesson and three practical chapters.",
    bodyClass: "care-path-page",
    body: `
    <section class="care-path-hero" data-care-path="general"><div><p class="care-query-label">You asked</p><blockquote>“<span data-care-query>What has changed with my dog?</span>”</blockquote><h1>Start with the answer that fits.</h1></div><aside><span>Recommended public lesson</span><h2 data-care-lesson-title>When something seems different</h2><p data-care-lesson-summary>Record the change clearly, make the immediate environment safer, and prepare the right professional conversation.</p><a class="button primary" data-care-lesson-link href="/learn/slower-after-rest/?personalize=1">Open my lesson →</a></aside></section>
    <section class="section care-course"><div class="wrap care-course-layout"><nav class="care-course-nav" aria-label="Lesson chapters"><span>YOUR 3-CHAPTER PATH</span><a data-care-chapter-link="notice" href="#chapter-notice"><b>01</b><span>Notice the change</span></a><a data-care-chapter-link="today" href="#chapter-today"><b>02</b><span>Make today safer</span></a><a data-care-chapter-link="discuss" href="#chapter-discuss"><b>03</b><span>Prepare the conversation</span></a><div><strong>Need urgent help?</strong><p>Breathing trouble, collapse, repeated unproductive retching, inability to urinate, seizure, sudden inability to stand, or severe distress needs immediate veterinary care.</p><a href="/find-care/?care=emergency-vets">Open emergency guidance →</a></div></nav><div class="care-course-main">
      <section class="care-chapter" id="chapter-notice"><header><span>CHAPTER 01 · OBSERVE</span><h2 data-care-chapter-title="notice">Name the exact change</h2><p data-care-chapter-summary="notice">Turn “something feels off” into a calm record of what happened, when it began, and how it differs from your dog’s normal.</p></header><ol><li><strong>Choose one ordinary moment.</strong><span>Watch a normal rise, meal, night wake-up, water refill, or bathroom trip without provoking the change.</span></li><li><strong>Add timing and context.</strong><span>Note the time, surface, previous activity, medication, food, weather, and what happened first.</span></li><li><strong>Compare the pattern.</strong><span>Record frequency, duration, what helps, and whether it is stable, improving, or becoming more frequent.</span></li></ol><div class="chapter-actions"><a href="/guide/">Use the 7-Day Change Tracker →</a></div></section>
      <section class="care-chapter" id="chapter-today"><header><span>CHAPTER 02 · SUPPORT</span><h2 data-care-chapter-title="today">Reduce friction today</h2><p data-care-chapter-summary="today">Make the routine safer and easier while preserving useful context for the veterinary team.</p></header><ul><li>Add traction and clear familiar routes.</li><li>Keep water, food, toileting, and rest easy to reach.</li><li>Change one environmental detail at a time so you can tell what helped.</li><li>Never give human medication, restrict water, or change prescribed treatment without veterinary guidance.</li></ul><div class="callout"><strong>Do not stage symptoms for a video.</strong><span>One natural, safely captured moment is more useful than repeated testing that tires or frightens your dog.</span></div></section>
      <section class="care-chapter" id="chapter-discuss"><header><span>CHAPTER 03 · ACT</span><h2 data-care-chapter-title="discuss">Make the veterinary call specific</h2><p data-care-chapter-summary="discuss">Bring a short timeline, the whole routine, and questions that end with a measurable follow-up plan.</p></header><ol><li><strong>Lead with the change.</strong><span>Share when it began, how often it happens, what is different from normal, and what makes it better or worse.</span></li><li><strong>Bring the complete context.</strong><span>List medicines, supplements, food, water, bathroom changes, recent events, and one or two safe videos.</span></li><li><strong>Leave knowing what comes next.</strong><span>Ask what should be evaluated, what improvement should look like, and which signs mean you should call sooner.</span></li></ol><div class="chapter-actions"><a href="/find-care/">Find the right kind of care →</a><a href="/learn/">Browse every Care Circle lesson →</a></div></section>
    </div></div></section>
    <section class="care-path-next"><div><span class="eyebrow">KEEP GOING</span><h2>Use reviewed chapters—not an endless feed.</h2><p>Start with the closest lesson, take one practical action, and bring a clearer record to the professional who knows your dog.</p></div><div class="actions">${button("Open Care Circle Lessons", "/learn/", "light")}${button("Get the Senior Dog Guide", "/guide/", "outline-light")}</div></section>`,
  });
}

function legacyGuidePage() {
  const fields = [
    field.email,
    field.dogAge,
    '<label class="field-wide"><span>Main change <em>(optional)</em></span><select name="change"><option value="">Choose one</option><option>Movement after rest</option><option>Restless nights</option><option>Appetite or water</option><option>Bathroom routine</option><option>Mood or connection</option><option>Another change</option></select></label>',
    '<label class="field-wide separate-consent"><input type="checkbox" name="marketingConsent"><span>Also send me occasional WoafyPet product-research updates. Optional and separate from guide delivery.</span></label>',
  ];
  const days = Array.from(
    { length: 7 },
    (_, index) =>
      `<tr><th scope="row">Day ${index + 1}</th><td></td><td></td><td></td><td></td><td></td></tr>`,
  ).join("");
  return page({
    route: "/guide/",
    title: "Senior Dog Care Guide",
    description:
      "A detailed guide to common senior-dog changes, safer next steps, solution categories, urgent boundaries, and productive veterinary follow-up.",
    bodyClass: "guide-page",
    body: `
    <section class="guide-hero guide-hero-revised"><div class="guide-hero-copy"><span class="eyebrow">FREE PRACTICAL MANUAL</span><h1>Senior Dog Care Guide</h1><p class="lead">Notice meaningful changes, record them clearly, and know what to discuss with your veterinarian.</p><ul class="guide-hero-results"><li>Recognize the issue</li><li>Make today safer</li><li>Choose the right care path</li></ul><div class="actions">${button("Explore the complete guide", "#guide-results")}${button("Read Care Circle lessons", "/learn/", "secondary")}</div></div><figure>${image("guide-recognize-older-golden.jpg", "Older golden retriever receiving a gentle check-in from a caregiver", { eager: true })}<figcaption>Clear, detailed guidance for the changes senior-dog families face.</figcaption></figure></section>
    <section class="section guide-manual" id="guide-results"><div class="wrap">${sectionHeading("SIX RESULTS FROM ONE GUIDE", "Move from ‘something is different’ to a specific next step.", "Use the section that matches today. You do not have to absorb the whole guide at once.", "center")}<div class="guide-manual-grid">
      <article><span>01</span><h3>Understand the common problems</h3><p>Learn how movement, sleep, appetite, thirst, bathroom, sensory, cognitive, dental, and comfort changes may first appear.</p><a href="/learn/">Choose a Care Circle lesson →</a></article>
      <article><span>02</span><h3>Recognize a meaningful change</h3><p>Compare frequency, timing, context, safe video, and your dog’s ordinary baseline instead of guessing at a cause.</p><a href="#tracker">Use the companion tracker →</a></article>
      <article><span>03</span><h3>Make daily life safer now</h3><p>Reduce slipping, long routes, difficult access, disrupted sleep, and unnecessary effort while you gather better context.</p><a href="/care-path/?q=How+can+I+make+today+easier+for+my+senior+dog">Build a practical care path →</a></article>
      <article><span>04</span><h3>Understand solution categories</h3><p>Know when veterinary evaluation, diagnostics, mobility rehabilitation, nutrition, dental care, assistive products, cognitive support, or palliative care may enter the conversation.</p><a href="/find-care/">Find the right care category →</a></article>
      <article><span>05</span><h3>Know when not to wait</h3><p>Separate a change to record from one that needs prompt or emergency veterinary attention.</p><a href="/find-care/#emergency">Open emergency guidance →</a></article>
      <article><span>06</span><h3>Leave with a follow-up plan</h3><p>Bring a concise timeline, ask what should be evaluated, and agree on what improvement and recheck timing should look like.</p><a href="/care-path/?q=What+should+I+ask+my+veterinarian+about+my+senior+dog">Prepare the conversation →</a></article>
    </div></div></section>
    <section class="section guide-signup-section"><div class="wrap form-copy-grid"><div>${sectionHeading("GET THE COMPLETE GUIDE", "Keep the full manual and companion tracker close.", "The guide is designed to explain common problems, what to notice, safer actions, existing solution categories, and when professional help should come sooner.")}<div class="boundary-note"><strong>Private preview</strong><span>Email delivery is disabled here. The full guide remains readable below while the delivery workflow is being prepared.</span></div></div>${previewForm({ id: "guide-request", title: "Preview guide delivery.", copy: "Enter the details you would use when the email workflow is activated.", fields, submit: "Preview guide delivery", compact: true })}</div></section>
    <section class="section warm-panel"><div class="wrap guide-chapters"><div>${sectionHeading("WHAT TO WATCH", "Five daily views—one whole dog.", "A single score can hide the story. Look at patterns across ordinary functions.")}<div class="watch-list"><article><strong>Sleep & settling</strong><p>Bed changes, pacing, wake-ups, panting, vocalizing, and what helps.</p></article><article><strong>Movement</strong><p>First rise, slipping, stairs, walk pace, turning, jumping, and recovery.</p></article><article><strong>Food & water</strong><p>Amounts, timing, interest, chewing, swallowing, nausea clues, and refills.</p></article><article><strong>Bathroom</strong><p>Frequency, effort, accidents, route, posture, stool, and urine changes.</p></article><article><strong>Comfort & connection</strong><p>Favorite routines, attention, restlessness, withdrawal, grooming, and joy.</p></article></div></div><aside class="urgent-card"><span class="eyebrow">DO NOT WAIT FOR A WORKSHEET</span><h2>Some changes need immediate help.</h2><p>Breathing trouble, collapse, repeated unproductive retching, inability to urinate, severe bleeding, seizures, sudden inability to stand, or severe distress needs urgent veterinary attention.</p><a class="text-link" href="/find-care/#emergency">Start with emergency care guidance →</a></aside></div></section>
    <section class="section tracker-section" id="tracker"><div class="wrap"><div class="heading-row">${sectionHeading("7-DAY CHANGE TRACKER", "Record what happened—not what you fear it means.", "Use this companion after you understand what matters. Choose one ordinary check-in time each day and keep notes short enough to repeat.")}<button class="button secondary" type="button" data-print-guide>Print this tracker <span aria-hidden="true">↗</span></button></div><div class="tracker-table-wrap"><table class="tracker-table"><thead><tr><th>Day</th><th>Sleep & settling</th><th>Movement</th><th>Food & water</th><th>Bathroom</th><th>Comfort & connection</th></tr></thead><tbody>${days}</tbody></table></div><div class="tracker-prompts"><article><span>01</span><h3>Be specific</h3><p>“Paused 8 seconds before standing after the morning nap” is more useful than “seemed off.”</p></article><article><span>02</span><h3>Keep life normal</h3><p>Do not force stairs, jumps, meals, or repeated movements just to test a concern.</p></article><article><span>03</span><h3>Record what helped</h3><p>Note traction, a shorter walk, a quiet room, easier access, or another ordinary change.</p></article><article><span>04</span><h3>Bring the timeline</h3><p>Include when it began, how often it happens, medicines, recent events, and one or two safe videos.</p></article></div></div></section>
    <section class="section"><div class="wrap">${sectionHeading("START WITH THE CLOSEST CHANGE", "Read one three-chapter lesson beside the guide.", "Each lesson offers a specific observation plan, safer home context, and a clear veterinary boundary.", "center")}${lessonCards()}</div></section>`,
  });
}

function legacyGuidePageV3() {
  return page({
    route: "/guide/",
    title: "Senior Dog Care Guide",
    description:
      "Get the complete Senior Dog Care Guide for common changes, safer actions today, a practical tracker, and clearer veterinary questions.",
    bodyClass: "guide-page guide-v3",
    body: `
    <section class="guide-v3-hero"><div class="guide-v3-hero-copy"><h1>See the change. Know what to do today.</h1><p class="lead">Get the complete Senior Dog Care Guide: six common problems, safe first steps, a 7-day tracker, and the exact questions to bring to your veterinarian.</p><form class="guide-v3-form preview-form" id="guide-signup" data-preview-form data-form-title="Senior Dog Care Guide"><label><span>Email address</span><input name="email" type="email" autocomplete="email" maxlength="254" placeholder="you@example.com" required></label><label><span>What are you noticing? (optional)</span><select name="concern"><option value="">Choose one</option><option>Getting up or walking</option><option>Restless nights</option><option>Eating</option><option>Drinking or bathroom</option><option>Less interest in daily life</option></select></label><label class="consent-row"><input type="checkbox" name="guideConsent" required><span>Send me the guide only. Product updates are a separate choice.</span></label><button class="button primary" type="submit">Send me the complete guide <span aria-hidden="true">→</span></button><p class="form-note" data-form-note role="status">Preview only—no information is sent or stored.</p></form></div><figure class="guide-v3-hero-media">${image("real-home-owner-dog.jpg", "Senior dog resting closely with a caregiver at home", { eager: true })}</figure></section>

    <section class="section guide-v3-changes"><div class="wrap"><header class="guide-v3-section-heading"><h2>Start with the change you can see.</h2></header><div class="guide-v3-change-grid">
      <article><figure>${image("problem-mobility-senior-lab.jpg", "Senior yellow Labrador resting at home")}</figure><div><h3>Slower to stand or walk</h3><p>Time one natural rise. Note the floor, the pause, the first 15 steps, and whether movement loosens. Add traction to the route your dog already uses.</p><a class="text-link" href="/learn/slower-after-rest/">Open the mobility lesson →</a></div></article>
      <article><figure>${image("guide-action-brown-dog-resting.jpg", "Older brown dog resting comfortably at home")}</figure><div><h3>Waking or pacing at night</h3><p>Record the exact time, first behavior, bathroom trip, breathing, and what finally helps. Keep water and the usual route easy to reach.</p><a class="text-link" href="/learn/restless-at-night/">Open the nighttime lesson →</a></div></article>
      <article><figure>${image("problem-appetite-owner-and-dogs.jpg", "Caregiver observing two dogs during an ordinary meal routine")}</figure><div><h3>Eating or drinking differently</h3><p>Measure what you offer and what remains. Add chewing, vomiting, stool, water, energy, and medicine timing.</p><a class="text-link" href="/learn/changes-in-appetite/">Open the eating lesson →</a></div></article>
      <article><figure>${image("problem-daily-routine-senior-dark-dog.jpg", "Senior dark dog with a gray muzzle resting outdoors")}</figure><div><h3>Accidents or less interest in life</h3><p>Record frequency, posture, and one familiar activity your dog starts, finishes, or avoids.</p><a class="text-link" href="/learn/less-interest-in-life/">Open the daily-life lesson →</a></div></article>
    </div></div></section>

    <section class="section guide-v3-vet-note"><div class="wrap guide-v3-vet-note-grid"><figure>${image("guide-vet-care-brown-dog.jpg", "Brown dog receiving attentive veterinary care")}</figure><div><h2>Bring this to your veterinarian—not “he seems off.”</h2><div class="guide-v3-note-points"><article><h3>What changed</h3><p>After his morning nap, he paused 8 seconds before standing.</p></article><article><h3>What happened next</h3><p>He slipped twice on the hallway floor and loosened after 12 steps.</p></article><article><h3>What to ask</h3><p>What should we examine, and which change should make me call sooner?</p></article></div><p>The guide builds the same clear note for movement, sleep, meals, water, bathroom habits, and connection.</p></div></div></section>

    <section class="section guide-v3-path"><div class="wrap"><header class="guide-v3-section-heading"><h2>Inside the complete guide.</h2></header><div class="guide-v3-path-grid"><div class="guide-v3-path-steps"><article><h3>Recognize the pattern</h3><p>See how mobility, sleep, appetite, water, bathroom, and connection changes first appear.</p></article><article><h3>Observe what matters</h3><p>Record timing, context, frequency, changed function, and what helps.</p></article><article><h3>Make today safer</h3><p>Use low-risk home changes without forcing a test or masking the pattern.</p></article><article><h3>Compare care paths</h3><p>Understand where veterinary evaluation, rehabilitation, nutrition, dental care, assistive products, and comfort-focused care may fit.</p></article><article><h3>Know when to call</h3><p>Separate a change to track from a sign that needs urgent veterinary care.</p></article></div><figure>${image("guide-solutions-white-brown-dog.jpg", "White and brown senior dog walking with a caregiver outdoors")}</figure></div></div></section>

    <section class="section guide-v3-tracker"><div class="wrap"><header class="guide-v3-section-heading"><h2>A useful record in two minutes a day.</h2></header><div class="guide-v3-table-wrap"><table><thead><tr><th>What changed?</th><th>When and where?</th><th>How long or how often?</th><th>What helped?</th><th>What daily function changed?</th></tr></thead><tbody><tr><td>Paused before standing</td><td>After morning nap, hallway</td><td>8-second pause; 12 stiff steps</td><td>Runner reduced slipping</td><td>Needed help at two kitchen steps</td></tr></tbody></table></div></div></section>

    <section class="guide-v3-urgent"><div><h2>Some changes cannot wait.</h2><p>Do not wait for the guide if your dog has trouble breathing, collapses, repeatedly retches without bringing anything up, cannot urinate, has a seizure, suddenly cannot stand, or is in severe distress. Contact urgent veterinary care now.</p></div><a class="text-link" href="/find-care/#emergency">Find urgent veterinary care →</a></section>`,
  });
}

function guidePage() {
  const guideTopics = [
    [
      "problem-mobility-senior-lab.jpg",
      "Senior yellow Labrador resting at home",
      "Movement",
      "Time the first rise. Record slips, stairs, pace, and recovery.",
    ],
    [
      "problem-restless-night-dog-sleeping.jpg",
      "Dog sleeping at home",
      "Sleep",
      "Separate pacing, pain clues, thirst, toileting, and confusion.",
    ],
    [
      "problem-appetite-owner-offering-food.jpg",
      "Caregiver offering food to a dog",
      "Food & water",
      "Measure what was offered, eaten, kept down, and paired with thirst.",
    ],
    [
      "real-senior-care-at-home.jpg",
      "Dog resting in a familiar room",
      "Bathroom",
      "Track timing, urgency, effort, amount, accidents, and distress.",
    ],
    [
      "problem-daily-routine-senior-dark-dog.jpg",
      "Senior dark dog with a gray muzzle",
      "Daily life",
      "Notice which favorite routines are started, finished, or avoided.",
    ],
    [
      "guide-vet-care-brown-dog.jpg",
      "Dog receiving veterinary care",
      "Call sooner",
      "Match the change with the signs that need prompt veterinary help.",
    ],
  ];
  return page({
    route: "/guide/",
    title: "Complete Senior Dog Care Guide",
    description:
      "Get a practical guide to common dog-care changes, safer actions, useful tracking, and clearer veterinary questions.",
    bodyClass: "guide-page guide-v5",
    body: `
    <section class="guide-v5-hero"><div><h1>See the change. Make today easier. Know when to call.</h1><p>The complete guide for movement, sleep, appetite, bathroom, comfort, and daily-life changes.</p><form class="guide-v5-form preview-form" id="guide-signup" data-preview-form data-form-title="Complete Senior Dog Care Guide"><label><span>Email address</span><input name="email" type="email" autocomplete="email" maxlength="254" placeholder="you@example.com" required></label><label><span>Start with</span><select name="concern"><option value="">Choose a concern</option><option>Getting up or walking</option><option>Restless nights</option><option>Eating or drinking</option><option>Bathroom changes</option><option>Less interest in daily life</option></select></label><button class="button primary" type="submit">Get My Free Complete Guide <span aria-hidden="true">→</span></button><p class="form-note" data-form-note role="status" aria-live="polite"></p></form><div class="guide-v5-results"><span>What to notice</span><span>What to do today</span><span>What to tell your vet</span></div></div><figure>${image("real-home-owner-dog.jpg", "Caregiver sitting closely with a dog at home", { eager: true })}</figure></section>

    <section class="guide-v5-topics"><header><h2>Start with the change you can see.</h2></header><div>${guideTopics.map(([asset, alt, title, copy]) => `<article><figure>${image(asset, alt, { eager: true })}</figure><div><h3>${title}</h3><p>${copy}</p></div></article>`).join("")}</div></section>

    <section class="guide-v5-plan"><figure>${image("guide-action-brown-dog-resting.jpg", "Brown dog resting comfortably at home", { eager: true })}</figure><div><h2>Turn one vague worry into a useful plan.</h2><ol><li><strong>Notice</strong><span>Describe one ordinary moment exactly.</span></li><li><strong>Support</strong><span>Change one low-risk part of the environment.</span></li><li><strong>Compare</strong><span>Watch the next ordinary moment and record what changed.</span></li></ol></div></section>

    <section class="guide-v5-vet"><div><h2>Give your veterinarian the details that move the conversation forward.</h2><strong class="guide-script-label">Example observation</strong><p class="guide-visit-script">For 10 days, she has paused after naps, slipped twice in the hallway, and stopped using the two kitchen steps.</p><ul><li>When it started and how often it happens</li><li>Which daily function is harder</li><li>What helps, what does not, and medicine changes</li><li>A safe photo or short video when available</li></ul><a class="button primary" href="#guide-signup">Get the complete guide →</a></div><figure>${image("guide-vet-care-brown-dog.jpg", "Dog receiving attentive veterinary care", { eager: true })}</figure></section>`,
  });
}

function legacyLearnPage() {
  return page({
    route: "/learn/",
    title: "Senior Dog Care Library",
    description:
      "Read clear, chaptered senior-dog lessons on slower movement, restless nights, and appetite changes with source and veterinary boundaries.",
    bodyClass: "learn-page",
    body: `
    <section class="page-intro visual-intro"><div><span class="eyebrow">THE CARE LIBRARY</span><h1>Practical lessons for the change you can see.</h1><p>Short, specific lessons help you observe safely, reduce guesswork, and prepare a clearer conversation with the veterinary team that knows your dog.</p></div><figure>${image("real-senior-care-at-home.jpg", "Senior dog relaxing at home", { eager: true })}</figure></section>
    <section class="section no-top"><div class="wrap">${sectionHeading("PUBLIC STARTING POINTS", "Choose the closest change.", "Every lesson is public, contains three practical chapters and quizzes, and clearly states when to call sooner.")} ${lessonCards()}</div></section>
    <section class="section warm-panel"><div class="wrap testing-grid"><div>${sectionHeading("USE THE LIBRARY WELL", "Observation is a bridge, not a diagnosis.", "The best result is a shorter path from ‘something feels different’ to specific information and the right professional conversation.")}<ul class="check-list"><li>Choose one change instead of reading everything at once</li><li>Record ordinary moments; do not provoke a symptom</li><li>Complete each quick check before moving on</li><li>Call sooner when the urgent boundary matches what you see</li></ul></div><aside class="promise-card"><span class="eyebrow">FREE COMPANION TOOL</span><h2>Use the seven-day tracker.</h2><p>Bring sleep, movement, food, water, bathroom, comfort, and connection into one calm page.</p>${button("Open the free guide", "/guide/", "secondary")}</aside></div></section>`,
  });
}

function legacyLessonPage(lesson) {
  return page({
    route: `/learn/${lesson.slug}/`,
    title: lesson.title,
    description: lesson.intro,
    bodyClass: "lesson-page",
    body: `
    <article><header class="lesson-hero"><div><a class="back-link" href="/learn/">← Care Library</a><span class="eyebrow">${escapeHtml(lesson.eyebrow)}</span><h1>${escapeHtml(lesson.title)}</h1><p>${escapeHtml(lesson.intro)}</p></div><figure>${image(lesson.image, lesson.imageAlt, { eager: true })}</figure></header></article>`,
  });
}

function learnPage() {
  return page({
    route: "/learn/",
    title: "Senior Dog Care Lessons",
    description:
      "Choose public, condition-first senior-dog lessons with tailored chapters, quick quizzes, urgent boundaries, likes, and Care Circle discussion.",
    bodyClass: "learn-page learn-page-revised",
    body: `
    <section class="page-intro visual-intro learn-intro"><div><h1>Start with what changed.</h1><p>Choose the closest concern. Tell us what is happening, then follow the specific observations, safer first actions, quick checks, and call-sooner signs.</p></div><figure>${image("real-senior-care-at-home.jpg", "Senior dog relaxing at home", { eager: true })}</figure></section>
    <section class="section no-top lesson-library"><div class="wrap">${sectionHeading("", "Which change is closest to yours?", "Open any lesson now. Your answers stay in this browser and tailor the chapter focus.", "center")}${lessonCards()}</div></section>
    <section class="care-circle-invite"><div>${icon("people")}<span><h2>Read owner questions, replies, likes, and comments.</h2></span></div>${button("Open the Care Circle", "/care-circle/", "light")}</section>`,
  });
}

function careCirclePage() {
  const topics = ["All", ...new Set(lessons.map((lesson) => lesson.topic))];
  return page({
    route: "/care-circle/",
    title: "Public Care Circle",
    description:
      "Browse six public senior-dog lessons and preview owner discussions with visible likes, comments, and practical next steps.",
    bodyClass: "care-circle-page",
    body: `
    <section class="circle-hero"><div><h1>Real questions from concerned pet owners like you.</h1><p>Choose the change that sounds familiar. Each answer leads to a condition-first lesson, three practical results, quick checks, and clear call-sooner signs.</p><div class="actions">${button("Browse Care Circle lessons", "#public-lessons")}</div></div><figure>${image("real-care-circle-owner-dog.jpg", "Pet owner sharing a quiet moment at home with a dog", { eager: true })}</figure></section>
    <section class="section circle-feed-section" id="public-lessons"><div class="wrap"><div class="circle-toolbar"><div><h2>Start with the question closest to yours.</h2><p>See what to observe, what to make easier today, and what to prepare for your veterinarian.</p></div><div class="circle-filters" role="group" aria-label="Filter Care Circle discussions">${topics.map((topic, index) => `<button type="button" data-circle-filter="${escapeHtml(topic.toLowerCase())}" aria-pressed="${index === 0 ? "true" : "false"}">${escapeHtml(topic)}</button>`).join("")}</div></div><div class="circle-feed" aria-live="polite">${lessons.map((lesson) => `<article class="circle-post" data-care-post data-preview-discussion data-topic="${escapeHtml(lesson.topic.toLowerCase())}"><figure><a href="/learn/${lesson.slug}/">${image(lesson.image, lesson.imageAlt)}</a></figure><div class="circle-post-body"><h2>${escapeHtml(lesson.community.question)}</h2><p>${escapeHtml(lesson.community.excerpt)}</p><ul class="check-list" aria-label="Results from ${escapeHtml(lesson.title)}">${lesson.chapters.map((chapter) => `<li>${escapeHtml(chapter.result)}</li>`).join("")}</ul><a class="text-link" href="/learn/${lesson.slug}/">Start the ${escapeHtml(lesson.topic.toLowerCase())} lesson →</a><div class="circle-actions"><button type="button" data-preview-like aria-pressed="false" data-base-count="${lesson.community.helpful}">${icon("heart")}<span>Like <b data-like-count>${lesson.community.helpful}</b></span></button><button type="button" data-comments-toggle aria-expanded="false">${icon("people")}<span>Comments <b>${lesson.community.replies.length}</b></span></button></div><div class="circle-comments" data-preview-comments hidden>${lesson.community.replies.map(([name, reply]) => `<article><span>${escapeHtml(name)}</span><p>${escapeHtml(reply)}</p></article>`).join("")}</div></div></article>`).join("")}</div></div></section>`,
  });
}

function communityControls(id, baseLikes, replies = []) {
  return `<div class="lesson-community" data-community-interaction="${escapeHtml(id)}">
    <div class="lesson-community-actions">
      <button type="button" data-local-like data-community-key="${escapeHtml(id)}" data-base-count="${baseLikes}" aria-pressed="false">${icon("heart")}<span>Like <b data-like-count>${baseLikes}</b></span></button>
      <button type="button" data-local-comments-toggle aria-expanded="false">${icon("people")}<span>Comment <b data-comment-count>${replies.length}</b></span></button>
    </div>
    <div class="lesson-community-panel" data-local-comments hidden>
      <div class="lesson-community-list" data-local-comment-list>${replies.map(([name, reply]) => `<article><strong>${escapeHtml(name)}</strong><p>${escapeHtml(reply)}</p></article>`).join("")}</div>
      <form data-local-comment-form><label><span>Add your comment</span><textarea name="comment" maxlength="600" required placeholder="What helped, or what are you noticing?"></textarea></label><button type="submit">Post comment →</button><p role="status" data-local-comment-status></p></form>
    </div>
  </div>`;
}

function lessonPage(lesson) {
  const durationOptions = [
    "Today or yesterday",
    "2–7 days",
    "1–4 weeks",
    "Longer than a month",
  ];
  const chapterImageSets = {
    "slower-after-rest": [
      {
        name: "guide-observe-beagle-owner.jpg",
        alt: "Beagle resting beside a caregiver during an ordinary home routine",
      },
      {
        name: "guide-action-brown-dog-resting.jpg",
        alt: "Brown dog resting comfortably on a home floor",
      },
      {
        name: "guide-vet-care-brown-dog.jpg",
        alt: "Dog receiving attentive care from a veterinary professional",
      },
    ],
    "restless-at-night": [
      {
        name: "real-senior-care-at-home.jpg",
        alt: "Dog resting on the floor in a quiet living room",
      },
      {
        name: "guide-recognize-older-golden.jpg",
        alt: "Older golden retriever resting on a home floor",
      },
      {
        name: "guide-vet-care-brown-dog.jpg",
        alt: "Dog receiving attentive care from a veterinary professional",
      },
    ],
    "changes-in-appetite": [
      {
        name: "guide-observe-beagle-owner.jpg",
        alt: "Beagle beside a caregiver during a familiar home routine",
      },
      {
        name: "real-home-owner-dog.jpg",
        alt: "Golden retriever resting on a bed at home",
      },
      {
        name: "guide-vet-care-brown-dog.jpg",
        alt: "Dog receiving attentive care from a veterinary professional",
      },
    ],
    "drinking-more-water": [
      {
        name: "real-senior-care-at-home.jpg",
        alt: "Dog resting on the floor in a familiar living room",
      },
      {
        name: "guide-action-brown-dog-resting.jpg",
        alt: "Brown dog resting comfortably at home",
      },
      {
        name: "guide-vet-care-brown-dog.jpg",
        alt: "Dog receiving attentive care from a veterinary professional",
      },
    ],
    "less-interest-in-life": [
      {
        name: "real-care-circle-owner-dog.jpg",
        alt: "Dog greeting a woman with an affectionate lick",
      },
      {
        name: "real-home-owner-dog.jpg",
        alt: "Golden retriever resting on a bed at home",
      },
      {
        name: "guide-vet-care-brown-dog.jpg",
        alt: "Dog receiving attentive care from a veterinary professional",
      },
    ],
    "bathroom-accidents": [
      {
        name: "problem-mobility-senior-lab.jpg",
        alt: "Senior yellow Labrador resting on a home floor",
      },
      {
        name: "real-senior-care-at-home.jpg",
        alt: "Dog resting near a familiar route through a living room",
      },
      {
        name: "guide-vet-care-brown-dog.jpg",
        alt: "Dog receiving attentive care from a veterinary professional",
      },
    ],
  };
  const chapterImages =
    chapterImageSets[lesson.slug] || chapterImageSets["slower-after-rest"];
  return page({
    route: `/learn/${lesson.slug}/`,
    title: lesson.title,
    description: lesson.intro,
    bodyClass: "lesson-page lesson-page-revised",
    body: `
    <article><header class="lesson-hero revised"><div><a class="back-link" href="/care-circle/">← Public Care Circle</a><h1>${escapeHtml(lesson.title)}</h1><p>${escapeHtml(lesson.intro)}</p>${communityControls(`${lesson.slug}-lesson`, lesson.community.helpful, lesson.community.replies)}</div><figure>${image(lesson.image, lesson.imageAlt, { eager: true })}</figure></header>
    <section class="lesson-intake-section" data-lesson-personalizer hidden><div class="wrap lesson-intake-layout"><div><h2>Make this lesson fit your dog.</h2><p>Answer once. We will place the most relevant details first.</p><div class="urgent-inline"><strong>Sudden or severe change?</strong><p>${escapeHtml(lesson.urgent)}</p></div></div><fieldset class="lesson-intake-card" data-lesson-intake data-lesson-slug="${lesson.slug}"><legend class="sr-only">Personalize this lesson</legend><div class="lesson-intake-grid"><label><span>Dog’s age</span><select data-intake-field="age"><option value="">Choose one</option><option>Under 1 year</option><option>1–3 years</option><option>4–6 years</option><option>7–9 years</option><option>10–12 years</option><option>13–15 years</option><option>16+ years</option></select></label><label><span>${escapeHtml(lesson.conditionLabel)}</span><select data-intake-field="condition"><option value="">Choose one</option>${lesson.conditionOptions.map((option) => `<option>${escapeHtml(option)}</option>`).join("")}</select></label><label><span>How long?</span><select data-intake-field="duration"><option value="">Choose one</option>${durationOptions.map((option) => `<option>${escapeHtml(option)}</option>`).join("")}</select></label><label><span>Daily impact</span><select data-intake-field="impact"><option value="">Choose one</option>${lesson.impactOptions.map((option) => `<option>${escapeHtml(option)}</option>`).join("")}</select></label><label class="field-wide"><span>Known condition or medicine change <em>(optional)</em></span><input data-intake-field="context" maxlength="180" placeholder="Arthritis, surgery, or a recent medicine change"></label><fieldset class="intake-urgent field-wide"><legend>Urgent warning sign now?</legend><label><input type="radio" name="${lesson.slug}-urgent" value="no" data-intake-field="urgent">No</label><label><input type="radio" name="${lesson.slug}-urgent" value="yes" data-intake-field="urgent">Yes or not sure</label></fieldset></div><button class="button primary" type="button" data-build-lesson>Personalize this lesson <span aria-hidden="true">→</span></button><p class="intake-error" role="alert" data-intake-error hidden>Please answer the four questions and choose an urgent-sign option.</p></fieldset><aside class="urgent-intake-result" data-urgent-intake-result hidden tabindex="-1"><h2>Contact a veterinary service now.</h2><p>${escapeHtml(lesson.urgent)}</p>${button("Find urgent care", "/find-care/?care=emergency-vets")}</aside></div></section>
    <section class="tailored-course" data-tailored-course tabindex="-1"><header class="tailored-summary"><div><h2>Your public lesson</h2><p data-tailored-profile>Follow the chapters in order, then use the quick checks to confirm the next step.</p><p class="chapter-result" data-tailored-priority>${escapeHtml(lesson.chapters[0].result)}</p></div></header><div class="lesson-body revised"><aside class="lesson-nav">${lesson.chapters.map((chapter, index) => `<a href="#chapter-${index + 1}"><span>0${index + 1}</span>${escapeHtml(chapter.title)}</a>`).join("")}<a href="#call-sooner"><span>!</span>Call-sooner signs</a></aside><div class="lesson-chapters revised">${lesson.chapters.map((chapter, index) => `<section class="lesson-chapter-card" id="chapter-${index + 1}" data-lesson-chapter="${index + 1}"><figure>${image(chapterImages[index].name, chapterImages[index].alt)}</figure><div class="chapter-content"><span class="chapter-number">Chapter 0${index + 1}</span><h2>${escapeHtml(chapter.title)}</h2><p class="chapter-result" data-tailored-chapter-summary="${index + 1}">${escapeHtml(chapter.result)}</p><p>${escapeHtml(chapter.copy)}</p><ol>${chapter.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol><fieldset class="chapter-quiz" data-chapter-quiz data-answer="${escapeHtml(chapter.quiz.answer)}" data-correct-message="${escapeHtml(chapter.quiz.correct)}" data-retry-message="${escapeHtml(chapter.quiz.retry)}"><legend>${escapeHtml(chapter.quiz.question)}</legend>${chapter.quiz.options.map(([value, label]) => `<label><input type="radio" name="${lesson.slug}-quiz-${index + 1}" value="${escapeHtml(value)}"><span>${escapeHtml(label)}</span></label>`).join("")}<button type="button" data-check-quiz>Check my answer</button><p role="status" aria-live="polite" data-quiz-feedback></p></fieldset>${communityControls(`${lesson.slug}-chapter-${index + 1}`, Math.max(3, lesson.community.helpful - (index + 1) * 7))}</div></section>`).join("")}<section class="call-sooner" id="call-sooner"><h2>Call sooner when you see this.</h2><p>${escapeHtml(lesson.urgent)}</p></section></div></div></section></article>`,
  });
}

function directoryCategoryLabel(slug) {
  return (
    directoryCategories.find(([value]) => value === slug)?.[1] ||
    slug.replaceAll("-", " ")
  );
}

function directoryCategoryTags(categories, limit = 3) {
  return categories
    .slice(0, limit)
    .map(
      (category) =>
        `<span>${escapeHtml(directoryCategoryLabel(category))}</span>`,
    )
    .join("");
}

function directoryEffectiveCategories(categories) {
  const next = new Set(categories);
  if (next.has("in-home-euthanasia") || next.has("quality-of-life-consults"))
    next.add("hospice-palliative-care");
  if (next.has("specialty-hospitals")) next.add("senior-veterinarians");
  if (
    next.has("pet-cemeteries-burial") ||
    next.has("cremation-aquamation") ||
    next.has("legacy-keepsakes")
  )
    next.add("memorial-aftercare");
  return [...next];
}

function directoryRegion(entry) {
  const regionNames = {
    AL: "Alabama",
    AZ: "Arizona",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DC: "District of Columbia",
    FL: "Florida",
    GA: "Georgia",
    IA: "Iowa",
    IL: "Illinois",
    IN: "Indiana",
    KS: "Kansas",
    KY: "Kentucky",
    MA: "Massachusetts",
    MD: "Maryland",
    MI: "Michigan",
    MN: "Minnesota",
    MO: "Missouri",
    NC: "North Carolina",
    NJ: "New Jersey",
    NM: "New Mexico",
    NV: "Nevada",
    NY: "New York",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    SC: "South Carolina",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VA: "Virginia",
    WA: "Washington",
    WI: "Wisconsin",
    AB: "Alberta",
    ON: "Ontario",
    QC: "Quebec",
  };
  if (entry.region) return regionNames[entry.region] || entry.region;
  const location = String(entry.address || entry.coverage || "");
  const abbreviation = location.match(
    /,\s*([A-Z]{2})(?:\s+\d{5}(?:-\d{4})?)?(?:\s*,|$)/,
  )?.[1];
  return regionNames[abbreviation] || abbreviation || "Other";
}

function directoryDisplayLocation(entry) {
  const location = String(entry.address || entry.coverage || "");
  const regionNames = {
    AL: "Alabama",
    AZ: "Arizona",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DC: "District of Columbia",
    FL: "Florida",
    GA: "Georgia",
    IA: "Iowa",
    IL: "Illinois",
    IN: "Indiana",
    KS: "Kansas",
    KY: "Kentucky",
    MA: "Massachusetts",
    MD: "Maryland",
    MI: "Michigan",
    MN: "Minnesota",
    MO: "Missouri",
    NC: "North Carolina",
    NJ: "New Jersey",
    NM: "New Mexico",
    NV: "Nevada",
    NY: "New York",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    SC: "South Carolina",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VA: "Virginia",
    WA: "Washington",
    WI: "Wisconsin",
    AB: "Alberta",
    ON: "Ontario",
    QC: "Quebec",
  };
  return location.replace(
    /,\s*([A-Z]{2})(?=(?:\s+\d{5}(?:-\d{4})?)?(?:\s*,|$))/g,
    (match, abbreviation) => `, ${regionNames[abbreviation] || abbreviation}`,
  );
}

function directoryProfileCard(entry, index = 0) {
  const categories = directoryEffectiveCategories(entry.categories);
  const searchText = [
    entry.title,
    entry.organization,
    entry.coverage,
    entry.address,
    entry.mode,
    entry.summary,
    entry.useWhen,
    ...entry.categories,
  ]
    .filter(Boolean)
    .join(" ");
  const region = directoryRegion(entry);
  const asset =
    entry.asset || directoryCardImages[index % directoryCardImages.length];
  const alt =
    entry.asset && !entry.representativeImage
      ? `${entry.title} published profile image`
      : `Real dog-care photograph accompanying the ${entry.title} directory profile`;
  return `<article class="care-directory-profile" data-directory-item data-directory-profile data-search="${escapeHtml(searchText)}" data-categories="${escapeHtml(categories.join("|"))}" data-region="${escapeHtml(region)}">
    <figure class="care-directory-profile-image"><a href="${escapeHtml(entry.url)}" target="_blank" rel="noreferrer">${image(asset, alt, { eager: index < 12 })}</a></figure>
    <div class="care-directory-profile-copy">
      <p class="care-directory-source-label">${escapeHtml(directoryCategoryLabel(entry.categories[0]))}</p>
      <h3>${escapeHtml(entry.title)}</h3>
      ${entry.organization && entry.organization !== entry.title ? `<p class="care-directory-organization">${escapeHtml(entry.organization)}</p>` : ""}
      <p class="care-directory-location">${escapeHtml(entry.address || entry.coverage)}</p>
      <p class="care-directory-fit">${escapeHtml(entry.useWhen)}</p>
      <a class="text-link" href="${escapeHtml(entry.url)}" target="_blank" rel="noreferrer">View profile →</a>
    </div>
  </article>`;
}

function directoryResourceCard(entry, index = 0) {
  const categories = directoryEffectiveCategories(entry.categories);
  const searchText = [
    entry.title,
    entry.organization,
    entry.coverage,
    entry.mode,
    entry.summary,
    entry.useWhen,
    ...entry.categories,
  ]
    .filter(Boolean)
    .join(" ");
  const asset = directoryCardImages[index % directoryCardImages.length];
  return `<article class="care-directory-profile care-directory-resource" data-directory-item data-directory-profile data-directory-resource data-search="${escapeHtml(searchText)}" data-categories="${escapeHtml(categories.join("|"))}" data-region="all">
    <figure class="care-directory-profile-image"><a href="${escapeHtml(entry.url)}" target="_blank" rel="noreferrer">${image(asset, `Dog-care image accompanying ${entry.title}`)}</a></figure>
    <div class="care-directory-profile-copy"><p class="care-directory-source-label">${escapeHtml(entry.sourceType)}</p>
    <h3>${escapeHtml(entry.title)}</h3><p class="care-directory-organization">${escapeHtml(entry.organization)}</p>
    <p class="care-directory-location">${escapeHtml(entry.coverage)} · ${escapeHtml(entry.mode)}</p>
    <p class="care-directory-fit">${escapeHtml(entry.useWhen)}</p>
    <a class="text-link" href="${escapeHtml(entry.url)}" target="_blank" rel="noreferrer">Open directory →</a></div>
  </article>`;
}

function legacyFindCarePageV3() {
  const problemFilters = [
    ["all", "Show all care"],
    ["senior-veterinarians", "A new or repeating change"],
    ["pain-mobility-rehab", "Pain or movement"],
    ["emergency-vets", "Urgent symptoms"],
    ["specialty-hospitals", "A specialist referral"],
    ["hospice-palliative-care", "Comfort and quality of life"],
    ["in-home-euthanasia", "Planning a goodbye"],
    ["grief-counselors", "Grief support"],
  ];
  return page({
    route: "/find-care/",
    title: "Find Senior-Dog Care",
    description:
      "Search source-labeled senior-dog care profiles and official directories by problem, care type, provider, or location.",
    bodyClass: "care-page care-directory-page",
    body: `
    <section class="find-care-hero"><div class="find-care-hero-copy"><h1>Find the right care for your senior dog.</h1><p>Search real clinics, specialists, support programs, and official directories by problem or location.</p><div class="care-directory-controls" data-directory-controls><label><span>Search by provider, city, or concern</span><input type="search" data-directory-search placeholder="Try “mobility,” “Philadelphia,” or “grief”"></label><label><span>Care type</span><select data-directory-category><option value="all">All care types</option>${directoryCategories.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join("")}</select></label></div><p class="care-directory-summary"><strong data-directory-results-count>${directoryProfiles.length + directoryResources.length} results</strong> · ${directoryProfiles.length} source-labeled profiles · ${directoryResources.length} official search tools</p></div><figure>${image("real-senior-care-at-home.jpg", "Senior dog resting comfortably at home while a family considers care options", { eager: true })}</figure></section>
    <section class="care-directory-emergency" id="emergency"><div>${icon("care")}<div><h2>Some signs cannot wait for a directory search.</h2><p>Breathing trouble, collapse, repeated unproductive retching, inability to urinate, seizure, severe bleeding, or sudden inability to stand needs immediate veterinary help. Call an emergency hospital while preparing to travel.</p></div><button type="button" data-directory-filter="emergency-vets">Show emergency options</button></div></section>
    <section class="section care-directory-problems"><div class="wrap"><h2>What kind of help do you need?</h2><div class="care-directory-problem-filters" role="group" aria-label="Filter by senior-dog care need">${problemFilters.map(([value, label], index) => `<button${value === "hospice-palliative-care" ? ' id="hospice"' : value === "grief-counselors" ? ' id="grief"' : ""} type="button" data-directory-filter="${escapeHtml(value)}" aria-pressed="${index === 0 ? "true" : "false"}">${escapeHtml(label)}</button>`).join("")}</div></div></section>
    <section class="section no-top care-directory-results" id="directory-profiles"><div class="wrap"><header class="care-directory-section-heading"><div><h2>Care teams and specialists you can check now.</h2><p>Every profile shows its published location, access route, phone number, and official source.</p></div><strong data-directory-profile-count>${directoryProfiles.length} profiles</strong></header><div class="care-directory-profile-grid">${directoryProfiles.map(directoryProfileCard).join("")}</div><p class="care-directory-empty" data-directory-profile-empty hidden>No source-labeled profile matches this search. Try the official directories below.</p></div></section>
    <section class="section warm-panel care-directory-resources" id="official-resources"><div class="wrap"><header class="care-directory-section-heading"><div><h2>Search beyond these profiles.</h2><p>Use official professional locators, university programs, support services, and specialist directories to find more options.</p></div><strong data-directory-resource-count>${directoryResources.length} resources</strong></header><div class="care-directory-resource-grid">${directoryResources.map(directoryResourceCard).join("")}</div><p class="care-directory-empty" data-directory-resource-empty hidden>No official resource matches this search. Clear the filter to see every option.</p></div></section>
    <section class="section care-directory-trust"><div class="wrap"><div class="care-directory-trust-card">${icon("proof")}<div><h2>Check the current source before you rely on a listing.</h2><p>These profiles and resources are source-labeled, not verified or endorsed by WoafyPet. Confirm credentials, hours, prices, referral requirements, service area, and availability directly. Profile photos are shown for this preview from the organizations’ published pages; production permissions still require review.</p></div></div></div></section>
    <section class="section warm-panel" id="list-your-practice"><div class="wrap form-copy-grid"><div><h2>List your practice inside Find Care.</h2><p>Help pet owners understand who you serve, what care you provide, and how to reach you.</p></div>${providerInquiryForm()}</div></section>`,
  });
}

function findCarePage() {
  const regions = [
    ...new Set(
      directoryProfiles
        .map(directoryRegion)
        .filter((region) => region && region !== "Other"),
    ),
  ].sort();
  const careTypes = [
    ["all", "All care"],
    ["senior-veterinarians", "Veterinarians"],
    ["pain-mobility-rehab", "Mobility & rehabilitation"],
    ["emergency-vets", "Emergency care"],
    ["hospice-palliative-care", "Hospice & comfort"],
    ["grief-counselors", "Grief support"],
  ];
  return page({
    route: "/find-care/",
    title: "Find Dog Care Near You",
    description:
      "Explore real provider profiles and official care directories by care type and region.",
    bodyClass: "care-page care-directory-page care-directory-v5",
    body: `
    <section class="find-care-v5-hero"><div><h1>Find the care your dog needs.</h1><p>Choose the service and region. Open a provider or directory directly.</p><div class="care-directory-controls" data-directory-controls><label><span>Care type</span><select data-directory-category>${careTypes.map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select></label><label><span>State or region</span><select data-directory-region><option value="all">All regions</option>${regions.map((region) => `<option value="${escapeHtml(region)}">${escapeHtml(region)}</option>`).join("")}</select></label></div></div><figure>${image("guide-vet-care-brown-dog.jpg", "Dog receiving attentive veterinary care", { eager: true })}</figure></section>

    <section class="care-directory-results" id="directory-profiles"><header class="care-directory-section-heading"><div><h2>Care teams and directories.</h2><p>Choose the option that fits, then confirm details on its official page.</p></div></header><div class="care-directory-profile-grid">${directoryProfiles.map(directoryProfileCard).join("")}${directoryResources.map(directoryResourceCard).join("")}</div><p class="care-directory-empty" data-directory-profile-empty hidden>No option matches both selections. Try all regions.</p><button class="button secondary care-directory-more" type="button" data-directory-load-more>Search more →</button></section>

    <section class="practice-listing-v4" id="list-your-practice"><figure>${image("real-companion-moment.jpg", "Caregiver sitting with a dog while considering the right support")}</figure><div><header><h2>Help the right pet owners find your practice.</h2><p>Tell families who you help, where you serve, and the best first step to reach you.</p></header>${providerInquiryForm()}</div></section>`,
  });
}

function legacyPetLossPageV3() {
  const steps = [
    [
      "Record today’s reality",
      "Write appetite, water, breathing, mobility, sleep, bathroom comfort, anxiety, and the routines your dog still enjoys. Note what changed and when.",
    ],
    [
      "Call the right team",
      "Ask your primary veterinarian who handles urgent changes, after-hours questions, hospice, home visits, and euthanasia planning. Save the numbers where the family can find them.",
    ],
    [
      "Make a one-week comfort plan",
      "Confirm medicines, food and water access, toileting, safe movement, sleep, anxiety, and the exact signs that mean the plan needs review.",
    ],
    [
      "Prepare for the appointment",
      "Ask what will happen before, during, and after; who may be present; whether home or clinic care is available; and what your family wants to bring.",
    ],
    [
      "Confirm aftercare without pressure",
      "Discuss transport, identity handling, cremation or burial options, return timing, costs, and whether you want a paw print, fur clipping, or private time.",
    ],
    [
      "Protect the first 72 hours",
      "Choose who will tell others, pause nonessential decisions, plan for children or other animals, keep simple food and support nearby, and know who to call if grief feels unsafe.",
    ],
  ];
  return page({
    route: "/pet-loss-support/",
    title: "Pet Loss Support",
    description:
      "A specific six-step guide for anticipatory pet loss, comfort planning, appointments, aftercare, and the first 72 hours.",
    bodyClass: "loss-page",
    body: `
    <section class="loss-hero"><figure>${image("real-pet-loss-support.jpg", "Caregiver sharing a quiet moment with a beloved dog", { eager: true })}</figure><div><span class="eyebrow">PET LOSS SUPPORT</span><h1>You do not have to hold every next step at once.</h1><p>Use this six-step path to turn an overwhelming moment into the next kind, practical conversation. Nothing here sells a product or rushes a memorial decision.</p><div class="actions">${button("Start with today", "#step-1")}${button("Find professional support", "/find-care/#hospice", "secondary")}</div></div></section>
    <section class="section"><div class="wrap loss-intro">${sectionHeading("A PRACTICAL PATH", "Six steps, taken at your pace.", "You can start anywhere. If your dog is struggling now, contact a veterinary team before completing a worksheet.")}<aside><strong>Urgent changes</strong><p>Breathing trouble, collapse, uncontrolled pain, repeated seizures, severe bleeding, a swollen abdomen with distress, or inability to urinate needs immediate veterinary help.</p></aside></div><div class="wrap loss-steps">${steps.map(([title, copy], index) => `<article id="step-${index + 1}"><span>0${index + 1}</span><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(copy)}</p></div></article>`).join("")}</div></section>
    <section class="section soft-panel"><div class="wrap support-question-grid"><div>${sectionHeading("WORDS FOR THE HARD CALL", "You can read this aloud.", "Specific language can help when emotion makes it hard to begin.")}<blockquote>“My dog’s comfort has changed. I need help understanding what is urgent, what can be made easier today, and what choices we may need to prepare for.”</blockquote></div><div><h2>Questions to ask</h2><ul class="check-list"><li>What are you seeing that suggests comfort is changing?</li><li>What can we do today, and how will we know it helps?</li><li>Which signs mean we should call tonight?</li><li>Who can support us at home or after hours?</li><li>What will happen if we choose an appointment?</li></ul></div></div></section>
    <section class="section"><div class="wrap grief-boundary"><div>${icon("heart")}<h2>Grief support should be qualified and human.</h2><p>WoafyPet does not match grieving strangers as peer counselors and does not provide crisis counseling. Use credentialed grief support, your health professional, or emergency services when safety is at risk.</p></div>${button("Find grief support", "/find-care/#grief", "secondary")}</div></section>`,
  });
}

function petLossPage() {
  return page({
    route: "/pet-loss-support/",
    title: "Pet Loss Support",
    description:
      "A compassionate, practical path for comfort planning, goodbye decisions, aftercare, and the first days of grief.",
    bodyClass: "loss-page loss-v4",
    body: `
    <section class="loss-v4-hero"><div><h1>You can love them deeply—and still need help with what comes next.</h1><p>Start with the moment you are in. Make today more comfortable, prepare the questions that matter, and take the next decision one step at a time.</p><a class="button primary" href="#loss-path">Show me the next step →</a></div><figure>${image("real-pet-loss-support.jpg", "Caregiver holding a beloved dog close", { eager: true })}</figure></section>

    <section class="loss-v4-pathways" id="loss-path"><header><h2>Choose the help you need today.</h2></header><div><a href="#comfort-today"><figure>${image("real-companion-moment.jpg", "Caregiver sitting close to a dog at home")}</figure><span><strong>My dog is still here</strong><p>Make a one-week comfort plan and know which changes mean call now.</p></span></a><a href="#prepare-goodbye"><figure>${image("real-comfort-hug.jpg", "Caregiver holding a dog in a comforting embrace")}</figure><span><strong>We may be preparing for goodbye</strong><p>Know what to ask before, during, and after the appointment.</p></span></a><a href="#first-days"><figure>${image("real-holding-dog.jpg", "Caregiver holding a dog with tenderness")}</figure><span><strong>We are in the first days after</strong><p>Handle aftercare, family communication, and grief without carrying everything alone.</p></span></a></div></section>

    <section class="loss-v4-step" id="comfort-today"><figure>${image("real-home-owner-dog.jpg", "Dog resting near a caregiver at home")}</figure><div><h2>Make today gentler.</h2><ol><li><strong>Write today’s reality.</strong><span>Food, water, breathing, mobility, sleep, bathroom comfort, anxiety, and the routines still enjoyed.</span></li><li><strong>Call the right team.</strong><span>Save the primary, after-hours, hospice, and home-visit numbers where everyone can reach them.</span></li><li><strong>Make a one-week comfort plan.</strong><span>Confirm medicine, meals, toileting, safe movement, sleep, anxiety, and the signs that trigger a recheck.</span></li></ol><a href="/find-care/?care=hospice-palliative-care">Find hospice and comfort care →</a></div></section>

    <section class="loss-v4-step reverse" id="prepare-goodbye"><figure>${image("guide-vet-care-brown-dog.jpg", "Dog receiving calm veterinary care")}</figure><div><h2>Know what will happen before the day arrives.</h2><ol><li><strong>Ask about the appointment.</strong><span>Where it can happen, who may be present, how comfort is protected, and what your family may bring.</span></li><li><strong>Choose aftercare without pressure.</strong><span>Transport, identity handling, cremation or burial, return timing, cost, paw print, fur clipping, and private time.</span></li><li><strong>Decide who will carry each task.</strong><span>One person for the clinic, one for family updates, and one for children or other animals.</span></li></ol></div></section>

    <section class="loss-v4-call"><div><h2>Words for the call when words are hard.</h2><blockquote>“My dog’s comfort has changed. Please help me understand what can be made easier today, what may be urgent, and what choices we should prepare for.”</blockquote></div><ul><li>What tells you comfort is changing?</li><li>What can we do today, and how will we know it helped?</li><li>Which signs mean call tonight?</li><li>What happens before, during, and after the appointment?</li></ul></section>

    <section class="loss-v4-step" id="first-days"><figure>${image("real-golden-outdoors.jpg", "Golden retriever remembered outdoors")}</figure><div><h2>Protect the first 72 hours.</h2><ol><li><strong>Pause decisions that can wait.</strong><span>Food, rest, and one trusted person matter more than answering every message.</span></li><li><strong>Give grief somewhere to go.</strong><span>Write one memory, keep one familiar object nearby, or tell the story to someone who will listen.</span></li><li><strong>Reach for real support.</strong><span>Use a pet-loss counselor, veterinary social worker, group, or trusted clinician when the weight feels too heavy.</span></li></ol><a class="button secondary" href="/find-care/?care=grief-counselors">Find pet-loss support →</a></div></section>`,
  });
}

function legacyMemorialPageV3() {
  const fields = [
    field.name,
    field.email,
    field.zip,
    '<label><span>Timing</span><select name="timing" required><option value="">Choose one</option><option>Planning ahead</option><option>Remembering a pet</option><option>Considering a tribute gift</option></select></label>',
    '<label class="field-wide"><span>What should the tribute carry forward? <em>(optional)</em></span><textarea name="meaning" maxlength="600" placeholder="A name, place, season, or memory that matters"></textarea></label>',
  ];
  return page({
    route: "/memorial-tree/",
    title: "Memorial Tree",
    description:
      "Explore a transparent living memorial-tree request with partner, species, location, timing, care, and proof standards shown before activation.",
    bodyClass: "memorial-page",
    body: `
    <section class="hero inner-hero memorial-hero"><div class="hero-copy"><span class="status planned">LIVING TRIBUTE · PARTNER REVIEW</span><h1>A tree should honor a life—not rush a decision.</h1><p class="lead">We are keeping the memorial-tree idea as a transparent request service. It will activate only when planting partner, location, species, stewardship, timing, and proof can be shown clearly.</p><div class="actions">${button("See the transparency standard", "#tree-standard")}${button("Preview a tribute request", "#tree-request", "secondary")}</div></div><figure class="hero-media">${image("real-memorial-tree-planting.jpg", "Hands planting a young memorial tree", { eager: true })}</figure></section>
    <section class="section" id="tree-standard"><div class="wrap">${sectionHeading("BEFORE ANY REQUEST IS ACCEPTED", "Seven facts, visible first.", "A meaningful story is not enough. The service must make the real planting and stewardship understandable.", "center")}<div class="gate-grid memorial-gates"><article><span>01</span><h3>Planting partner</h3><p>The organization responsible, with a direct source and current contact details.</p></article><article><span>02</span><h3>Location</h3><p>Country, region, land context, and whether an exact site can be shared.</p></article><article><span>03</span><h3>Species</h3><p>Native or suitable species and why it belongs in that ecology.</p></article><article><span>04</span><h3>Timing</h3><p>Expected planting window and what happens if season or conditions change.</p></article><article><span>05</span><h3>Stewardship</h3><p>Who tends the planting and how loss or replacement is handled.</p></article><article><span>06</span><h3>Proof</h3><p>What confirmation the family receives and what it can truthfully establish.</p></article><article><span>07</span><h3>Use of funds</h3><p>A plain explanation of partner, administration, and program costs before activation.</p></article></div></div></section>
    <section class="section warm-panel"><div class="wrap form-media-grid"><figure>${image("real-memorial-tree-planting.jpg", "Hands planting a young tree")}</figure>${previewForm({ id: "tree-request", title: "Preview a living-tribute request.", copy: "No partner has been presented as active in this rebuild, so this preview accepts no payment or live request.", fields, submit: "Preview tribute request" })}</div></section>
    <section class="section"><div class="wrap care-callout"><div>${icon("heart")}<h2>Care and aftercare can come first.</h2><p>If the immediate need is hospice, an appointment, aftercare coordination, or grief support, begin there. A tree can wait.</p></div>${button("Open pet loss support", "/pet-loss-support/", "secondary")}</div></section>`,
  });
}

function memorialPage() {
  return page({
    route: "/memorial-tree/",
    title: "Plant a Memorial Tree",
    description:
      "Create a living tribute that carries your dog’s name, story, and love forward.",
    bodyClass: "memorial-page memorial-v4",
    body: `
    <section class="memorial-v5-hero"><div><h1>Let their love keep growing.</h1><p>Plant a living tribute for the dog who made ordinary days unforgettable.</p><button class="button primary" type="button" data-tree-purchase-open>Plant a tree in their name →</button></div><figure>${image("real-golden-forest.jpg", "Golden retriever remembered among trees", { eager: true })}</figure></section>

    <section class="memorial-v5-partner"><figure>${image("real-memorial-tree-planting.jpg", "Hands placing a young tree into the earth", { eager: true })}</figure><div><h2>Planted with Usambara.</h2><p>Each memorial supports a real tree planting with our Usambara partner—turning one beloved life into new growth.</p><div><span>${icon("tree")}Tree planted</span><span>${icon("heart")}Your dog’s name remembered</span><span>${icon("proof")}Planting confirmation shared</span></div></div></section>

    <section class="memorial-v5-story"><div><h2>Keep the part of them that still lives in you.</h2><blockquote>“You were home, joy, and the best part of every ordinary day.”</blockquote><p>Add their name and one memory. We will carry those words into the memorial confirmation your family can keep.</p><button class="button secondary" type="button" data-tree-purchase-open>Create their living tribute →</button></div><figure>${image("real-golden-outdoors.jpg", "Golden retriever remembered in a favorite outdoor place", { eager: true })}</figure></section>

    <section class="memorial-v5-flow"><h2>One loving action. Three simple steps.</h2><div><article><strong>1</strong><span>Share their name and memory.</span></article><article><strong>2</strong><span>Confirm the memorial planting.</span></article><article><strong>3</strong><span>Receive the tribute details.</span></article></div></section>

    <dialog class="tree-purchase-dialog" data-tree-purchase><button type="button" class="tree-dialog-close" data-tree-purchase-close aria-label="Close">×</button><div><h2>Plant their memorial tree.</h2><p class="tree-price">$10 per tree</p><p>Tell us who you are remembering. The price appears here only after you choose to plant.</p><form class="preview-form memorial-v5-form" data-preview-form data-form-title="Memorial tree order"><div class="form-grid"><label><span>Your name</span><input name="name" autocomplete="name" maxlength="100" required></label><label><span>Email</span><input name="email" type="email" autocomplete="email" maxlength="254" required></label><label><span>Your dog’s name</span><input name="petName" maxlength="80" required></label><label class="field-wide"><span>One memory to carry forward</span><textarea name="meaning" maxlength="600" required></textarea></label></div><button class="button primary" type="submit">Continue with this memorial — $10 <span aria-hidden="true">→</span></button><p class="form-note" data-form-note role="status" aria-live="polite"></p></form></div></dialog>`,
  });
}

function legacyWednesdayPage() {
  const fields = [
    field.name,
    field.email,
    field.zip,
    '<label><span>What are you navigating?</span><select name="issue" required><option value="">Choose the closest issue</option><option>Mobility or stiffness</option><option>Sleep or nighttime changes</option><option>Appetite or weight</option><option>Drinking or bathroom changes</option><option>Cognitive or sensory changes</option><option>General senior-care routines</option></select></label>',
    '<label><span>Travel radius</span><select name="radius" required><option value="">Choose one</option><option>Up to 5 miles</option><option>Up to 10 miles</option><option>Up to 25 miles</option></select></label>',
    '<label><span>Availability</span><select name="availability" required><option value="">Choose one</option><option>Weekday morning</option><option>Weekday evening</option><option>Weekend morning</option><option>Weekend afternoon</option></select></label>',
    '<label><span>Preferred first contact</span><select name="goal" required><option value="">Choose one</option><option>Owner-only phone call</option><option>Coffee or conversation</option><option>Public parallel walk later</option></select></label>',
    '<label><span>Dog age and size</span><input name="dogContext" maxlength="120" required></label>',
    '<label><span>Dog pace or mobility</span><select name="pace" required><option value="">Choose one</option><option>Very gentle or limited</option><option>Easy, short outings</option><option>Moderate walking pace</option></select></label>',
    '<label class="field-wide"><span>Safety or access note <em>(optional)</em></span><textarea name="safety" maxlength="500"></textarea></label>',
  ];
  return page({
    route: "/wednesday-introductions/",
    title: "Wednesday Owner Introductions",
    description:
      "Meet a local senior-dog owner navigating a similar issue through a small, private, double-opt-in introduction service.",
    bodyClass: "wednesday-page",
    body: `
    <section class="hero inner-hero wednesday-hero"><div class="hero-copy"><span class="status editorial">SMALL PRIVATE BETA</span><h1>Meet one local owner who understands the issue.</h1><p class="lead">Tell us what your senior dog is experiencing. Requests are considered on Wednesdays, and contact is shared only when both people opt in.</p><div class="actions">${button("Request an introduction", "#introduction-request")}</div><p class="quiet-note">No profiles, swiping, chat, public match score, or guaranteed introduction.</p></div><figure class="hero-media">${image("real-owner-match-walk.jpg", "Two dog owners meeting outdoors for a walk", { eager: true })}</figure></section>
    <section class="benefit-strip three"><article>${icon("notice")}<div><strong>Same issue first</strong><span>Mobility, sleep, appetite, bathroom, cognitive, or daily-care routines.</span></div></article><article>${icon("people")}<div><strong>Relevant local fit</strong><span>Location, schedule, goals, and access are considered together.</span></div></article><article>${icon("proof")}<div><strong>Private double opt-in</strong><span>Contact details stay private until both people accept.</span></div></article></section>
    <section class="section" id="process"><div class="wrap">${sectionHeading("FROM REQUEST TO A REAL CONVERSATION", "One thoughtful local introduction, five clear steps.", "The service stays deliberately small so each introduction can be declined privately and followed up with care.", "center")}<div class="process-grid"><article><span>01</span><h3>Share the issue</h3><p>Choose the closest care issue and share only the minimum local, schedule, dog, and access context.</p></article><article><span>02</span><h3>Private fit check</h3><p>Issue, geography, availability, owner goal, pace, and clear exclusions are considered together.</p></article><article><span>03</span><h3>Anonymized offer</h3><p>Each person sees a short non-identifying summary and may decline without explanation or penalty.</p></article><article><span>04</span><h3>Double opt-in</h3><p>Contact details are shared only after both people independently accept the introduction.</p></article><article><span>05</span><h3>Owner-first contact</h3><p>Start with a call, coffee, or public conversation. Dogs may join a later public parallel walk.</p></article><article><span>06</span><h3>Private follow-up</h3><p>Tell us whether the contact happened, felt safe, and was genuinely useful.</p></article></div></div></section>
    <section class="section proof-band"><div class="wrap safety-grid"><div>${sectionHeading("SAFETY & SCOPE", "A thoughtful introduction—not a promise of compatibility.", "WoafyPet does not perform background checks and does not provide medical, behavioral, dating, counseling, grief-matching, or crisis services.")}<ul class="check-list"><li>Adults only; no public profiles or precise home address</li><li>Owner-only first contact; daylight and public if meeting in person</li><li>Separate transport, easy exit, and no private-home or private-yard recommendation</li><li>Either person can decline, block, or report a concern privately</li><li>No contact sharing until both people independently say yes</li></ul></div><aside class="capacity-card"><span class="eyebrow">CURRENT CAPACITY</span><strong>3</strong><h2>pair offers at most each Wednesday</h2><p>A city opens only when there is enough local interest for a meaningful same-issue review.</p><span class="status planned">WAITLIST PREVIEW</span></aside></div></section>
    <section class="section"><div class="wrap form-copy-grid"><div>${sectionHeading("REQUEST AN INTRODUCTION", "Give us enough context to look for a relevant fit.", "This private preview does not send or retain responses. The active beta will use separate matching, research, and marketing consent.")}<div class="boundary-note"><strong>What success means</strong><span>Both people opt in, make contact, and say the conversation felt safe and useful—not simply that a match was offered.</span></div><div class="editorial-checklist"><article><span>01</span><div><h3>Your issue leads</h3><p>We begin with the senior-dog care change you are navigating, then check location and timing.</p></div></article><article><span>02</span><div><h3>You stay in control</h3><p>See an anonymized summary first and decline without having to explain.</p></div></article><article><span>03</span><div><h3>First contact stays simple</h3><p>Use an owner-only call or public conversation before considering a dog walk.</p></div></article></div></div>${previewForm({ id: "introduction-request", title: "Preview the introduction request.", copy: "Both people must opt in before any contact details would be shared.", fields, submit: "Preview introduction request" })}</div></section>`,
  });
}

function legacyWednesdayPageV3() {
  return page({
    route: "/wednesday-introductions/",
    title: "Wednesday Owner Introductions",
    description:
      "Request a private, double-opt-in introduction to a nearby senior-dog owner who understands the same challenge.",
    bodyClass: "wednesday-page match-v3",
    body: `
    <section class="match-v3-hero"><div class="match-v3-hero-copy"><h1>Meet one person who understands this exact worry.</h1><p class="lead">Tell us what your senior dog is going through. When a nearby owner is facing the same issue, WoafyPet can offer a private introduction. Contact is shared only after both people say yes.</p>${button("Request my introduction", "#introduction-request")}<p class="match-v3-trust">No public profile. No swiping. No contact shared without permission.</p></div><figure>${image("community-owner-match.jpg", "Two dog owners meeting with a dog in a calm public outdoor place", { eager: true })}</figure></section>

    <section class="match-v3-example"><div class="wrap"><h2>What a useful match can give you.</h2><div class="match-v3-example-grid"><article><figure>${image("problem-daily-routine-senior-dark-dog.jpg", "Senior dark-coated dog whose changed nighttime routine concerns the family")}</figure><div><h3>You are facing</h3><p>2 a.m. pacing, broken sleep, and no one nearby who understands why it feels so heavy.</p></div></article><article><figure>${image("guide-observe-beagle-owner.jpg", "Caregiver sitting beside a dog during a familiar home routine")}</figure><div><h3>You meet</h3><p>One nearby owner managing the same nighttime pattern.</p></div></article><article><figure>${image("community-owner-match.jpg", "Dog owners meeting in a calm public outdoor place")}</figure><div><h3>You leave with</h3><p>Routines to compare, better questions for your care team, and someone who understands the emotional load.</p></div></article></div><p>Owner experience—not medical advice.</p></div></section>

    <section class="section match-v3-relevance"><div class="wrap match-v3-relevance-grid"><div><h2>Matched on the part that matters.</h2><p>Some people need practical routines. Some need to say “this is hard” to someone who will not minimize it. Tell us what would make the conversation useful; that goal is part of the fit.</p><div class="match-v3-relevance-points"><article><h3>The same senior-dog issue</h3></article><article><h3>Close enough to connect</h3></article><article><h3>The same kind of conversation</h3></article><article><h3>A pace and format that feel safe</h3></article></div></div><figure>${image("real-care-circle-owner-dog.jpg", "Dog owner sitting closely with a senior dog at home")}</figure></div></section>

    <section class="section match-v3-flow"><div class="wrap"><header><h2>How a Wednesday introduction works.</h2></header><div class="match-v3-flow-grid"><article><h3>Send your request</h3><p>Share the issue, your ZIP, and what kind of conversation would help.</p></article><article><h3>Review a private fit</h3><p>If a suitable request exists, each person receives a short summary without names or contact details.</p></article><article><h3>Both choose</h3><p>Only after two independent yeses are contact details shared.</p></article></div></div></section>

    <section class="section match-v3-safety"><div class="wrap match-v3-safety-grid"><figure>${image("real-owner-match-walk.jpg", "Two dog owners walking together in a public outdoor place")}</figure><div><h2>Start with the people. Add the dogs later.</h2><p>Begin with a phone call or public coffee. If both people later want a walk, meet in daylight, use separate transport, keep an easy exit, and let the dogs stay apart until everyone is comfortable.</p><p>WoafyPet does not perform background checks and this is not medical, behavioral, counseling, dating, grief-matching, or crisis support.</p></div></div></section>

    <section class="section match-v3-request"><div class="wrap"><header><h2>Who would help you feel understood?</h2><p>Give us enough to recognize a meaningful fit—nothing more.</p></header><form class="match-v3-form preview-form" id="introduction-request" data-preview-form data-form-title="Wednesday owner introduction"><div class="match-v3-form-grid"><label><span>Name</span><input name="name" autocomplete="name" maxlength="100" required></label><label><span>Email address</span><input name="email" type="email" autocomplete="email" maxlength="254" required></label><label><span>ZIP or postal code</span><input name="zip" autocomplete="postal-code" maxlength="20" required></label><label><span>What are you living through?</span><select name="issue" required><option value="">Choose one</option><option>Mobility or stiffness</option><option>Restless nights</option><option>Eating, drinking, or weight</option><option>Bathroom changes</option><option>Less interest or cognitive change</option><option>The daily weight of senior-dog care</option></select></label><label><span>What would make the conversation useful?</span><select name="goal" required><option value="">Choose one</option><option>Compare daily routines</option><option>Prepare better care-team questions</option><option>Share local support or access tips</option><option>Talk with someone who understands</option></select></label><label><span>How would you prefer to start?</span><select name="contact" required><option value="">Choose one</option><option>Owner-only phone call</option><option>Coffee in a public place</option><option>Either is comfortable</option></select></label><label class="field-wide"><span>A little context about your dog (optional)</span><textarea name="dogContext" maxlength="360" placeholder="Age, size, pace, and the part that has felt hardest"></textarea></label></div><label class="consent-row"><input type="checkbox" name="matchingConsent" required><span>Use these details only to consider an introduction. Contact is shared only after a separate yes from both people.</span></label><button class="button primary" type="submit">Request my introduction <span aria-hidden="true">→</span></button><p class="form-note" data-form-note role="status">Preview only—no information is sent or stored.</p></form></div></section>`,
  });
}

function wednesdayPage() {
  return page({
    route: "/wednesday-introductions/",
    title: "Meet an Owner Who Understands",
    description:
      "Request an offline introduction to a nearby dog owner facing the same care challenge.",
    bodyClass: "wednesday-page match-v4",
    body: `
    <section class="match-v4-hero"><div><h1>Meet someone who knows this exact kind of day.</h1><p>We introduce you to one nearby dog owner facing the same issue—so you can compare routines, share what has helped, and feel less alone.</p><a class="button primary" href="#introduction-request">Find someone who understands →</a></div><figure>${image("community-owner-match.jpg", "Two dog owners connecting in a calm public outdoor place", { eager: true })}</figure></section>

    <section class="match-v4-flow"><figure>${image("real-owner-match-walk.jpg", "Dog owners walking together outdoors", { eager: true })}</figure><div><h2>Personal help, offline and close to home.</h2><ol><li><strong>Tell us what’s going on.</strong><span>Share the issue and the kind of conversation that would help.</span></li><li><strong>We find the closest fit.</strong><span>We look at the care challenge, location, schedule, and pace.</span></li><li><strong>You choose whether to connect.</strong><span>Start with a call, coffee, or calm public walk.</span></li></ol></div></section>

    <section class="match-v4-issues"><header><h2>Find someone facing the same issue.</h2></header><div><article><figure>${image("problem-mobility-senior-lab.jpg", "Senior Labrador experiencing mobility changes", { eager: true })}</figure><h3>Mobility & stiffness</h3></article><article><figure>${image("problem-restless-night-senior-black-lab.jpg", "Older Labrador resting at night", { eager: true })}</figure><h3>Restless nights</h3></article><article><figure>${image("problem-appetite-owner-and-dogs.jpg", "Caregiver supporting dogs around mealtime", { eager: true })}</figure><h3>Eating & weight</h3></article><article><figure>${image("problem-daily-routine-senior-dark-dog.jpg", "Senior dog experiencing routine changes", { eager: true })}</figure><h3>Daily care & connection</h3></article></div></section>

    <section class="match-v4-result"><div><h2>Leave with a useful next step.</h2><p>Compare a routine, share a local resource, or prepare a clearer question for your veterinarian.</p></div><figure>${image("real-care-circle-owner-dog.jpg", "Dog owner sharing a close moment with a dog at home", { eager: true })}</figure></section>

    <section class="match-v4-request" id="introduction-request"><header><h2>Who would help you feel understood?</h2></header><form class="match-v3-form preview-form" data-preview-form data-form-title="Wednesday owner introduction"><div class="match-v3-form-grid"><label><span>Name</span><input name="name" autocomplete="name" maxlength="100" required></label><label><span>Email</span><input name="email" type="email" autocomplete="email" maxlength="254" required></label><label><span>ZIP or postal code</span><input name="zip" autocomplete="postal-code" maxlength="20" required></label><label><span>Your dog’s age</span><select name="dogAge" required><option value="">Choose one</option><option>Under 1 year</option><option>1–3 years</option><option>4–6 years</option><option>7–9 years</option><option>10–12 years</option><option>13–15 years</option><option>16+ years</option></select></label><label><span>What are you navigating?</span><select name="issue" required><option value="">Choose one</option><option>Mobility or stiffness</option><option>Restless nights</option><option>Eating, drinking, or weight</option><option>Bathroom changes</option><option>Less interest or cognitive change</option><option>Daily care and caregiver stress</option><option>Other</option></select></label><label><span>How would you like to start?</span><select name="contact" required><option value="">Choose one</option><option>Owner-only phone call</option><option>Coffee in a public place</option><option>Calm public walk</option><option>Open to any of these</option></select></label><label class="field-wide"><span>What would make the conversation useful?</span><textarea name="dogContext" maxlength="360" placeholder="The issue, routine, or question you hope to share"></textarea></label></div><button class="button primary" type="submit">Request My Introduction <span aria-hidden="true">→</span></button><p class="form-note" data-form-note role="status" aria-live="polite"></p></form></section>`,
  });
}

function aboutPage() {
  return page({
    route: "/about/",
    title: "Our Story",
    description:
      "Meet Bobby and the comfort-first reason WoafyPet is building a supportive smart bed for senior dogs.",
    bodyClass: "about-page",
    body: `
    <section class="story-hero"><figure>${image("bobby.jpg", "Bobby, Robert's Alaskan Malamute", { eager: true })}</figure><div><span class="eyebrow">BOBBY’S STORY</span><h1>The bed we wish existed sooner.</h1><p>Bobby was Robert’s Alaskan Malamute: a loved family dog, not a case study. In his later season, the cold floor, slower rise, and longer recovery were easy to explain away one at a time.</p></div></section>
    <section class="section"><div class="wrap story-body"><div><p class="drop-cap">At first, the changes were easy to make small. Bobby chose the cool floor more often. He took a little longer to settle after moving. After a good outing, he sometimes needed more time before he looked comfortable again.</p><p>None of those moments felt dramatic enough to stop the day over, and he still had the parts of himself everyone loved: a greeting, an appetite, a bright afternoon, a familiar way of asking to be near his people.</p><p>The lesson was not that a device should have diagnosed Bobby. It was that a better place to rest and a clearer record of repeated change could have supported earlier, more specific conversations.</p></div><blockquote>Comfort should come first. Context should make the family calmer and more prepared—not more afraid.</blockquote></div></section>
    <section class="section warm-panel"><div class="wrap">${sectionHeading("WHAT BOBBY’S STORY CHANGES", "Four rules for the company we are building.", "These rules are more important than a feature list.", "center")}<div class="boundary-grid"><article><span>01</span><h3>The bed must work as a bed.</h3><p>Technology cannot compensate for an uncomfortable, hard-to-clean, poorly fitted product.</p></article><article><span>02</span><h3>A signal is not a diagnosis.</h3><p>Patterns can support attention and conversation without claiming to know the cause.</p></article><article><span>03</span><h3>Proof stays visible.</h3><p>Open questions, failed tests, and narrower claims belong in public updates.</p></article><article><span>04</span><h3>Care cannot become pressure.</h3><p>Education, grief support, memorials, and human connection stay free of aggressive sales tactics.</p></article></div></div></section>
    <section class="final-cta"><div><span class="eyebrow">THE NEXT CHAPTER</span><h2>Build slowly enough to deserve trust—and fast enough to learn.</h2><p>Start with the free guide or join a focused product-research group.</p></div><div class="actions">${button("Get the free guide", "/guide/", "light")}${button("Request founder access", "/support/#founder-access", "outline-light")}</div></section>`,
  });
}

function supportPage() {
  const contactFields = [
    field.name,
    field.email,
    '<label class="field-wide"><span>What do you need?</span><select name="topic" required><option value="">Choose one</option><option>Product research</option><option>Founder access</option><option>Guide or Care Library</option><option>Find Care listing</option><option>Wednesday introductions</option><option>Memorial tree</option><option>Something else</option></select></label>',
    '<label class="field-wide"><span>Your message</span><textarea name="message" maxlength="1200" required></textarea></label>',
  ];
  const founderFields = [
    field.name,
    field.email,
    field.zip,
    '<label><span>Dog age</span><input name="dogAge" maxlength="10" required></label>',
    '<label class="field-wide"><span>Which part matters most?</span><select name="interest" required><option value="">Choose one</option><option>The Full Smart Bed</option><option>Standalone Smart Base</option><option>The senior-dog guide</option><option>Care Circle lessons</option><option>1:1 owner introductions</option><option>Caregiver interview</option></select></label>',
    '<label class="field-wide"><span>What are you trying to make easier? <em>(optional)</em></span><textarea name="goal" maxlength="600"></textarea></label>',
  ];
  return page({
    route: "/support/",
    title: "Support & Founder Access",
    description:
      "Contact WoafyPet, request founder research access, or find the right route for product, education, care, memorial tree, and Wednesday pilot questions.",
    bodyClass: "support-page",
    body: `
    <section class="page-intro compact"><span class="eyebrow">SUPPORT</span><h1>Tell us what you are trying to make easier.</h1><p>Choose the clearest route for product, care, or community support.</p></section>
    <section class="section no-top"><div class="wrap support-route-grid"><a href="/smart-bed/"><span>01</span><h2>Understand the bed</h2><p>Construction, Smart Base, intended experience, and open product questions.</p></a><a href="/guide/"><span>02</span><h2>Use the free guide</h2><p>Track a change for seven days and prepare a clearer veterinary conversation.</p></a><a href="/find-care/"><span>03</span><h2>Find professional care</h2><p>Veterinary, mobility, emergency, hospice, and grief starting points.</p></a><a href="/pet-loss-support/"><span>04</span><h2>Navigate pet loss</h2><p>A specific six-step path without product or memorial pressure.</p></a></div></section>
    <section class="section warm-panel" id="founder-access"><div class="wrap form-copy-grid"><div>${sectionHeading("FOUNDER ACCESS", "Small research groups before any sale.", "Founder access means product interviews, prototype feedback, or a future controlled trial.")}</div>${previewForm({ id: "founder-request", title: "Request founder access.", copy: "Tell us which part of the system is most relevant to your dog and daily routine.", fields: founderFields, submit: "Request founder access" })}</div></section>
    <section class="section"><div class="wrap form-copy-grid reverse"><div>${sectionHeading("CONTACT", "A direct question deserves a direct route.", "Emergency and medical questions should go to an appropriate veterinary service, not a website form.")}<div class="urgent-inline"><strong>Do not wait for us in an emergency.</strong><p>Breathing trouble, collapse, repeated unproductive retching, inability to urinate, severe bleeding, seizures, or sudden inability to stand needs immediate veterinary help.</p></div></div>${previewForm({ id: "contact-request", title: "Send a support message.", copy: "Tell us what you need and how to reach you.", fields: contactFields, submit: "Send support message" })}</div></section>`,
  });
}

/*
 * WoafMeow editorial rebuild
 * The data model and interaction hooks above are intentionally preserved.
 * These final declarations replace the prototype templates with one shared
 * care-first system before the route table is evaluated.
 */

function header() {
  return `<header class="wm-header" data-header>
    <div class="wm-header-inner">
      <a class="wm-wordmark" data-logo-link href="/" aria-label="WoafMeow home">${image("woafmeow-logo-coral.png", "WoafMeow", { eager: true })}</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-navigation" data-menu-toggle><span></span><span></span><span></span><span class="sr-only">Open navigation</span></button>
      <nav class="wm-nav" id="site-navigation" aria-label="Primary navigation" data-site-nav>
        <details class="nav-group"><summary>Learn</summary><div class="nav-menu"><a href="/care-circle/"><strong>Care Circle</strong><span>Ask a question or browse complete lessons</span></a><a href="/guide/"><strong>Senior Dog Care Guide</strong><span>Know what to watch and do next</span></a><a href="/health-timeline/"><strong>Health Timeline</strong><span>Upload, organize and share records</span></a></div></details>
        <details class="nav-group"><summary>Find care</summary><div class="nav-menu"><a href="/find-care/"><strong>Find care</strong><span>Choose every care type in one place</span></a><a href="/find-care/#list-your-practice"><strong>List your practice</strong><span>Join the care directory</span></a></div></details>
        <details class="nav-group"><summary>Connect &amp; support</summary><div class="nav-menu"><a href="/wednesday-introductions/"><strong>Wednesday introductions</strong><span>Meet an owner who understands</span></a><a href="/pet-loss-support/"><strong>Pet loss support</strong><span>Specific help before and after goodbye</span></a><a href="/memorial-tree/"><strong>Memorial trees</strong><span>A living tribute in their name</span></a></div></details>
        <a class="wm-bed-link" href="/smart-bed/">WoafyPet Smart Bed</a>
        <a class="wm-login-link" href="/account/" data-account-link>Log in</a>
      </nav>
      <a class="wm-product-link" href="/account/?next=ask" data-account-create>Create account</a>
    </div>
  </header>`;
}

function footer() {
  return `<footer class="wm-footer">
    <div class="wm-footer-grid">
      <div class="wm-footer-brand"><a class="wm-wordmark" data-logo-mark href="/" aria-label="WoafMeow home">${image("woafmeow-logo-coral.png", "WoafMeow", { eager: true })}</a><p>Learn, connect and find support—so your dog's senior years can thrive.</p><strong class="wm-footer-trust">Trusted by 10,000+ pet owners.</strong></div>
      <div><h2>Learn</h2><a href="/care-circle/">All lessons</a><a href="/guide/">Senior Dog Care Guide</a><a href="/health-timeline/">Health Timeline</a><a href="/care-circle/">Care topics</a></div>
      <div><h2>Find Care</h2><a href="/find-care/">All care types</a><a href="/find-care/?care=senior-veterinarians">Veterinarians</a><a href="/find-care/#list-your-practice">List your practice</a></div>
      <div><h2>Connect</h2><a href="/wednesday-introductions/">Wednesday Introductions</a><a href="/account/">My account & dog profile</a></div>
      <div><h2>Support</h2><a href="/pet-loss-support/">Pet Loss Support</a><a href="/memorial-tree/">Memorial Tree</a><a href="/support/">Contact</a></div>
      <div><h2>About</h2><a href="/about/">Bobby’s story &amp; mission</a><a href="/support/">Contact</a></div>
    </div>
    <div class="wm-footer-bottom"><nav class="wm-footer-socials" aria-label="WoafMeow social media"><a href="https://discord.gg/9wNjFp2dNX" target="_blank" rel="noreferrer">Discord</a><a href="http://instagram.com/woafy.pet" target="_blank" rel="noreferrer">Instagram</a><a href="https://www.facebook.com/share/g/1DfE2k8M5W/?mibextid=wwXIfr" target="_blank" rel="noreferrer">Facebook</a><a href="https://linkedin.com/company/woafmeow" target="_blank" rel="noreferrer">LinkedIn</a></nav><span>© 2026 WoafMeow</span><nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/accessibility/">Accessibility</a></nav></div>
  </footer>`;
}

function page({ route, title, description, body, bodyClass = "" }) {
  const canonical = `${PUBLIC_ORIGIN}${route}`;
  const runtimeBody = body.replaceAll(
    "https://www.woafmeow.com/api/",
    `${BACKEND_ORIGIN}/api/`,
  );
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="description" content="${escapeHtml(description)}"><meta name="theme-color" content="#fffaf6"><link rel="canonical" href="${canonical}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles.css?v=${ASSET_VERSION}"><title>${escapeHtml(title)} · WoafMeow</title></head><body class="${escapeHtml(bodyClass)}"><a class="skip-link" href="#main-content">Skip to content</a>${header()}<main id="main-content">${runtimeBody}</main>${footer()}<script src="/app.js?v=${ASSET_VERSION}" defer></script></body></html>`;
}

function editorialHeading(title, copy = "", action = "") {
  return `<header class="editorial-heading"><div><h2>${escapeHtml(title)}</h2>${copy ? `<p>${escapeHtml(copy)}</p>` : ""}</div>${action}</header>`;
}

function emailCapture(
  id = "guide-email",
  title = "Get the complete Senior Dog Care Guide",
) {
  const guideUrl = `/assets/${GUIDE_PDF_NAME}`;
  return `<form class="email-capture" id="${escapeHtml(id)}" data-preview-form data-guide-delivery data-guide-url="${guideUrl}" data-submit-api="${BACKEND_ORIGIN}/api/newsletter" data-success-message="Your guide was sent from hello@woafmeow.com. Please check your inbox and spam folder." data-form-title="Senior Dog Care Guide"><input type="hidden" name="requestType" value="senior-dog-guide"><input type="hidden" name="guideUrl" value="${PUBLIC_ORIGIN}${guideUrl}"><input type="hidden" name="guideConsent" value="true"><div><h2>${escapeHtml(title)}</h2><p>Movement, sleep, eating, drinking, bathroom changes and daily life—in one practical guide.</p></div><label class="guide-email-field"><span class="sr-only">Email or Gmail address</span><input name="email" type="email" autocomplete="email" placeholder="Email or Gmail address" required></label><button class="button primary" type="submit">Email me the complete guide <span aria-hidden="true">→</span></button><p class="form-note" data-form-note role="status" aria-live="polite"></p></form>`;
}

function compactLessonCard(lesson, index = 0) {
  return `<article class="editorial-card lesson-card-v6"><a href="/care-circle/${lesson.slug}/" class="editorial-card-media">${image(lesson.image, lesson.imageAlt)}</a><div><h3><a href="/care-circle/${lesson.slug}/">${escapeHtml(lesson.title)}</a></h3><p>${escapeHtml(lesson.chapters[0].result)}</p><a class="text-link" href="/care-circle/${lesson.slug}/">Open lesson →</a></div></article>`;
}

function wmHomePageLegacy() {
  const changes = [
    [
      "Mobility",
      "Support stiff joints and easier movement.",
      "real-senior-care-at-home.jpg",
      "/care-circle/slower-after-rest/",
      "♙",
    ],
    [
      "Restful nights",
      "Calm the night and improve rest.",
      "problem-restless-night-dog-sleeping.jpg",
      "/care-circle/restless-at-night/",
      "☾",
    ],
    [
      "Nutrition",
      "Food choices that support aging well.",
      "problem-appetite-owner-offering-food.jpg",
      "/care-circle/changes-in-appetite/",
      "♨",
    ],
    [
      "Hydration",
      "Encourage steady drinking and comfort.",
      "guide-solutions-white-brown-dog.jpg",
      "/care-circle/drinking-more-water/",
      "◌",
    ],
    [
      "Bathroom",
      "Accidents, urgency or strain—what helps.",
      "guide-action-brown-dog-resting.jpg",
      "/care-circle/bathroom-accidents/",
      "♧",
    ],
    [
      "Daily life",
      "Routines and home adjustments that help.",
      "problem-daily-routine-senior-dark-dog.jpg",
      "/care-circle/less-interest-in-life/",
      "⌂",
    ],
  ];
  const publicLessons = [
    [
      "MOBILITY",
      "When morning stiffness needs a closer look",
      "Measure one natural rise and know what to record.",
      "real-holding-dog.jpg",
      "/care-circle/slower-after-rest/",
    ],
    [
      "RESTFUL NIGHTS",
      "Help your dog settle more soundly",
      "Map wake-ups, pacing and what helps them resettle.",
      "real-golden-outdoors.jpg",
      "/care-circle/restless-at-night/",
    ],
    [
      "NUTRITION",
      "What to notice when appetite changes",
      "Track portions, chewing, nausea clues and weight.",
      "real-companion-moment.jpg",
      "/care-circle/changes-in-appetite/",
    ],
    [
      "HYDRATION",
      "How much water is enough?",
      "Compare intake, urination and energy without guessing.",
      "guide-recognize-older-golden.jpg",
      "/care-circle/drinking-more-water/",
    ],
    [
      "BATHROOM",
      "Handle accidents with less stress",
      "Notice timing, urgency, strain and mobility barriers.",
      "guide-observe-beagle-owner.jpg",
      "/care-circle/bathroom-accidents/",
    ],
    [
      "DAILY LIFE",
      "When familiar routines start to disappear",
      "Spot changes in comfort, connection and daily interest.",
      "guide-vet-care-brown-dog.jpg",
      "/care-circle/less-interest-in-life/",
    ],
  ];
  const supportPaths = [
    [
      "Find care",
      "Locate veterinarians, rehabilitation, hospice and other senior-dog support.",
      "real-comfort-hug.jpg",
      "/find-care/",
      "Find care near you",
    ],
    [
      "Wednesday introductions",
      "Meet one nearby owner living through a similar change with their dog.",
      "community-owner-match.jpg",
      "/wednesday-introductions/",
      "Request an introduction",
    ],
    [
      "Pet loss support",
      "Find compassionate, practical help before goodbye and in the days after.",
      "real-pet-loss-support.jpg",
      "/pet-loss-support/",
      "Get support",
    ],
    [
      "Memorial trees",
      "Honor the life you shared with a living tribute planted through our partner.",
      "real-memorial-tree-planting.jpg",
      "/memorial-tree/",
      "Create a memorial tree",
    ],
  ];
  return page({
    route: "/",
    title: "Know what your aging dog needs next",
    description:
      "Ask about a change in your dog and get practical Care Circle guidance, veterinarian-supported lessons, trusted care options, and supportive WoafyPet rest.",
    bodyClass: "home-v12 home-v13 home-v14 home-v15 home-v16",
    body: `
    <div class="home-reference">
      <section class="home-ref-hero"><div class="home-ref-hero-copy"><span class="home-hero-eyebrow">Senior-dog care, made clearer</span><h1><span>Know what your</span> <span>aging dog needs next.</span></h1><p>Describe the change you see. Care Circle turns it into practical observations, safer next steps and a clearer conversation with your veterinarian.</p><form class="home-hero-chat" action="/care-circle/" method="get" aria-label="Ask Care Circle about a change in your dog"><label for="home-care-question"><span>What changed with your dog?</span></label><div><input id="home-care-question" name="q" type="search" maxlength="500" required placeholder="e.g., slower after rest, waking at night, eating less"><input name="ask" type="hidden" value="1"><button class="button primary" type="submit">Ask Care Circle →</button></div></form></div><figure>${image("problem-mobility-senior-lab.jpg", "Senior Labrador resting comfortably at home", { eager: true })}</figure></section>
      <section class="home-platform-model" aria-labelledby="home-platform-heading"><header><span>THE PLATFORM</span><h2 id="home-platform-heading">Care built around your dog.</h2></header><div><article><h3>What WoafMeow does</h3><p>Turn a change you notice at home into a tailored care lesson, trackable record and clearer veterinary conversation.</p></article><article><h3>Why it is different</h3><p>Every lesson starts with your question and your dog’s age, breed, conditions and routine—not a generic pet article.</p></article></div></section>

      <section class="home-care-hub" id="topics" aria-labelledby="home-care-hub-heading"><header><div><h2 id="home-care-hub-heading">Choose a change. Open its care lesson.</h2><p>Real questions from dog owners, with veterinarian-supported steps you can use today.</p></div><a href="/care-circle/">Browse every Care Circle lesson →</a></header><div class="home-circle-grid">${publicLessons.map(([topic, title, copy, asset, href]) => `<a class="home-circle-card" href="${href}"><figure>${image(asset, `${topic.toLowerCase()} public Care Circle lesson`)}</figure><div><small>${topic}</small><h3>${title}</h3><p>${copy}</p><span>Read the complete lesson →</span></div></a>`).join("")}</div></section>

      <section class="home-ref-guide"><div class="home-guide-intro"><span>Veterinarian-supported guide</span><h2>Free Senior Dog Care Guide.</h2><p>Clear steps for changes in movement, sleep, appetite, drinking and daily life.</p></div><form data-preview-form data-guide-delivery data-submit-api="${BACKEND_ORIGIN}/api/newsletter" data-success-message="The guide is on its way. Please check your inbox and spam folder." data-form-title="Senior Dog Care Guide"><input type="hidden" name="requestType" value="senior-dog-guide"><input type="hidden" name="guideUrl" value="${PUBLIC_ORIGIN}/assets/WoafMeow_Senior_Dog_Care_Field_Guide.pdf"><input type="hidden" name="consent" value="true"><label><span class="sr-only">Email address</span><input name="email" type="email" autocomplete="email" placeholder="Your email address" required></label><button class="button primary" type="submit">Send guide →</button><p class="form-note" data-form-note role="status" aria-live="polite"></p></form></section>

      <section class="home-vet-testimonials"><header><h2>Veterinarian support you can trust.</h2><p>Careful observation helps owners ask clearer questions and seek the right help sooner.</p></header><div><article><figure>${image("vet-silvan-urfer.jpg", "Veterinarian and dog-aging researcher Dr. Silvan Urfer")}</figure><div><blockquote>“Dogs often compensate until changes become obvious. Long-term tracking can give owners and veterinarians more context.”</blockquote><p><strong>Dr. Silvan Urfer</strong><span>Veterinarian &amp; dog-aging researcher</span></p></div></article><article><figure>${image("vet-annika-bremhorst-official.jpg", "Veterinarian and canine-pain researcher Dr. Annika Bremhorst")}</figure><div><blockquote>“Pain can be difficult to detect, especially when it is prolonged. Long-term monitoring can help reveal subtle changes.”</blockquote><p><strong>Dr. Annika Bremhorst</strong><span>Veterinarian &amp; canine-pain researcher</span></p></div></article></div><aside><h3>Need more help?</h3><p>Find a veterinarian, rehabilitation service or other senior-dog care professional.</p><a class="button secondary" href="/find-care/?care=senior-veterinarians">Find veterinary care →</a></aside></section>

      <section class="home-ref-bed" aria-labelledby="home-bed-heading"><header><span>WoafyPet Smart Bed</span><h2 id="home-bed-heading"><span>Support stiff joints.</span> <span>Track possible pain changes.</span></h2><p>Orthopedic foam reduces pressure. Smart Base tracks rest, movement, bed use and weight changes.</p></header><div class="home-bed-grid">
        <article class="home-bed-story home-bed-comfort-story"><div class="home-bed-copy"><span>Orthopedic support</span><h3><span>Ease joint pressure.</span> <span>Notice change.</span></h3><p>Low entry, stable bolsters and layered foam support stiff dogs.</p><ul class="home-bed-feature-list"><li><strong>Low entry</strong><span>Easier access</span></li><li><strong>Pressure relief</strong><span>Cushions joints</span></li><li><strong>Stable bolsters</strong><span>Supports turning</span></li><li><strong>Pattern tracking</strong><span>Flags change</span></li></ul><a class="button primary" href="https://www.woafy.pet/smart-bed/">Explore Bed + Smart Base →</a></div><figure>${image("product-prototype-golden.webp", "Golden retriever resting in the current rectangular WoafyPet Smart Bed")}</figure></article>
        <article class="home-bed-story home-bed-layer-story"><figure class="home-bed-layer-figure">${image("bed-layers.png", "Complete WoafyPet Smart Bed foam and Smart Base layer system")}<b class="home-bed-fifth-marker" aria-label="Layer 5">5</b></figure><div class="home-bed-copy"><span>Five layers</span><h3><span>One complete bed.</span> <span>Five clear jobs.</span></h3><p>Washable comfort, pressure relief, orthopedic support, sensing and grip.</p><ol class="home-bed-layer-list"><li><b>1</b><span><strong>Washable cover</strong>Everyday care</span></li><li><b>2</b><span><strong>Comfort foam</strong>Surface relief</span></li><li><b>3</b><span><strong>Orthopedic core</strong>Stable support</span></li><li><b>4</b><span><strong>Smart Base</strong>Rest and weight trends</span></li><li><b>5</b><span><strong>Non-slip base</strong>Steadier entry</span></li></ol><a class="button secondary" href="/smart-bed/">See the complete bed →</a></div></article>
        <article class="home-bed-story home-bed-tracking-story"><div class="home-bed-copy"><span>Smart Base tracking</span><h3><span>Track rest.</span> <span>Flag discomfort.</span></h3><p>No collar or camera. Review changes worth sharing with your veterinarian.</p><div class="home-bed-metrics"><span><b>Rest</b>Total duration</span><span><b>Night</b>Wake-ups</span><span><b>Heart rate</b>Resting trend</span><span><b>Weight</b>Longer trends</span></div><a class="button primary" href="https://www.woafy.pet/smart-base/">Explore Smart Base →</a></div><figure>${image("product-visualization-smart-base.png", "WoafyPet Smart Base passive rest, movement, heart-rate and weight pattern system")}</figure></article>
      </div></section>

      <section class="home-support-paths" aria-label="More ways WoafMeow can help">${supportPaths.map(([title, copy, asset, href, action]) => `<a href="${href}"><figure>${image(asset, title)}</figure><div><h2>${title}</h2><p>${copy}</p><span>${action} →</span></div></a>`).join("")}</section>

      <dialog class="profile-gate-dialog" data-first-action-dialog aria-labelledby="profile-gate-title"><div class="profile-gate-shell"><button class="profile-gate-close" type="button" data-first-action-close aria-label="Close registration form">×</button><header><span>One-time care profile</span><h2 id="profile-gate-title">Tell us who you care for.</h2><p>Create your profile once. Your dog’s age, breed, weight, known conditions and medicines make every question more relevant.</p><ul><li>Ask questions shaped around your dog</li><li>Upload records and track changes over time</li><li>Keep every private lesson in one place</li></ul></header><form data-account-form data-home-account-form><div class="profile-gate-grid"><label><span>Your name</span><input name="ownerName" autocomplete="name" placeholder="e.g., Alex" required maxlength="100"></label><label><span>Email or Gmail</span><input name="email" type="email" autocomplete="email" placeholder="you@email.com" required maxlength="254"></label><label><span>Dog's name</span><input name="petName" placeholder="e.g., Bailey" required maxlength="80"></label><label><span>Age</span><select name="petAge" required><option value="">Choose age</option><option>Under 1 year</option><option>1–3 years</option><option>4–6 years</option><option>7–9 years</option><option>10–12 years</option><option>13–15 years</option><option>16+ years</option></select></label>${dogProfileSelectors("home-profile", "profile-gate-wide")}<label class="profile-gate-wide profile-photo-field"><span>Dog profile photo <em>(strongly recommended)</em></span><input name="petPhoto" type="file" accept="image/jpeg,image/png,image/webp" data-pet-photo-input><small>Helps your Care Circle lesson feel personal. You decide whether it appears publicly.</small><img data-pet-photo-preview hidden alt="Dog profile photo preview"></label><label class="profile-gate-wide"><span>Medicines or recent changes</span><textarea name="medications" maxlength="360" placeholder="Names and recent changes, if any"></textarea></label></div><p class="account-privacy-note">Your care profile stays private. Choose Public or Private separately each time you ask Care Circle.</p><button class="button primary" type="submit">Create profile and ask my question →</button><div class="profile-gate-or" aria-hidden="true"><span>or</span></div><button class="home-google-button" type="button" data-google-signin aria-describedby="profile-google-note"><span class="google-g" aria-hidden="true">G</span>Continue with Google</button><p class="sr-only" id="profile-google-note">Google sign-in requires the production Google connection.</p><p class="form-note" data-account-note role="status" aria-live="polite"></p><p class="google-status" data-google-status role="status" aria-live="polite"></p></form></div></dialog>
    </div>`,
  });
}

const dogBreedOptions = [
  "Mixed breed — known mix",
  "Mixed breed — unknown mix",
  "Affenpinscher",
  "Afghan Hound",
  "Airedale Terrier",
  "Akita",
  "Alaskan Malamute",
  "American Bulldog",
  "American Eskimo Dog",
  "American Staffordshire Terrier",
  "Australian Cattle Dog",
  "Australian Shepherd",
  "Basenji",
  "Basset Hound",
  "Beagle",
  "Belgian Malinois",
  "Bernese Mountain Dog",
  "Bichon Frise",
  "Bloodhound",
  "Border Collie",
  "Border Terrier",
  "Boston Terrier",
  "Boxer",
  "Brittany",
  "Brussels Griffon",
  "Bull Terrier",
  "Bulldog",
  "Bullmastiff",
  "Cairn Terrier",
  "Cane Corso",
  "Cavalier King Charles Spaniel",
  "Chihuahua",
  "Chinese Crested",
  "Chow Chow",
  "Cocker Spaniel",
  "Collie",
  "Corgi — Cardigan Welsh",
  "Corgi — Pembroke Welsh",
  "Dachshund",
  "Dalmatian",
  "Doberman Pinscher",
  "English Cocker Spaniel",
  "English Setter",
  "English Springer Spaniel",
  "French Bulldog",
  "German Shepherd Dog",
  "German Shorthaired Pointer",
  "Giant Schnauzer",
  "Golden Retriever",
  "Goldendoodle",
  "Great Dane",
  "Great Pyrenees",
  "Greyhound",
  "Havanese",
  "Irish Setter",
  "Irish Wolfhound",
  "Italian Greyhound",
  "Jack Russell Terrier",
  "Japanese Chin",
  "Labradoodle",
  "Labrador Retriever",
  "Lhasa Apso",
  "Maltese",
  "Mastiff",
  "Miniature Pinscher",
  "Miniature Schnauzer",
  "Newfoundland",
  "Old English Sheepdog",
  "Papillon",
  "Pekingese",
  "Pomeranian",
  "Poodle — Standard",
  "Poodle — Miniature",
  "Poodle — Toy",
  "Portuguese Water Dog",
  "Pug",
  "Rhodesian Ridgeback",
  "Rottweiler",
  "Saint Bernard",
  "Samoyed",
  "Schnauzer — Standard",
  "Scottish Terrier",
  "Shar-Pei",
  "Shetland Sheepdog",
  "Shiba Inu",
  "Shih Tzu",
  "Siberian Husky",
  "Staffordshire Bull Terrier",
  "Vizsla",
  "Weimaraner",
  "West Highland White Terrier",
  "Whippet",
  "Yorkshire Terrier",
  "Breed not listed — describe below",
];

const dogConditionOptions = [
  "None known",
  "Arthritis or joint pain",
  "Cancer",
  "Chronic kidney disease",
  "Cognitive or behavior change",
  "Dental or mouth disease",
  "Diabetes",
  "Digestive or pancreatic disease",
  "Eye or vision condition",
  "Hearing loss",
  "Heart disease",
  "Neurologic or seizure condition",
  "Respiratory condition",
  "Skin disease or allergies",
  "Other diagnosed condition",
];

function dogProfileSelectors(prefix, wideClass) {
  return `<label><span>Dog breed or mix</span><select name="breed" required><option value="">Choose breed or mix</option>${dogBreedOptions.map((breed) => `<option>${escapeHtml(breed)}</option>`).join("")}</select></label><label><span>Weight range</span><select name="weightRange" required><option value="">Choose weight range</option><option>Under 10 lb / 4.5 kg</option><option>10–24 lb / 4.5–11 kg</option><option>25–49 lb / 11–22 kg</option><option>50–74 lb / 23–34 kg</option><option>75–99 lb / 34–45 kg</option><option>100–124 lb / 45–56 kg</option><option>125+ lb / 57+ kg</option></select></label><label class="${wideClass}"><span>Mix or breed details <em>(optional)</em></span><input name="breedDetails" maxlength="120" placeholder="e.g., Labrador × Poodle, or the breed not listed above"></label><div class="${wideClass} condition-picker" data-condition-picker role="group" aria-labelledby="${prefix}-conditions-label"><span id="${prefix}-conditions-label">Known conditions <em>(choose all that apply)</em></span><div>${dogConditionOptions.map((condition) => `<label><input type="checkbox" name="conditions" value="${escapeHtml(condition)}"><span>${escapeHtml(condition)}</span></label>`).join("")}</div><label class="condition-other"><span>Other condition details <em>(optional)</em></span><input name="conditionDetails" maxlength="160" placeholder="Diagnosis or wording your veterinarian used"></label><small data-condition-error role="status" aria-live="polite"></small></div>`;
}

function wmHomePage() {
  const supportPaths = [
    ["Find the right care", "Search trusted veterinary, rehabilitation and support options.", "guide-vet-care-brown-dog.jpg", "/find-care/", "Find care"],
    ["Meet another dog parent", "Wednesday Introductions matches owners who understand the same kind of day.", "real-owner-match-walk.jpg", "/wednesday-introductions/", "See Wednesday Introductions"],
    ["Talk through pet loss", "Find compassionate support before, during and after goodbye.", "real-pet-loss-support.jpg", "/pet-loss-support/", "Find support"],
    ["Plant a living memorial", "Honor your dog with a tree and a place their story can keep growing.", "real-memorial-tree-planting.jpg", "/memorial-tree/", "Create a memorial"],
  ];
  return page({
    route: "/",
    title: "Senior dog care that starts with understanding",
    description:
      "Ask about a change in your aging dog and get practical Care Circle guidance, veterinarian-supported next steps, and supportive WoafyPet rest.",
    bodyClass: "home-v17",
    body: `
    <div class="home-contract">
      <section class="home-contract-hero" aria-labelledby="home-contract-title">
        <div class="home-contract-hero-copy"><span class="home-kicker">SENIOR DOG CARE</span><h1 id="home-contract-title"><span>Senior dog care.</span><span>Start with understanding.</span></h1><p>Notice a change? Ask anything. Get practical next steps, trusted care and support—together.</p><form class="home-hero-chat" action="/care-circle/" method="get" aria-label="Ask Care Circle about a change in your dog"><label for="home-care-question">What changed with your dog?</label><div><input id="home-care-question" name="q" type="search" maxlength="500" required placeholder="e.g., slower after rest, waking at night, eating less"><input name="ask" type="hidden" value="1"><button type="submit" aria-label="Ask Care Circle">→</button></div><small>Care Circle organizes what to notice, track and ask next.</small></form></div>
        <figure>${image("problem-mobility-senior-lab.jpg", "Senior Labrador resting comfortably at home", { eager: true })}</figure>
      </section>

      <section class="home-contract-trust" aria-label="WoafMeow trust points"><article><span class="home-trust-icon">10K+</span><div><h2>Trusted by 10,000+ pet owners</h2><p>Real questions. Real dogs. Clear change.</p></div></article><article><span class="home-trust-icon" aria-hidden="true">✓</span><div><h2>Veterinarian-supported</h2><p>Guidance shaped by veterinary knowledge.</p></div></article><article><span class="home-trust-icon" aria-hidden="true">♡</span><div><h2>Built for dog parents</h2><p>Practical tools and compassionate support.</p></div></article></section>

      <section class="home-contract-circle" aria-labelledby="home-circle-title"><div><span class="home-kicker">CARE CIRCLE</span><h2 id="home-circle-title">Real questions. Answers for your dog.</h2><p>Share your dog’s age, breed, health and the change you are seeing. Get tailored insights, next steps and support.</p><ul><li>Personalized care lessons</li><li>Community support</li><li>Progress you can track</li><li>Veterinarian-informed guidance</li></ul><a class="button primary" href="/care-circle/#ask">Join your Care Circle →</a></div><figure>${image("problem-daily-routine-senior-dark-dog.jpg", "Senior dog looking toward the person who knows them best")}</figure></section>

      <section class="home-contract-care-grid" aria-label="Veterinary evidence"><article class="home-contract-evidence"><figure>${image("vet-silvan-urfer.jpg", "Silvan R. Urfer, veterinarian and dog-aging researcher")}<figcaption class="home-vet-credential"><strong>Silvan R. Urfer, Dr. med. vet.</strong><span>Veterinarian and dog-aging researcher · Dog Aging Project</span></figcaption></figure><div><span class="home-kicker">VETERINARY EVIDENCE</span><h2>Dog-aging expertise. Clear next steps.</h2><p>Dr. Urfer studies dog aging and longevity. His work helps families understand why sustained changes in rest, movement and weight deserve a clearer veterinary conversation.</p><a href="/find-care/?care=senior-veterinarians">Find veterinary care →</a></div></article></section>

      <section class="home-contract-guide" aria-labelledby="home-guide-title"><div><span class="home-kicker">SENIOR DOG CARE GUIDE</span><h2 id="home-guide-title">Understand your dog’s aging journey.</h2><p>From mobility to mood to cognition—explore practical care for every stage of aging.</p><a class="button secondary" href="/guide/">Explore the guide →</a></div><figure class="home-guide-book">${image("senior-dog-care-guide-book-v2.png", "Three-dimensional Senior Dog Care Guide book featuring an older golden retriever")}</figure></section>

      <section class="home-contract-bed" aria-labelledby="home-bed-title">
        <div class="home-bed-system">
          <div class="home-contract-bed-copy"><span class="home-kicker">ORTHOPEDIC BED + SMART BASE</span><h2 id="home-bed-title">Better rest. Earlier health alerts.</h2><p class="home-bed-lead">The bed supports stiff joints. Smart Base alerts you when rest, movement, bed use or weight shifts from your dog’s normal pattern.</p><ul class="home-bed-results"><li><strong>Easier entry</strong><span>Low front edge for stiff legs.</span></li><li><strong>Joint pressure relief</strong><span>Firm orthopedic foam supports turning and rising.</span></li><li><strong>Easy cleanup</strong><span>Scratch-resistant, waterproof cover. Removable and machine washable.</span></li></ul><a class="button primary" href="https://www.woafy.pet/smart-bed/">Explore Bed + Smart Base →</a></div>
          <figure class="home-contract-complete"><div class="home-bed-lifestyle">${image("product-prototype-golden-full-v2.png", "Golden retriever sleeping in the full WoafyPet orthopedic bed on its Smart Base")}</div></figure>
        </div>
        <div class="home-bed-construction">
          <div class="home-bed-construction-copy"><span class="home-kicker">ULTRA-PREMIUM ORTHOPEDIC COMFORT</span><h3>Deeper rest. Easier rising.</h3><p>Every layer helps an older dog settle, reposition and rise with less effort.</p></div>
          <figure class="home-contract-product home-bed-layer-figure">${image("bed-layers.png", "Exploded WoafyPet orthopedic bed and Smart Base construction")}<b class="home-bed-fifth-marker" aria-label="Layer 5: Smart Base">5</b></figure>
          <aside class="home-bed-proof" aria-label="WoafyPet Bed and Smart Base benefits"><div><p><strong>Step in with less effort</strong>Low front edge reduces the lift for stiff legs.</p></div><div><p><strong>Rest without sliding</strong>Firm sides support the head, neck and hips.</p></div><div><p><strong>Reduce joint pressure</strong>Foam cushions shoulders and hips without deep sinking.</p></div><div><p><strong>Turn and rise more easily</strong>Stable support gives older dogs leverage to reposition.</p></div><div><p><strong>Catch routine changes earlier</strong>Smart Base alerts you to lasting shifts in rest, movement, bed use and weight.</p></div></aside>
        </div>
      </section>

      <section class="home-contract-close" aria-label="Smart Base insights and care profile"><article class="home-contract-insights"><figure>${image("product-visualization-smart-base.png", "Verified dark WoafyPet Smart Base shown flat and folded for use beneath a dog bed")}</figure><div><span class="home-kicker">EARLIER HEALTH-CHANGE ALERTS</span><h2>Get health-change alerts sooner.</h2><p>Slide Smart Base under the WoafyPet Bed or another dog bed. It learns your dog’s normal routine and alerts you when a change lasts.</p><dl class="home-insight-metrics"><div><dt>Rest</dt><dd>Broken sleep may signal discomfort.</dd></div><div><dt>Night movement</dt><dd>More wake-ups can point to pain or bathroom needs.</dd></div><div><dt>Heart rate</dt><dd>Spot resting-rate shifts that may signal stress or health changes.</dd></div><div><dt>Weight</dt><dd>Ongoing gain or loss can accompany appetite or chronic-disease change.</dd></div></dl><p class="home-insight-action"><strong>Get the alert. Save the trend. Show your veterinarian exactly what changed.</strong></p><a href="https://www.woafy.pet/smart-base/">See how early alerts work →</a></div></article><article class="home-contract-profile"><div><span aria-hidden="true">♡</span><p><strong>Build your dog’s care profile</strong>Add your dog once. Keep private lessons and health history together.</p></div><a href="/account/">Create my care profile →</a></article></section>

      <section class="home-support-paths home-contract-support" aria-label="More ways WoafMeow can help">${supportPaths.map(([title, copy, asset, href, action]) => "<a href=\"" + escapeHtml(href) + "\"><figure>" + image(asset, title) + "</figure><div><h2>" + escapeHtml(title) + "</h2><p>" + escapeHtml(copy) + "</p><span>" + escapeHtml(action) + " →</span></div></a>").join("")}</section>

      <dialog class="profile-gate-dialog" data-first-action-dialog aria-labelledby="profile-gate-title"><div class="profile-gate-shell"><button class="profile-gate-close" type="button" data-first-action-close aria-label="Close registration form">×</button><header><span>One-time care profile</span><h2 id="profile-gate-title">Tell us who you care for.</h2><p>Create your profile once. Your dog’s age, breed, weight, known conditions and medicines make every question more relevant.</p><ul><li>Ask questions shaped around your dog</li><li>Upload records and track changes over time</li><li>Keep every private lesson in one place</li></ul></header><form data-account-form data-home-account-form><div class="profile-gate-grid"><label><span>Your name</span><input name="ownerName" autocomplete="name" placeholder="e.g., Alex" required maxlength="100"></label><label><span>Email or Gmail</span><input name="email" type="email" autocomplete="email" placeholder="you@email.com" required maxlength="254"></label><label><span>Dog's name</span><input name="petName" placeholder="e.g., Bailey" required maxlength="80"></label><label><span>Age</span><select name="petAge" required><option value="">Choose age</option><option>Under 1 year</option><option>1–3 years</option><option>4–6 years</option><option>7–9 years</option><option>10–12 years</option><option>13–15 years</option><option>16+ years</option></select></label>${dogProfileSelectors("home-profile", "profile-gate-wide")}<label class="profile-gate-wide profile-photo-field"><span>Dog profile photo <em>(strongly recommended)</em></span><input name="petPhoto" type="file" accept="image/jpeg,image/png,image/webp" data-pet-photo-input><small>Helps your Care Circle lesson feel personal. You decide whether it appears publicly.</small><img data-pet-photo-preview hidden alt="Dog profile photo preview"></label><label class="profile-gate-wide"><span>Medicines or recent changes</span><textarea name="medications" maxlength="360" placeholder="Names and recent changes, if any"></textarea></label></div><p class="account-privacy-note">Your care profile stays private. Choose Public or Private separately each time you ask Care Circle.</p><button class="button primary" type="submit">Create profile and ask my question →</button><div class="profile-gate-or" aria-hidden="true"><span>or</span></div><button class="home-google-button" type="button" data-google-signin aria-describedby="profile-google-note"><span class="google-g" aria-hidden="true">G</span>Continue with Google</button><p class="sr-only" id="profile-google-note">Google sign-in requires the production Google connection.</p><p class="form-note" data-account-note role="status" aria-live="polite"></p><p class="google-status" data-google-status role="status" aria-live="polite"></p></form></div></dialog>
    </div>`,
  });
}

function wmCarePathPage() {
  return page({
    route: "/care-path/",
    title: "Ask Care Circle",
    description:
      "Sign in, choose a pet profile and ask Care Circle about the change you noticed.",
    bodyClass: "care-path-v6",
    body: `
    <section class="result-hero account-required-hero"><div><h1>Your dog's profile comes first.</h1><p>Care Circle uses age, breed, known conditions, medicines and the change you noticed to shape a more relevant lesson.</p><a class="button primary" href="/account/?next=ask">Sign in and ask Care Circle →</a><a class="text-link" href="/care-circle/">Browse public lessons →</a></div><figure>${image("real-senior-care-at-home.jpg", "Dog at home with a caregiver preparing to ask a care question", { eager: true })}</figure></section>`,
  });
}

function wmGuidePage() {
  const topics = [
    [
      "Movement",
      "Watch the first five steps after rest, slipping, stairs and recovery.",
      "Add traction, shorten difficult routes and record one natural rise.",
      "Sudden inability to stand, dragging a limb or severe pain.",
      "problem-mobility-senior-lab.jpg",
    ],
    [
      "Sleep",
      "Record wake time, pacing, breathing, toileting and what helps settling.",
      "Keep water, a clear bathroom route and gentle night lighting available.",
      "Breathing difficulty, collapse or severe disorientation.",
      "problem-restless-night-dog-sleeping.jpg",
    ],
    [
      "Eating",
      "Measure what was offered and eaten; note chewing, nausea and weight.",
      "Keep food familiar and bowls easy to reach while arranging care.",
      "Repeated vomiting, a swollen abdomen or refusing all food with weakness.",
      "problem-appetite-owner-offering-food.jpg",
    ],
    [
      "Water",
      "Measure one ordinary day; pair thirst with urine, appetite and medicines.",
      "Keep fresh water available and add easier bathroom access.",
      "Inability to urinate, collapse or severe distress.",
      "guide-solutions-white-brown-dog.jpg",
    ],
    [
      "Bathroom",
      "Record time, urgency, posture, amount, route and signs of pain.",
      "Offer more frequent access on a short, well-lit, non-slip route.",
      "Repeated straining without output, blood with weakness or severe pain.",
      "guide-action-brown-dog-resting.jpg",
    ],
    [
      "Daily life",
      "Name the exact routine your dog no longer starts, joins or finishes.",
      "Offer a shorter, lower-effort version and let your dog choose.",
      "Sudden confusion, seizure, collapse or rapid major behavior change.",
      "problem-daily-routine-senior-dark-dog.jpg",
    ],
  ];
  const shareByTopic = {
    Movement: "Save a 10–20 second natural-rise video plus the surface, pause, first five steps and recovery time.",
    Sleep: "Create a seven-night wake-up timeline with time, first behavior, bathroom trip, breathing and what helped settling.",
    Eating: "Record food offered, amount eaten, chewing side, dropped food, nausea clues and a dated weight when available.",
    Water: "Measure one ordinary day's intake and pair it with urination, appetite, medicines and energy changes.",
    Bathroom: "Track time, urgency, posture, output, accidents and the exact route your dog must travel.",
    "Daily life": "Name the routine that changed, how often it happens, what your dog still chooses and what lowers the effort.",
  };
  return page({
    route: "/guide/",
    title: "The complete Senior Dog Care Guide",
    description:
      "A detailed, visual guide to the most common changes in senior dogs, what to notice, what to do today, and when to call a veterinarian.",
    bodyClass: "guide-v6 guide-v7 guide-v8",
    body: `
    <section class="guide-hero-v6"><div class="guide-hero-photo">${image("guide-recognize-older-golden.jpg", "Older golden retriever receiving a calm daily check-in", { eager: true })}</div><div class="guide-hero-copy"><h1>The complete Senior Dog Care Guide</h1><p>Understand the changes aging dogs face. Know what to check, what to make easier today, and what deserves a faster call.</p>${emailCapture("guide-download", "Email me the guide")}</div></section>
    <section class="guide-outcomes"><div class="wm-wrap"><article><span>1</span><h2>Recognize the exact change.</h2><p>Replace vague worry with a specific behavior, time and routine.</p></article><article><span>2</span><h2>Make today easier.</h2><p>Use low-risk changes that protect access, traction, rest and dignity.</p></article><article><span>3</span><h2>Know when to call.</h2><p>Separate useful tracking from signs that should not wait.</p></article><article><span>4</span><h2>Share a useful care summary.</h2><p>Organize the timeline, records and questions your veterinarian needs.</p></article></div></section>
    <section class="guide-topics-v6"><div class="wm-wrap">${editorialHeading("Six changes. Four clear decisions for each.", "What to watch, what to do today, what to share and when to call sooner.")}<div>${topics.map(([title, notice, today, sooner, asset]) => `<article><figure>${image(asset, `${title} section of the Senior Dog Care Guide`)}</figure><div><h3>${title}</h3><dl><div><dt>Watch</dt><dd>${notice}</dd></div><div><dt>Do today</dt><dd>${today}</dd></div><div><dt>Track and share</dt><dd>${shareByTopic[title]}</dd></div><div><dt>Call sooner</dt><dd>${sooner}</dd></div></dl></div></article>`).join("")}</div></div></section>
    <section class="guide-method"><div class="wm-wrap image-text"><figure>${image("guide-observe-beagle-owner.jpg", "Owner observing a dog's ordinary home routine")}</figure><div><h2>Your seven-day change record</h2><ol><li><strong>Day 1 — Set the baseline.</strong> Film or note one ordinary routine without prompting.</li><li><strong>Days 2–3 — Repeat at the same time.</strong> Look for frequency, effort and recovery.</li><li><strong>Days 4–5 — Change one safe detail.</strong> Add traction, access or a shorter route; record the result.</li><li><strong>Day 6 — Connect the systems.</strong> Add sleep, appetite, water, bathroom and medicines.</li><li><strong>Day 7 — Write the summary.</strong> State what changed, how often, what helped and what is harder now.</li></ol><button class="button secondary" type="button" data-print-guide>Print this plan →</button></div></div></section>
    <section class="guide-vet-note"><div class="wm-wrap"><div><h2>Start the vet visit clearly.</h2><span class="guide-script-label">A clear way to begin</span><p class="guide-visit-script">For ten days, she pauses after naps, has slipped twice in the hallway, and now avoids the two kitchen steps. A runner helps, but the change is still happening daily.</p><ul><li>Bring the timeline and short natural videos.</li><li>List medicines, supplements and recent changes.</li><li>Ask which causes need evaluation and what to monitor next.</li></ul></div><figure>${image("real-senior-care-at-home.jpg", "Senior dog receiving attentive care at home")}</figure></div></section>
    <section class="guide-vet-trust"><div class="wm-wrap"><header><h2>Veterinary-supported guidance you can use.</h2><p>Notice the pattern, make the day safer and bring a clearer story to the professional who knows your dog.</p></header><article><figure>${image("vet-silvan-urfer.jpg", "Silvan R. Urfer, veterinarian and dog-aging researcher")}</figure><div><blockquote>“Dogs often compensate until changes become obvious. Long-term tracking can give owners and veterinarians more context.”</blockquote><strong>Silvan R. Urfer, Dr. med. vet.</strong><span>Veterinarian &amp; dog-aging researcher · Dog Aging Project</span></div></article><article><figure>${image("vet-annika-bremhorst-official.jpg", "Dr. Annika Bremhorst, veterinarian and canine-pain researcher")}</figure><div><blockquote>“Pain can be difficult to detect, especially when it is prolonged. Long-term monitoring can help reveal subtle changes.”</blockquote><strong>Dr. Annika Bremhorst</strong><span>Veterinarian &amp; canine-pain researcher</span></div></article></div></section>`,
  });
}

function wmLearnPage() {
  return page({
    route: "/learn/",
    title: "Care Circle lessons",
    description:
      "Care Circle and its public care lessons now live together on one page.",
    bodyClass: "learn-v6 unified-forward",
    body: `<section class="unified-forward-card"><h1>Open Care Circle lessons.</h1><p>Browse every public question, pet profile and complete lesson in one place.</p>${button("Open Care Circle", "/care-circle/")}</section>`,
  });
}

function wmCareCirclePage() {
  const topics = ["All", ...new Set(lessons.map((lesson) => lesson.topic))];
  const publicProfiles = [
    [
      "Milo",
      "12 years",
      "Golden Retriever",
      "arthritis; slower first steps after rest",
    ],
    [
      "Luna",
      "10 years",
      "Labrador mix",
      "osteoarthritis; waking and pacing after midnight",
    ],
    [
      "Daisy",
      "13 years",
      "Beagle",
      "dental disease; eating less and dropping food",
    ],
    [
      "Archie",
      "9 years",
      "Border Collie",
      "recent steroid medicine; drinking and urinating more",
    ],
    [
      "Bruno",
      "11 years",
      "Great Dane mix",
      "arthritis; stopped joining the family after dinner",
    ],
    [
      "Nala",
      "14 years",
      "Mixed breed",
      "kidney disease; urgency and nighttime accidents",
    ],
    [
      "Cooper",
      "8 years",
      "Cocker Spaniel",
      "heart murmur; a new cough while resting",
    ],
    [
      "Rosie",
      "11 years",
      "Mixed breed",
      "unplanned weight loss; leaving part of every meal",
    ],
    [
      "Max",
      "7 years",
      "German Shepherd mix",
      "new anti-inflammatory medicine; sleepier after each dose",
    ],
    [
      "Poppy",
      "9 years",
      "Cavalier King Charles Spaniel",
      "new shoulder lump; licking the area after walks",
    ],
    [
      "Theo",
      "12 years",
      "Miniature Poodle",
      "misses hand cues at dusk; startles when approached from the left",
    ],
    [
      "Mabel",
      "10 years",
      "Labrador Retriever",
      "periodontal disease; drops kibble and chews on one side",
    ],
  ];
  return page({
    route: "/care-circle/",
    title: "Care Circle",
    description:
      "Public questions, pet conditions and complete care lessons in one place.",
    bodyClass: "circle-v7 circle-v8 circle-v9 circle-v10",
    body: `
    <section class="circle-hero-v7" id="ask"><div class="circle-intro-v10"><span>CARE CIRCLE</span><h1><span>Tell us what changed.</span> <span>Get a clear next step.</span></h1><p>Share one moment from your dog’s day. We’ll organize what to notice, track and ask next.</p><a class="text-link" href="#public-lessons">Browse real owner questions →</a></div><figure>${image("real-care-circle-owner-dog.jpg", "Real dog owner sharing a close moment with her dog", { eager: true })}</figure><form class="circle-question-form circle-hero-question" data-account-ask-form><header><span>YOUR CONVERSATION</span><h2>What changed with your dog?</h2><p data-active-pet-summary></p></header><label class="circle-question-main"><span>Describe the change</span><textarea name="question" maxlength="500" required placeholder="What happened, when did it start, and which familiar routine is now harder?"></textarea><small>Include timing, frequency and what happens before or after.</small></label><label class="question-image-field"><span>Add a recent photo <em>(optional)</em></span><input type="file" name="questionImage" accept="image/jpeg,image/png,image/webp" data-question-image-input><small>A photo is shared publicly only if you choose Public below.</small><img data-question-image-preview hidden alt="Question photo preview"><button type="button" class="text-button" data-question-image-remove hidden>Remove photo</button></label><fieldset class="lesson-visibility"><legend>Choose privacy for this question</legend><label><input type="radio" name="lessonVisibility" value="private" checked><span><strong>Private</strong><small>Only you can open this lesson.</small></span></label><label><input type="radio" name="lessonVisibility" value="public"><span><strong>Share in Care Circle</strong><small>Share the question and details you choose.</small></span></label></fieldset><div class="circle-question-result"><strong>Your result</strong><span>A four-part care lesson shaped around your dog.</span><button class="button primary" type="submit">Create my tailored care lesson →</button></div><p class="form-note" data-account-ask-note role="status" aria-live="polite"></p></form><div class="circle-account-gate" data-account-gate><div><h2>Create one care profile.</h2><p>Add age, breed, known conditions and medicines once so each lesson can account for the dog you actually know.</p></div><a class="button secondary" href="/account/?next=ask">Create or edit my care profile →</a></div></section>
    <section class="circle-feed-v7" id="public-lessons"><div class="wm-wrap"><div class="circle-filter-bar"><h2>Public questions and complete lessons</h2><div role="group" aria-label="Filter Care Circle questions">${topics.map((topic, index) => `<button type="button" data-circle-filter="${escapeHtml(topic.toLowerCase())}" aria-pressed="${index === 0 ? "true" : "false"}">${escapeHtml(topic)}</button>`).join("")}</div></div><div class="circle-public-grid" data-circle-public-grid>${lessons
      .map((lesson, index) => {
        const profile = publicProfiles[index];
        return `<article class="circle-public-card" data-care-post data-topic="${escapeHtml(lesson.topic.toLowerCase())}"><figure><a href="/care-circle/${lesson.slug}/">${image(lesson.image, lesson.imageAlt)}</a></figure><div><h2>${escapeHtml(lesson.community.question)}</h2><dl><div><dt>Dog</dt><dd>${escapeHtml(profile[0])} · ${escapeHtml(profile[1])} · ${escapeHtml(profile[2])}</dd></div><div><dt>Owner-shared conditions</dt><dd>${escapeHtml(profile[3])}</dd></div></dl><p>${escapeHtml(lesson.community.excerpt)}</p><a class="button secondary" href="/care-circle/${lesson.slug}/">Read the complete lesson →</a></div></article>`;
      })
      .join("")}</div></div></section>`,
  });
}

function wmLessonPage(lesson) {
  const chapterImageSets = {
    "slower-after-rest": [
      "real-companion-moment.jpg",
      "guide-action-brown-dog-resting.jpg",
      "guide-vet-care-brown-dog.jpg",
      "real-golden-outdoors.jpg",
    ],
    "restless-at-night": [
      "problem-restless-night-senior-black-lab.jpg",
      "real-golden-forest.jpg",
      "real-senior-care-at-home.jpg",
      "real-comfort-hug.jpg",
    ],
    "changes-in-appetite": [
      "problem-appetite-owner-and-dogs.jpg",
      "guide-observe-beagle-owner.jpg",
      "guide-vet-care-brown-dog.jpg",
      "real-holding-dog.jpg",
    ],
    "drinking-more-water": [
      "real-golden-outdoors.jpg",
      "real-senior-care-at-home.jpg",
      "guide-vet-care-brown-dog.jpg",
      "real-home-owner-dog.jpg",
    ],
    "less-interest-in-life": [
      "real-care-circle-owner-dog.jpg",
      "real-holding-dog.jpg",
      "guide-vet-care-brown-dog.jpg",
      "real-golden-forest.jpg",
    ],
    "bathroom-accidents": [
      "problem-mobility-senior-lab.jpg",
      "real-companion-moment.jpg",
      "guide-vet-care-brown-dog.jpg",
      "real-holding-dog.jpg",
    ],
    "new-cough-or-breathing-change": [
      "real-comfort-hug.jpg",
      "guide-action-brown-dog-resting.jpg",
      "guide-vet-care-brown-dog.jpg",
      "real-senior-care-at-home.jpg",
    ],
    "unexpected-weight-change": [
      "guide-observe-beagle-owner.jpg",
      "real-companion-moment.jpg",
      "guide-vet-care-brown-dog.jpg",
      "problem-appetite-owner-offering-food.jpg",
    ],
    "after-a-medicine-change": [
      "real-holding-dog.jpg",
      "problem-restless-night-senior-black-lab.jpg",
      "guide-vet-care-brown-dog.jpg",
      "real-companion-moment.jpg",
    ],
    "new-lump-or-skin-change": [
      "problem-daily-routine-senior-dark-dog.jpg",
      "guide-observe-beagle-owner.jpg",
      "guide-vet-care-brown-dog.jpg",
      "real-holding-dog.jpg",
    ],
    "vision-or-hearing-change": [
      "real-holding-dog.jpg",
      "guide-solutions-white-brown-dog.jpg",
      "real-senior-care-at-home.jpg",
      "real-golden-forest.jpg",
    ],
    "mouth-or-dental-pain": [
      "problem-appetite-owner-and-dogs.jpg",
      "real-holding-dog.jpg",
      "guide-vet-care-brown-dog.jpg",
      "real-senior-care-at-home.jpg",
    ],
  };
  const publicProfileMap = {
    "slower-after-rest": [
      "Milo",
      "12 years",
      "Golden Retriever",
      "arthritis",
      "slower first steps after naps; hallway slipping",
    ],
    "restless-at-night": [
      "Luna",
      "10 years",
      "Labrador mix",
      "osteoarthritis",
      "wakes after midnight, paces and asks to go outside",
    ],
    "changes-in-appetite": [
      "Daisy",
      "13 years",
      "Beagle",
      "dental disease",
      "eats half her meal, drops kibble and turns away",
    ],
    "drinking-more-water": [
      "Archie",
      "9 years",
      "Border Collie",
      "recent steroid medicine",
      "empties the water bowl sooner and urinates more often",
    ],
    "less-interest-in-life": [
      "Bruno",
      "11 years",
      "Great Dane mix",
      "arthritis",
      "no longer joins the family after dinner",
    ],
    "bathroom-accidents": [
      "Nala",
      "14 years",
      "Mixed breed",
      "kidney disease",
      "nighttime urgency and accidents on the route to the door",
    ],
    "new-cough-or-breathing-change": [
      "Cooper",
      "8 years",
      "Cocker Spaniel",
      "heart murmur",
      "a new cough while resting after dinner",
    ],
    "unexpected-weight-change": [
      "Rosie",
      "11 years",
      "Mixed breed",
      "no known condition shared",
      "visible weight loss and food left after most meals",
    ],
    "after-a-medicine-change": [
      "Max",
      "7 years",
      "German Shepherd mix",
      "arthritis",
      "sleepier and less interested in food since a medicine change",
    ],
    "new-lump-or-skin-change": [
      "Poppy",
      "9 years",
      "Cavalier King Charles Spaniel",
      "no diagnosis shared yet",
      "a new shoulder lump and licking after walks",
    ],
    "vision-or-hearing-change": [
      "Theo",
      "12 years",
      "Miniature Poodle",
      "early cataracts",
      "misses hand cues at dusk and startles from the left",
    ],
    "mouth-or-dental-pain": [
      "Mabel",
      "10 years",
      "Labrador Retriever",
      "periodontal disease",
      "drops kibble, chews on one side, and takes longer to finish",
    ],
  };
  const fourthChapterMap = {
    "slower-after-rest": {
      title: "Prepare a vet-ready mobility summary",
      result: "Turn one ordinary rise into a clear, repeatable mobility record.",
      copy: "A short, consistent record helps separate a one-off difficult moment from a pattern that deserves a faster conversation.",
      steps: [
        "Record the surface, length of the pause, first five steps, slipping and recovery.",
        "Add a safe side-view video of one natural rise; never make your dog repeat it for the camera.",
        "Share the dates, changes, current medicines and what made movement easier or harder.",
      ],
      quiz: {
        question: "Which note is most useful for a mobility conversation?",
        options: [["a", "She seems old."], ["b", "After three naps this week, she paused 8–12 seconds before standing and slipped on the hallway floor."], ["c", "I made her stand repeatedly to test her."]],
        answer: "b",
        correct: "Correct. Timing, surface and a repeated natural pattern give the care team useful context.",
        retry: "Choose the note that describes timing, surface and what happened during a natural rise.",
      },
    },
    "restless-at-night": {
      title: "Build a seven-night wake-up map",
      result: "Show exactly when sleep changes and what finally helps your dog settle.",
      copy: "Nighttime pacing can have many causes. A simple sequence is more useful than writing only that it was a bad night.",
      steps: [
        "Record bedtime, first wake time, pacing, panting, drinking, toileting and settling time.",
        "Note any medicine, meal, noise, temperature or routine change that evening.",
        "Send the seven-night pattern and any safe short video with your questions for the veterinary team.",
      ],
      quiz: {
        question: "What belongs in a useful nighttime record?",
        options: [["a", "Only the total hours slept."], ["b", "The first behavior, exact time, bathroom trip, breathing and what helped settling."], ["c", "A guess about the diagnosis."]],
        answer: "b",
        correct: "Correct. The sequence shows what happened before, during and after the wake-up.",
        retry: "Choose the option that records the full sequence without guessing at a diagnosis.",
      },
    },
    "changes-in-appetite": {
      title: "Create a food and comfort record",
      result: "Show what was offered, what was eaten and which mouth or stomach clues appeared.",
      copy: "Portion, texture and behavior together help the care team see whether the change looks related to appetite, chewing, nausea or comfort.",
      steps: [
        "Measure the portion offered and remaining instead of writing ‘ate less.’",
        "Note food texture, chewing side, dropped food, lip licking, nausea signs and water intake.",
        "Add dated weights, medicine changes and two clear questions for your veterinary visit.",
      ],
      quiz: {
        question: "Which record gives the clearest appetite picture?",
        options: [["a", "She was picky."], ["b", "She ate about half of 1 cup, dropped dry food twice, then ate the softened portion."], ["c", "I changed three foods in one meal."]],
        answer: "b",
        correct: "Correct. Amount, texture and behavior create a specific pattern.",
        retry: "Choose the record with a measured amount and observable eating behavior.",
      },
    },
    "drinking-more-water": {
      title: "Share a measured water and bathroom summary",
      result: "Connect water intake with urination, medicines, appetite and energy.",
      copy: "A measured daily pattern is more useful than an impression—especially after a medicine or food change.",
      steps: [
        "Measure how much water is added and left over during the same 24-hour window.",
        "Record urination frequency, accidents, appetite, energy and any vomiting or diarrhea.",
        "Share the dog's weight, current medicines, start date and the measured pattern with the veterinary team.",
      ],
      quiz: {
        question: "What is the safest useful water check?",
        options: [["a", "Restrict water to see what happens."], ["b", "Measure normal access over 24 hours and record related changes."], ["c", "Wait several weeks before writing anything down."]],
        answer: "b",
        correct: "Correct. Keep water available and measure the ordinary pattern.",
        retry: "Do not restrict water. Choose the option that measures normal access and related changes.",
      },
    },
    "less-interest-in-life": {
      title: "Map the routines that changed",
      result: "Show what your dog stopped choosing—and which lower-effort moments still invite connection.",
      copy: "Daily-life change becomes clearer when it is tied to specific routines, comfort, effort and time of day.",
      steps: [
        "List three familiar routines and mark whether your dog starts, joins briefly or avoids each one.",
        "Offer one lower-effort version and record whether comfort, time or location changes the response.",
        "Share the timeline, sleep, appetite, pain clues, medicines and the routines that disappeared first.",
      ],
      quiz: {
        question: "Which note best describes a daily-life change?",
        options: [["a", "He is depressed."], ["b", "For five evenings he stayed in bed during the family meal but joined when the bed was moved closer."], ["c", "I forced a long walk to test him."]],
        answer: "b",
        correct: "Correct. It names the routine, duration and a lower-effort response.",
        retry: "Choose an observable routine change rather than a diagnosis or forced test.",
      },
    },
    "bathroom-accidents": {
      title: "Prepare a bathroom pattern for the care team",
      result: "Connect timing, urgency, posture, output and the route to the accident.",
      copy: "Accidents can reflect very different problems. The details before and after the event help narrow the next questions.",
      steps: [
        "Record time, last successful trip, urgency, posture, straining, amount and appearance.",
        "Note route length, slipping, stairs, sleep, water intake and medicine changes.",
        "Share photographs only when safe and useful, plus the full event sequence and frequency.",
      ],
      quiz: {
        question: "Which bathroom note is most useful?",
        options: [["a", "Another accident."], ["b", "At 2 a.m. she woke suddenly, strained twice, passed a small amount and slipped on the route outside."], ["c", "I removed her water overnight."]],
        answer: "b",
        correct: "Correct. Timing, effort, amount and mobility describe the event clearly.",
        retry: "Choose the complete sequence; never restrict normal water access to test a symptom.",
      },
    },
    "new-cough-or-breathing-change": {
      title: "Send a breathing-event summary",
      result: "Show when the cough or breathing change happens and what your dog was doing before it began.",
      copy: "Breathing changes deserve precise timing and a low threshold for urgent veterinary care.",
      steps: [
        "When your dog is fully asleep, count chest rises for 30 seconds and double the number; stop if this causes disturbance.",
        "Record posture, effort, sound, duration, activity, temperature and whether gums look normally colored.",
        "Share a safe short video, the resting count, medicines and the exact first date with the veterinary team.",
      ],
      quiz: {
        question: "Which action gives useful breathing context without provoking symptoms?",
        options: [["a", "Exercise the dog until the cough starts."], ["b", "Record a natural event and a calm sleeping respiratory count."], ["c", "Wait if the gums look blue."]],
        answer: "b",
        correct: "Correct. Observe a natural event; never provoke breathing difficulty.",
        retry: "Choose natural observation. Blue or pale gums and breathing distress need emergency care.",
      },
    },
    "unexpected-weight-change": {
      title: "Build a dated weight and intake summary",
      result: "Pair reliable weights with portions, appetite, digestion and muscle changes.",
      copy: "One number can mislead. A dated series plus eating and daily-life details gives the trend meaning.",
      steps: [
        "Use the same reliable scale and record the date, time and weight conditions.",
        "Measure food offered and eaten; note vomiting, diarrhea, chewing, thirst and activity.",
        "Share the weight series, body or muscle changes, medicines and the first date you noticed the difference.",
      ],
      quiz: {
        question: "What makes a weight trend useful?",
        options: [["a", "One estimate from memory."], ["b", "Dated weights from the same scale with intake and related changes."], ["c", "Reducing food before speaking with the veterinarian."]],
        answer: "b",
        correct: "Correct. Consistent measurements and related observations show the direction.",
        retry: "Choose the dated, consistent series; do not change feeding solely to test the trend.",
      },
    },
    "after-a-medicine-change": {
      title: "Create a medicine-response timeline",
      result: "Connect the drug, dose and timing with the exact new change.",
      copy: "A clear before-and-after timeline helps the prescribing team decide what deserves prompt review.",
      steps: [
        "Copy the medicine name, strength, dose, schedule, start date and prescribing clinic from the label.",
        "Record each new sign with time after the dose, food, water, bathroom and alertness changes.",
        "Contact the prescribing team with the timeline before stopping or changing a prescribed medicine unless emergency instructions say otherwise.",
      ],
      quiz: {
        question: "What should you send after a new medicine change?",
        options: [["a", "The label details and a dated symptom timeline."], ["b", "A guess about which drug caused it."], ["c", "A self-selected replacement dose."]],
        answer: "a",
        correct: "Correct. Exact medication details and timing help the prescribing team respond.",
        retry: "Choose the exact label and timeline, not a diagnosis or an unapproved dose change.",
      },
    },
    "new-lump-or-skin-change": {
      title: "Track the same spot consistently",
      result: "Give the care team a dated view of size, surface, location and change.",
      copy: "Consistent photographs and measurements help avoid relying on memory, but they do not identify what a lump is.",
      steps: [
        "Photograph the area in the same light with a ruler beside—not pressing on—the skin.",
        "Record location, size, firmness, heat, redness, discharge, licking, pain and change over time.",
        "Share the first date, dated images and any whole-body changes such as appetite, energy or weight.",
      ],
      quiz: {
        question: "Which record best tracks a skin change?",
        options: [["a", "A dated photo with scale, location and observed changes."], ["b", "Squeezing it to see what comes out."], ["c", "Waiting until it becomes very large."]],
        answer: "a",
        correct: "Correct. Consistent scale and dates create a useful record without disturbing the area.",
        retry: "Choose consistent, non-invasive documentation and arrange veterinary review.",
      },
    },
    "vision-or-hearing-change": {
      title: "Map when and where senses seem different",
      result: "Show whether the change varies by light, location, side or familiar cue.",
      copy: "Context helps distinguish a repeated pattern from one confusing moment and supports a safer home setup.",
      steps: [
        "Record light level, room, distance, side approached and the familiar cue that was missed.",
        "Keep routes predictable and add light or gentle touch cues without startling or testing repeatedly.",
        "Share onset, frequency, navigation changes, eye or ear signs and a safe natural video.",
      ],
      quiz: {
        question: "Which observation is most useful?",
        options: [["a", "He is going blind."], ["b", "At dusk he missed the left-side hand cue three times but followed the same cue in daylight."], ["c", "I startled him repeatedly to test hearing."]],
        answer: "b",
        correct: "Correct. It records light, side, cue and repetition without forcing a response.",
        retry: "Choose a natural, specific pattern rather than a diagnosis or repeated startle test.",
      },
    },
    "mouth-or-dental-pain": {
      title: "Prepare an eating and mouth-comfort summary",
      result: "Connect food texture, chewing behavior and mouth signs to the daily change.",
      copy: "Owners can safely record visible behavior, while a veterinary oral examination determines what is happening.",
      steps: [
        "Record food texture, chewing side, dropped food, meal duration, drooling, pawing and odor.",
        "Photograph only what is visible without forcing the mouth open or touching a painful area.",
        "Share appetite, weight, swelling, bleeding, medicines and the first date the pattern appeared.",
      ],
      quiz: {
        question: "Which mouth-pain record is safest and most useful?",
        options: [["a", "Force the mouth open for a close photograph."], ["b", "Record chewing side, dropped food, texture and visible signs without manipulating the mouth."], ["c", "Wait until the dog stops eating completely."]],
        answer: "b",
        correct: "Correct. Observable eating behavior is useful without causing more discomfort.",
        retry: "Choose non-invasive observation and arrange timely veterinary assessment.",
      },
    },
  };
  const lessonChapters = [...lesson.chapters, fourthChapterMap[lesson.slug]];
  const imgs = chapterImageSets[lesson.slug];
  const profile = publicProfileMap[lesson.slug];
  const mobilityRelated =
    lesson.topic === "Mobility" ||
    /mobility|stiff|slower|joint|pain|stairs|rising|walking/i.test(
      `${lesson.slug} ${lesson.title} ${lesson.intro}`,
    );
  const mobilitySupport = mobilityRelated
    ? `<section class="mobility-bed-path"><div class="wm-wrap"><div><span>WoafyPet Bed + Smart Base</span><h2>Easier entry. Better support.</h2><p>Low entry and orthopedic foam support stiff dogs. Smart Base tracks rest, bed use and weight changes.</p><ul><li>Low front entry</li><li>Orthopedic foam</li><li>Washable cover</li><li>Passive pattern tracking</li></ul><a class="button primary" href="https://www.woafy.pet/smart-bed/">Explore Bed + Smart Base →</a></div><figure class="mobility-bed-system">${image("product-hero-official.png", "Complete WoafyPet Smart Bed resting on its Smart Base")} ${image("product-visualization-smart-base.png", "WoafyPet Smart Base shown separately")}</figure></div></section>`
    : "";
  return page({
    route: `/care-circle/${lesson.slug}/`,
    title: lesson.title,
    description: lesson.intro,
    bodyClass: "lesson-v7 lesson-v8 lesson-v9",
    body: `
    <article><header class="lesson-hero-v7"><div><a class="back-link" href="/care-circle/">← All Care Circle lessons</a><h1>${escapeHtml(lesson.title)}</h1><p>${escapeHtml(lesson.intro)}</p><dl class="public-pet-profile" data-public-pet-profile><div><dt>Dog</dt><dd data-public-dog>${escapeHtml(profile[0])} · ${escapeHtml(profile[1])} · ${escapeHtml(profile[2])}</dd></div><div><dt>Owner-shared conditions</dt><dd data-public-conditions>${escapeHtml(profile[3])}</dd></div><div><dt>What changed</dt><dd data-public-change>${escapeHtml(profile[4])}</dd></div></dl></div><figure>${image(lesson.image, lesson.imageAlt, { eager: true })}</figure></header>
    <aside class="lesson-personal-context"><div class="wm-wrap"><strong>Why this matters for <span data-tailored-pet-name>${escapeHtml(profile[0])}</span></strong><p data-tailored-context>${escapeHtml(profile[0])} is ${escapeHtml(profile[1])}, a ${escapeHtml(profile[2])}, with ${escapeHtml(profile[3])}; the owner reports ${escapeHtml(profile[4])}.</p></div></aside>
    <section class="lesson-owner-actions" data-lesson-owner-actions hidden><div class="wm-wrap"><div><strong>Your public Care Circle post</strong><p>You can remove this post and its public lesson whenever you choose.</p></div><button class="text-button danger" type="button" data-delete-public-lesson>Delete my public post</button><p class="form-note" data-delete-public-note role="status" aria-live="polite"></p></div></section>
    <div class="lesson-chapters-v7">${lessonChapters.map((chapter, index) => `<section id="chapter-${index + 1}" data-lesson-chapter="${index + 1}" data-tailored-part="${index + 1}"><div class="wm-wrap lesson-chapter-layout"><figure>${image(imgs[index], `${chapter.title} for ${lesson.title}`)}</figure><div><h2>${escapeHtml(chapter.title)}</h2><p class="chapter-result" data-tailored-chapter-summary="${index + 1}">${escapeHtml(chapter.result)}</p><p>${escapeHtml(chapter.copy)}</p><ol data-tailored-chapter-steps="${index + 1}">${chapter.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol><fieldset class="chapter-quiz" data-chapter-quiz data-answer="${escapeHtml(chapter.quiz.answer)}" data-correct-message="${escapeHtml(chapter.quiz.correct)}" data-retry-message="${escapeHtml(chapter.quiz.retry)}"><legend>${escapeHtml(chapter.quiz.question)}</legend>${chapter.quiz.options.map(([value, label]) => `<label><input type="radio" name="${lesson.slug}-quiz-${index + 1}" value="${escapeHtml(value)}"><span>${escapeHtml(label)}</span></label>`).join("")}<button type="button" data-check-quiz>Check answer</button><p role="status" aria-live="polite" data-quiz-feedback></p></fieldset></div></div></section>`).join("")}</div>${mobilitySupport}<section class="call-sooner-v7"><div class="wm-wrap"><h2>Call sooner when you see this</h2><p>${escapeHtml(lesson.urgent)}</p>${button("Find care now", "/find-care/")}</div></section></article>`,
  });
}

function wmAccountPage() {
  return page({
    route: "/account/",
    title: "My account and dog profile",
    description:
      "Sign in by email, create a dog profile and ask Care Circle a tailored question.",
    bodyClass: "account-v7",
    body: `
    <section class="account-scene-v8"><div class="account-scene-media"><figure>${image("problem-appetite-owner-and-dogs.jpg", "Dog owner at home caring for two dogs", { eager: true })}</figure><div><h1>Tell us who you care for.</h1><p>One profile keeps their care lessons, records and changes together.</p><ol><li>Add your dog once</li><li>Ask one clear question</li><li>Keep every private lesson here</li></ol></div></div><div class="account-scene-panel"><form class="account-form-v8" data-account-form><header><h2 data-account-form-title>Create your care profile</h2><p>Use Gmail or any email address.</p></header><fieldset><legend>You</legend><div class="form-grid"><label><span>Your name</span><input name="ownerName" autocomplete="name" required maxlength="100"></label><label><span>Email or Gmail</span><input name="email" type="email" autocomplete="email" required maxlength="254"></label></div></fieldset><fieldset><legend>Your dog</legend><div class="form-grid"><label><span>Dog's name</span><input name="petName" autocomplete="off" required maxlength="80"></label><label><span>Age</span><select name="petAge" required><option value="">Choose one</option><option>Under 1 year</option><option>1–3 years</option><option>4–6 years</option><option>7–9 years</option><option>10–12 years</option><option>13–15 years</option><option>16+ years</option></select></label>${dogProfileSelectors("account-profile", "field-wide")}<label class="field-wide"><span>Medicines or recent changes</span><textarea name="medications" maxlength="360" placeholder="Names and recent changes, if any"></textarea></label><label class="field-wide pet-photo-field"><span>Dog profile photo <em>(recommended)</em></span><input type="file" name="petPhoto" accept="image/jpeg,image/png,image/webp" data-pet-photo-input><small>A clear, recent photo helps make your profile and any public Care Circle lesson feel personal.</small><img data-pet-photo-preview alt="Selected dog profile preview" hidden></label></div></fieldset><p class="account-privacy-note">Your care profile stays private. Choose Public or Private separately each time you ask Care Circle.</p><button class="button primary" type="submit" data-account-submit>Save profile and ask my question →</button><p class="form-note" data-account-note role="status" aria-live="polite"></p></form><aside class="account-current-v7" data-account-current hidden><img class="account-pet-photo" data-account-pet-photo alt="Dog profile photo" hidden><h2>Current care profile</h2><dl data-account-profile-summary></dl><section class="account-private-lessons"><header><h2>My private Care Circle lessons</h2><p>Only lessons you chose to keep Private appear here.</p></header><div data-private-lessons-list></div><p data-private-lessons-empty>No private lessons yet.</p></section><div class="account-profile-actions"><button type="button" class="button secondary" data-account-edit>Edit profile →</button><a class="button primary" href="/care-circle/#ask">Ask Care Circle →</a><a class="button secondary" href="/health-timeline/">Open Health Timeline →</a></div><button type="button" class="text-button" data-account-signout>Sign out</button></aside></div></section>`,
  });
}

function wmHealthTimelinePage() {
  return page({
    route: "/health-timeline/",
    title: "My dog's Health Timeline",
    description:
      "Keep veterinary records, known conditions, medicines, weight and daily changes together in one private timeline for your dog.",
    bodyClass: "health-v1",
    body: `
    <section class="health-shell" data-health-root><h1 class="sr-only">My dog's Health Timeline</h1>
      <div class="health-gate" data-health-account-gate hidden><div><h2>Create your dog's care profile first.</h2><p>Your dog's profile keeps every record and change connected to the right care story.</p></div><a class="button primary" href="/account/?next=health">Create profile and continue →</a></div>
      <div class="health-workspace" data-health-workspace hidden>
        <section class="health-hero"><figure>${image("real-companion-moment.jpg", "Dog owner sitting closely with a dog while reviewing its health story", { eager: true })}</figure><div class="health-hero-copy"><p class="health-kicker">Health Timeline</p><h2>Keep <span data-health-pet-name>your dog</span>'s health story in one place.</h2><p>Bring records, medicines, weight and daily changes together—so the pattern is easier to see and explain at the next veterinary visit.</p><div class="health-summary-grid"><div><strong data-health-condition-count>0</strong><span>Known conditions</span></div><div><strong data-health-medicine-count>0</strong><span>Medicines noted</span></div><div><strong data-health-change-count>0</strong><span>Changes logged</span></div></div><div class="health-hero-actions"><a class="button primary" href="#add-record">Add health record →</a><a class="button secondary" href="#log-change">Log a change →</a></div><p class="health-local-note">Private to this browser. You decide what to share.</p></div></section>

        <section class="health-tools">
          <article class="health-form-card" id="add-record"><header><span aria-hidden="true">01</span><div><h2>Add a health record</h2><p>PDF, image, text or CSV · up to 15 MB</p></div></header><form data-health-record-form><div class="form-grid"><label><span>Record date</span><input type="date" name="recordDate" required></label><label><span>Record type</span><select name="recordType" required><option value="">Choose one</option><option>Veterinary visit</option><option>Lab result</option><option>Medication</option><option>Imaging</option><option>Discharge instructions</option><option>Other</option></select></label><label class="field-wide health-file-field"><span>Choose record</span><input type="file" name="recordFile" accept=".pdf,.txt,.csv,.jpg,.jpeg,.png,application/pdf,text/plain,text/csv,image/jpeg,image/png" required><small>Text in TXT and CSV records can be organized automatically. Image and PDF files stay attached to their date and your note.</small></label><label class="field-wide"><span>What should you remember?</span><textarea name="recordNote" maxlength="700" placeholder="Diagnosis shared by the veterinarian, result, new medicine, follow-up date, or question to ask."></textarea></label></div><button class="button primary" type="submit">Save record →</button><p class="form-note" data-health-record-note role="status" aria-live="polite"></p></form></article>

          <article class="health-form-card" id="log-change"><header><span aria-hidden="true">02</span><div><h2>Log a change</h2><p>Add one clear observation at a time.</p></div></header><form data-health-log-form><div class="form-grid"><label><span>Date</span><input type="date" name="logDate" required></label><label><span>Area</span><select name="category" required><option value="">Choose one</option><option>Mobility</option><option>Sleep</option><option>Eating</option><option>Drinking</option><option>Bathroom</option><option>Breathing</option><option>Pain or comfort</option><option>Energy or connection</option><option>Medicine response</option><option>Other</option></select></label><label><span>How noticeable?</span><select name="severity" required><option value="">Choose one</option><option>Mild</option><option>Moderate</option><option>Strong</option></select></label><label><span>Weight <em>(optional)</em></span><input type="number" name="weight" min="0.1" max="300" step="0.1" placeholder="e.g., 28.4"></label><label class="field-wide"><span>What changed?</span><textarea name="observation" required minlength="8" maxlength="700" placeholder="What you saw, when it happened, how often, and what made it easier or harder."></textarea></label><label class="field-wide"><span>Medicine or routine change <em>(optional)</em></span><input name="medicineChange" maxlength="240" placeholder="New dose, missed dose, food change, new ramp, or schedule change"></label></div><button class="button primary" type="submit">Add to timeline →</button><p class="form-note" data-health-log-note role="status" aria-live="polite"></p></form></article>
        </section>

        <section class="health-insights"><div><header><h2>Patterns to bring to the next visit</h2><p>A concise view of what your records and observations mention.</p></header><div class="health-insight-grid"><article><h3>Conditions and record mentions</h3><p data-health-record-mentions>No conditions or record mentions yet.</p></article><article><h3>Changes over time</h3><p data-health-pattern-summary>No repeated care pattern yet.</p></article><article><h3>Weight direction</h3><p data-health-weight-summary>Add two dated weights to see a direction.</p></article></div></div><button class="button secondary" type="button" data-health-print>Print vet-visit summary →</button></section>

        <section class="health-share"><header><h2>Create a vet-ready email.</h2><p>Turn the care profile, dated records, medicines, weights and recent changes into one organized message for your veterinary team.</p></header><form data-health-share-form><div class="form-grid"><label><span>Veterinarian or clinic</span><input data-health-vet-name name="vetName" maxlength="120" placeholder="e.g., Oak Street Animal Hospital"></label><label><span>Veterinary email</span><input data-health-vet-email name="vetEmail" type="email" autocomplete="email" maxlength="254" placeholder="care@clinic.com" required></label><label class="field-wide"><span>Your main question <em>(optional)</em></span><textarea data-health-share-note name="shareNote" maxlength="600" placeholder="What changed, what worries you most, and what decision you need help making."></textarea></label></div><div class="health-share-actions"><button class="button primary" type="button" data-health-email-vet>Download email with records attached →</button><button class="button secondary" type="button" data-health-web-share>Share summary →</button></div><p class="form-note" data-health-share-status role="status" aria-live="polite"></p></form></section>

        <section class="health-timeline-section"><header><div><h2><span data-health-timeline-pet>Your dog</span>'s timeline</h2><p>Newest record first. Open an attachment, edit your profile, or remove an entry whenever you need.</p></div><a class="text-link" href="/account/">Edit dog profile →</a></header><div class="health-empty" data-health-empty><h3>Start with the record already in your hand.</h3><p>Add the latest visit, lab result, medicine note, weight, or change you noticed today.</p></div><div class="health-timeline-list" data-health-records></div></section>
      </div>
    </section>`,
  });
}

function wmLegacyLessonPage(lesson) {
  const destination = `/care-circle/${lesson.slug}/`;
  const html = page({
    route: `/learn/${lesson.slug}/`,
    title: lesson.title,
    description: "This public lesson now lives inside Care Circle.",
    bodyClass: "unified-forward",
    body: `<section class="unified-forward-card"><h1>This lesson is now in Care Circle.</h1><p>Public questions, pet profiles and complete lessons live together.</p>${button("Open the lesson", destination)}</section>`,
  });
  return html.replace(
    "</head>",
    `<meta http-equiv="refresh" content="0;url=${destination}"></head>`,
  );
}

function wmProviderInquiryForm() {
  const regions = [
    "Alberta",
    "Arizona",
    "California",
    "Colorado",
    "District of Columbia",
    "Florida",
    "Georgia",
    "Illinois",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Missouri",
    "Nevada",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "Ohio",
    "Ontario",
    "Oregon",
    "Pennsylvania",
    "Quebec",
    "Tennessee",
    "Texas",
    "Utah",
    "Virginia",
    "Washington",
    "Wisconsin",
    "Online or multiple regions",
    "Other",
  ];
  return `<form class="provider-form-v6" data-provider-inquiry-form data-provider-api="https://www.woafmeow.com/api/provider-inquiry"><h2>List your practice</h2><p>Help pet owners understand who you serve and the best first step to reach you.</p><input name="requestType" type="hidden" value="directory-listing"><label hidden aria-hidden="true">Leave blank<input name="companyWebsite" tabindex="-1" autocomplete="off"></label><div><label><span>Your name</span><input name="contactName" autocomplete="name" required maxlength="100"></label><label><span>Work email</span><input name="email" type="email" autocomplete="email" required maxlength="254"></label><label><span>Practice or service</span><input name="organization" autocomplete="organization" required maxlength="180"></label><label><span>City</span><input name="city" autocomplete="address-level2" required maxlength="120"></label><label><span>Region</span><select name="region" required><option value="">Choose one</option>${regions.map((region) => `<option>${escapeHtml(region)}</option>`).join("")}</select></label><label><span>Service category</span><select name="serviceType" required><option value="">Choose one</option>${directoryCategories.map(([, label]) => `<option>${escapeHtml(label)}</option>`).join("")}<option>Other</option></select></label><label class="wide"><span>Official website or credential page</span><input name="website" type="url" placeholder="https://" required maxlength="500"></label><label class="wide"><span>How can you help pet owners?</span><textarea name="message" required maxlength="1000"></textarea></label></div><label class="consent-row"><input type="checkbox" name="consent" required><span>I am authorized to share these practice details.</span></label><button class="button primary" type="submit">Submit your practice →</button><p class="form-note" data-provider-inquiry-note role="status" aria-live="polite"></p></form>`;
}

function wmDirectoryCard(entry, index = 0, resource = false) {
  const categories = directoryEffectiveCategories(entry.categories || []);
  const region = resource ? "all" : directoryRegion(entry);
  const searchText = [
    entry.title,
    entry.organization,
    entry.coverage,
    entry.address,
    entry.mode,
    entry.summary,
    entry.useWhen,
    ...(entry.categories || []),
  ]
    .filter(Boolean)
    .join(" ");
  const visualAsset = !resource ? entry.asset || entry.brandAsset : "";
  const visualClass = entry.asset
    ? "provider-photo"
    : entry.brandAsset
      ? "provider-logo"
      : "";
  const visualAlt = entry.asset
    ? `${entry.title} published professional or clinic image`
    : entry.brandAlt || `${entry.organization || entry.title} official brand mark`;
  const visual = visualAsset
    ? `<figure class="${visualClass}"><a href="${escapeHtml(entry.url)}" target="_blank" rel="noreferrer">${image(visualAsset, visualAlt, { eager: index < 12 })}</a></figure>`
    : "";
  const sourceType = resource
    ? "Official search directory"
    : entry.asset
      ? "Published provider profile"
      : "Official provider profile";
  const checkedLabel = entry.checked
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${entry.checked}T00:00:00Z`))
    : "";
  return `<article class="provider-card-v6${resource ? " official-resource" : ""}${visualAsset ? " has-photo" : " no-photo"}${entry.brandAsset ? " has-logo" : ""}" data-directory-item ${resource ? "data-directory-resource" : "data-directory-profile"} data-search="${escapeHtml(searchText)}" data-categories="${escapeHtml(categories.join("|"))}" data-region="${escapeHtml(region)}">${visual}<div><span class="provider-source-type">${sourceType}</span><h3>${escapeHtml(entry.title)}</h3>${entry.organization && entry.organization !== entry.title ? `<p class="organization">${escapeHtml(entry.organization)}</p>` : ""}<p class="location">${escapeHtml(directoryDisplayLocation(entry))}</p>${entry.mode ? `<p class="provider-contact">${escapeHtml(entry.mode)}</p>` : ""}${entry.summary ? `<p class="provider-summary">${escapeHtml(entry.summary)}</p>` : ""}<p class="provider-fit"><strong>When this may fit</strong>${escapeHtml(entry.useWhen || entry.summary || "")}</p>${checkedLabel ? `<span class="provider-checked">Official source checked ${escapeHtml(checkedLabel)}</span>` : ""}<a href="${escapeHtml(entry.url)}" target="_blank" rel="noreferrer">${resource ? "Open official directory" : "Open official profile"} →</a></div></article>`;
}

function wmFindCarePage() {
  const regions = [
    ...new Set(
      directoryProfiles
        .map(directoryRegion)
        .filter((region) => region && region !== "Other"),
    ),
  ].sort();
  const careTypes = [
    ["all", "All care"],
    ["senior-veterinarians", "Veterinarians"],
    ["pain-mobility-rehab", "Mobility & rehabilitation"],
    ["nutrition-weight", "Nutrition & weight"],
    ["behavior-anxiety", "Behavior & nighttime"],
    ["emergency-vets", "Emergency care"],
    ["specialty-hospitals", "Specialty hospitals"],
    ["hospice-palliative-care", "Hospice & comfort"],
    ["in-home-euthanasia", "In-home goodbye"],
    ["grief-counselors", "Grief support"],
    ["memorial-aftercare", "Aftercare"],
  ];
  return page({
    route: "/find-care/",
    title: "Find dog care",
    description:
      "Explore 500+ official-source veterinary profiles and care directories by care type and region.",
    bodyClass: "find-care-v6 find-care-v7",
    body: `
    <section class="directory-hero-v6"><header class="directory-hero-heading"><span>500+ OFFICIAL-SOURCE PROFILES</span><h1>Find trusted care for your dog.</h1><p>Choose the support and region. Compare published location, phone and service details, then open the provider's official page.</p></header><div class="directory-selectors" data-directory-controls><label><span>Care type</span><select data-directory-category>${careTypes.map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select></label><label><span>State or region</span><select data-directory-region><option value="all">All states and regions</option>${regions.map((region) => `<option value="${escapeHtml(region)}">${escapeHtml(region)}</option>`).join("")}</select></label><button class="button primary directory-apply" type="button" data-directory-apply>Show matching care →</button><p class="directory-control-status" aria-live="polite"><strong data-directory-profile-count></strong> and <strong data-directory-resource-count></strong> ready to review.</p></div><figure>${image("guide-vet-care-brown-dog.jpg", "Real dog receiving attentive veterinary care", { eager: true })}</figure></section>
    <section class="emergency-strip-v6"><div class="wm-wrap"><div>${icon("care")}<p><strong>Trouble breathing, collapse, repeated unproductive retching, seizure, severe bleeding, inability to urinate or sudden inability to stand needs immediate veterinary care.</strong></p></div><button type="button" data-directory-filter="emergency-vets">Show emergency care</button></div></section>
    <section class="directory-results-v6" data-directory-results><div class="wm-wrap">${editorialHeading("Care matched to your choices.", "Open a profile or directory to confirm services, hours and the best first step.")}<div class="provider-grid-v6">${directoryProfiles.map((entry, index) => wmDirectoryCard(entry, index)).join("")}${directoryResources.map((entry, index) => wmDirectoryCard(entry, index, true)).join("")}</div><p class="care-directory-empty" data-directory-profile-empty hidden>No option matches both selections. Try another region or care type.</p><button class="button secondary care-directory-more" type="button" data-directory-load-more>Search more →</button></div></section>
    <section class="directory-note-v6"><div class="wm-wrap"><p><strong>What “source checked” means:</strong> each profile links to a provider-published page and shows the date that source was checked. It is not a clinical endorsement. Confirm credentials, hours, prices, referral requirements and availability directly.</p></div></section>
    <section class="practice-band-v6" id="list-your-practice"><div class="wm-wrap"><figure>${image("real-companion-moment.jpg", "Caregiver sitting beside a dog while considering professional support")}</figure>${wmProviderInquiryForm()}</div></section>`,
  });
}

function wmPetLossPage() {
  const steps = [
    [
      "Record today's reality",
      "Write appetite, water, breathing, mobility, sleep, bathroom comfort and the routines your dog still enjoys.",
    ],
    [
      "Call the right team",
      "Save the numbers for primary care, after-hours help, hospice, home visits and appointments.",
    ],
    [
      "Make a one-week comfort plan",
      "Confirm medicines, food and water access, toileting, movement, sleep and the signs that mean the plan needs review.",
    ],
    [
      "Prepare the day",
      "Ask what will happen before, during and after; who may be present; and what your family wants to bring.",
    ],
    [
      "Confirm aftercare",
      "Discuss transport, identity handling, cremation or burial, timing, costs and the keepsakes you may want.",
    ],
    [
      "Protect the first 72 hours",
      "Choose who will tell others, pause nonessential decisions, plan for children and other animals, and keep support close.",
    ],
  ];
  return page({
    route: "/pet-loss-support/",
    title: "Pet loss support",
    description:
      "Compassionate, specific guidance for comfort planning, goodbye decisions, aftercare, and the first days of grief.",
    bodyClass: "loss-v6 loss-v7",
    body: `
    <section class="loss-hero-v6"><div><h1>Take the next step gently.</h1><p>Start with the moment you are in. Make today more comfortable, prepare the questions that matter, and take the next decision one step at a time.</p><a class="button primary" href="#choose">Show me where to start →</a></div><figure>${image("real-pet-loss-support.jpg", "Caregiver holding a beloved dog close", { eager: true })}</figure></section>
    <section class="loss-choose" id="choose"><div class="wm-wrap">${editorialHeading("What are you facing today?", "Choose the closest moment. You can move between these paths at any time.")}<div><a href="#comfort"><strong>Comfort is changing</strong><span>Prepare today's plan →</span></a><a href="#goodbye"><strong>A goodbye may be near</strong><span>Know what to ask →</span></a><a href="#after"><strong>The loss has happened</strong><span>Get through the first days →</span></a></div></div></section>
    <section class="loss-journey"><div class="wm-wrap">${editorialHeading("Six steps, taken at your pace", "Use only the step that helps right now.")}<div>${steps.map(([title, copy], index) => `<article${index === 0 ? ' id="comfort"' : index === 3 ? ' id="goodbye"' : index === 5 ? ' id="after"' : ""}><span>0${index + 1}</span><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(copy)}</p></div></article>`).join("")}</div></div></section>
    <section class="loss-goodbye-detail" aria-labelledby="goodbye-detail-title"><div class="wm-wrap"><header><h2 id="goodbye-detail-title">Prepare for the goodbye without losing the moment.</h2><p>You can ask for clarity, choose what feels right for your family and change your mind about small details.</p></header><div><article><h3>Before</h3><ul><li>Ask what your dog may feel and how comfort is maintained.</li><li>Choose who will be present and where everyone can sit.</li><li>Bring a blanket, favorite treat or a short letter if that feels right.</li></ul></article><article><h3>During</h3><ul><li>Ask the care team to explain each step before it happens.</li><li>Take the time you need to say their name, touch them and be close.</li><li>Let the team know if you need a pause or more privacy.</li></ul></article><article><h3>After</h3><ul><li>Confirm identity handling, timing and who will contact you.</li><li>Request a paw print, fur clipping or other keepsake before leaving.</li><li>Choose one person to handle messages and practical follow-up.</li></ul></article></div><figure>${image("real-home-owner-dog.jpg", "A caregiver sharing a quiet moment at home with a beloved dog")}</figure></div></section>
    <section class="loss-first-days"><div class="wm-wrap"><header><h2>What helps in the first days after loss.</h2><p>Grief changes by the hour. Use what helps; leave the rest for later.</p></header><div><article><figure>${image("real-golden-forest.jpg", "Golden retriever remembered during the first days after loss")}</figure><h3>Protect the first 24 hours</h3><p>Choose one person for calls. Eat, drink water and delay decisions that can wait.</p></article><article><figure>${image("real-holding-dog.jpg", "A caregiver holding a beloved dog close")}</figure><h3>Help children and other pets</h3><p>Use clear words. Keep familiar routines. Let every family member grieve differently.</p></article><article><figure>${image("real-memorial-tree-planting.jpg", "Hands planting a living memorial tree")}</figure><h3>Keep what feels like them</h3><p>Save one object, photo, voice note or story. There is no deadline.</p><a class="text-link" href="/memorial-tree/">Plant a memorial tree →</a></article></div></div></section>
    <section class="loss-words"><div class="wm-wrap image-text"><figure>${image("real-comfort-hug.jpg", "Caregiver holding a dog close while seeking support")}</figure><div><h2>When the words are hard, start here.</h2><span class="loss-script-label">Words you can use</span><p class="loss-call-script">My dog's comfort has changed. I need help understanding what is urgent, what can be made easier today, and what choices we may need to prepare for.</p><a class="text-link" href="/find-care/?care=hospice-palliative-care">Find hospice and comfort care →</a></div></div></section>
    <section class="loss-support-v6"><div class="wm-wrap"><article><h2>Professional grief support</h2><p>Find counselors, social workers and support programs with pet-loss experience.</p><a href="/find-care/?care=grief-counselors">Find grief support →</a></article><article><h2>Aftercare</h2><p>Compare cremation, burial, keepsakes and memorial options without rushing the choice.</p><a href="/find-care/?care=memorial-aftercare">Find aftercare →</a></article><article><h2>A living tribute</h2><p>When the time feels right, plant a memorial tree in your dog's name.</p><a href="/memorial-tree/">Memorial tree →</a></article></div></section>`,
  });
}

function wmMemorialPage() {
  return page({
    route: "/memorial-tree/",
    title: "Memorial tree",
    description:
      "Plant a living memorial tree in your dog's name and carry their story forward.",
    bodyClass: "memorial-v6 memorial-v7",
    body: `
    <section class="memorial-hero-v6"><figure>${image("real-memorial-tree-planting.jpg", "Hands planting a young memorial tree", { eager: true })}</figure><div><span class="memorial-eyebrow">A LIVING TRIBUTE</span><h1>Let their love keep growing.</h1><p>Plant a community-grown tree in your dog's name and keep a memorial confirmation carrying the words your family never wants to lose.</p><div class="memorial-hero-proof"><span>Their name</span><span>Your memory</span><span>One living tree</span></div><button class="button primary" type="button" data-tree-purchase-open>Plant their memorial tree →</button><small>Secure $10 Stripe checkout. Card details never touch WoafMeow.</small></div></section>
    <section class="memorial-meaning"><div class="wm-wrap"><div><span class="memorial-eyebrow">WHY A TREE</span><h2>Turn their love into something living.</h2><p>Their bowl may be gone. Their spot may feel too quiet. A memorial tree turns the name you still say into new roots, shade and life.</p><strong class="memorial-words-label">Words you can carry forward</strong><p class="memorial-wording">You changed our home, our routines and the way we understood love. Let something beautiful keep growing in your name.</p><button class="button secondary" type="button" data-tree-purchase-open>Begin their tribute →</button></div><figure>${image("real-companion-moment.jpg", "A quiet moment between a caregiver and a beloved dog")}</figure></div></section>
    <section class="memorial-story-grid"><div class="wm-wrap"><header><span class="memorial-eyebrow">WHAT YOUR TRIBUTE HOLDS</span><h2>Remember the life, not only the loss.</h2><p>Begin with one detail only your family would know.</p></header><div><article><figure>${image("bobby.jpg", "Bobby, a beloved dog remembered by WoafMeow")}</figure><h3>Carry their name</h3><p>The planting request begins with the name that changed your family.</p></article><article><figure>${image("real-holding-dog.jpg", "A dog owner holding a beloved companion close")}</figure><h3>Keep one true memory</h3><p>Save the habit, look or ordinary moment you never want time to blur.</p></article><article><figure>${image("real-golden-outdoors.jpg", "A dog outdoors in a place filled with life")}</figure><h3>Let new life answer loss</h3><p>Your tribute supports a community-grown tree in the West Usambara Mountains.</p></article></div></div></section>
    <section class="memorial-memory-prompts"><div class="wm-wrap"><header><span class="memorial-eyebrow">START WITH ONE SENTENCE</span><h2>What do you never want to forget?</h2><p>Your memory does not need to sound perfect. It only needs to sound like them.</p></header><div><p>“The way you waited at the window before every walk.”</p><p>“The warm spot beside the sofa that will always feel like yours.”</p><p>“How one look from you made an ordinary day complete.”</p></div><button class="button primary" type="button" data-tree-purchase-open>Write their name into something living →</button></div></section>
    <section class="memorial-partner"><div class="wm-wrap"><header><span class="memorial-eyebrow">WHERE THE TREE GROWS</span><h2>Community-grown. Clearly documented.</h2><p>Friends of Usambara works with local nurseries, schools, farmers and communities in the West Usambara Mountains, while publishing a broader goal to support other Eastern Arc landscapes and East Africa.</p></header><div class="memorial-partner-gallery"><figure>${image("usambara-community-planting.jpg", "Friends of Usambara community members planting trees")}</figure><figure>${image("usambara-sapling-planting.jpg", "Hands planting a young tree with Friends of Usambara")}</figure><figure>${image("usambara-school-nursery.jpg", "Students participating in a Friends of Usambara tree nursery")}</figure><figure>${image("usambara-mangrove-planting.jpg", "Community planting work supported by Friends of Usambara")}</figure></div><div class="partner-proof-grid"><article><strong>15 million+</strong><span>Seedlings stocked across four mega nurseries, reported by the partner</span></article><article><strong>4 mega nurseries</strong><span>Locally grown seedlings for restoration</span></article><article><strong>20 school nurseries</strong><span>Young people helping trees take root</span></article></div><a class="text-link" href="https://usambaratravels.com/where-we-plant/" target="_blank" rel="noreferrer">See Friends of Usambara's planting work →</a></div></section>
    <section class="memorial-steps"><div class="wm-wrap"><div class="memorial-tribute-card"><span>Example tribute</span><h2>Bailey</h2><p>You made every ordinary walk feel like the best part of the day.</p><div>${image("real-golden-forest.jpg", "Golden retriever remembered with a living tree tribute")}</div></div><div class="memorial-steps-copy"><span class="memorial-eyebrow">A TRIBUTE YOU CAN KEEP</span><h2>Their memory. A growing tree.</h2><p>Share the words you never want to lose. We connect that memory to a community-grown tree and send a memorial confirmation you can keep or share with family.</p><ol><li><span>1</span><div><strong>Tell us their name</strong><p>Add one story, habit or sentence that still feels like them.</p></div></li><li><span>2</span><div><strong>Complete secure payment</strong><p>Stripe collects the $10 payment; no card details are stored by WoafMeow.</p></div></li><li><span>3</span><div><strong>Keep the confirmation</strong><p>After Stripe confirms payment, we email a memorial record carrying their name and your message.</p></div></li></ol><button class="button primary" type="button" data-tree-purchase-open>Plant their memorial tree →</button><p class="memorial-checkout-status" data-checkout-status role="status" aria-live="polite"></p></div></div></section>
    <dialog class="tree-purchase-dialog" data-tree-purchase><button type="button" class="tree-dialog-close" data-tree-purchase-close aria-label="Close">×</button><div class="tree-dialog-shell"><aside class="tree-dialog-emotion"><figure>${image("real-pet-loss-support.jpg", "A caregiver holding a beloved dog close")}</figure><div><span class="memorial-eyebrow">A LIVING TRIBUTE</span><h2>Let something living carry their name.</h2><p>One tree. One memory. A lasting place for the love that still belongs to your family.</p><ul><li>Planted in their name</li><li>Your words preserved</li><li>Memorial confirmation emailed</li></ul></div></aside><div class="tree-dialog-form-panel"><span class="memorial-eyebrow">TELL US WHO YOU'RE REMEMBERING</span><h2>Plant their memorial tree</h2><p class="tree-price">$10 per tree</p><p class="tree-dialog-intro">Write the detail only your family would know. We will carry it into the memorial record.</p><form class="preview-form" data-preview-form data-checkout-form data-submit-api="${BACKEND_ORIGIN}/api/memorial-tree-checkout" data-form-title="Memorial tree checkout"><div class="form-grid"><label><span>Your name</span><input name="name" autocomplete="name" required minlength="2" maxlength="100"></label><label><span>Email for confirmation</span><input name="email" type="email" autocomplete="email" required maxlength="254"></label><label><span>Their name</span><input name="petName" required minlength="1" maxlength="80"></label><label class="field-wide"><span>What do you never want to forget?</span><textarea name="meaning" required minlength="12" maxlength="600" placeholder="The way they greeted me at the door every single day..."></textarea></label></div><button class="button primary" type="submit">Plant their tree now — $10 →</button><p class="tree-secure-note">Secure Stripe checkout. WoafMeow never stores card details.</p><p class="form-note" data-form-note role="status" aria-live="polite"></p></form></div></div></dialog>`,
  });
}

function wmWednesdayPage() {
  return page({
    route: "/wednesday-introductions/",
    title: "Wednesday introductions",
    description:
      "Request one private, offline introduction to a nearby dog owner facing something similar.",
    bodyClass: "match-v6",
    body: `
    <section class="match-hero-v6"><div><h1>Meet someone who gets it.</h1><p>Tell us what you and your dog are going through. We look for one nearby owner facing something similar, then both people choose whether to connect.</p><a class="button primary" href="#introduction-request">Request an introduction →</a></div><figure>${image("community-owner-match.jpg", "Dog owners talking together in a calm public place", { eager: true })}</figure></section>
    <section class="match-how"><div class="wm-wrap image-text"><figure>${image("real-companion-moment.jpg", "Two people and a dog spending time together outdoors")}</figure><div><h2>One thoughtful introduction at a time.</h2><ol><li><span>1</span><div><strong>Tell us what would help</strong><p>Share the care issue, where you are and the conversation you need.</p></div></li><li><span>2</span><div><strong>AI-assisted matching ranks the closest fits</strong><p>It compares issue, location, availability and preferred first contact.</p></div></li><li><span>3</span><div><strong>Our team reviews the match</strong><p>We check that both requests align before anyone is introduced.</p></div></li><li><span>4</span><div><strong>Both people opt in by email</strong><p>When both agree, we send one private introduction so you can choose the first step.</p></div></li></ol></div></div></section>
    <section class="match-issues"><div class="wm-wrap">${editorialHeading("Find someone living through something similar", "A useful introduction begins with the part of daily care that feels hardest.")}<div>${[
      ["Mobility & stiffness", "problem-mobility-senior-lab.jpg"],
      ["Restless nights", "problem-restless-night-dog-sleeping.jpg"],
      ["Eating & weight", "problem-appetite-owner-offering-food.jpg"],
      ["Daily care & connection", "problem-daily-routine-senior-dark-dog.jpg"],
    ]
      .map(
        ([title, asset]) =>
          `<article><figure>${image(asset, title)}</figure><h3>${title}</h3></article>`,
      )
      .join("")}</div></div></section>
    <section class="match-form-section" id="introduction-request"><div class="wm-wrap"><div><h2>Who would help you feel understood?</h2></div><form class="match-form-v6 preview-form" data-preview-form data-owner-match-form data-submit-api="https://www.woafmeow.com/api/contact" data-success-message="Your introduction request is with the WoafMeow team." data-form-title="Wednesday introduction"><input type="hidden" name="requestType" value="owner-match"><input type="hidden" name="topic" value="wednesday-match"><input type="hidden" name="matchingMode" value="AI-assisted ranking"><input type="hidden" name="reviewState" value="pending-team-review"><input type="hidden" name="notificationWorkflow" value="email double opt-in"><input type="hidden" name="rankingSignals" value="issue|location|availability|first-contact|match-goal"><div class="form-grid"><label><span>Name</span><input name="name" autocomplete="name" required></label><label><span>Email</span><input name="email" type="email" autocomplete="email" required></label><label><span>ZIP or postal code</span><input name="zip" autocomplete="postal-code" required></label><label><span>Your dog's age</span><select name="dogAge" required><option value="">Choose one</option><option>Under 1 year</option><option>1–3 years</option><option>4–6 years</option><option>7–9 years</option><option>10–12 years</option><option>13–15 years</option><option>16+ years</option></select></label><label><span>What are you navigating?</span><select name="issue" required><option value="">Choose one</option><option>Mobility or stiffness</option><option>Restless nights</option><option>Eating, drinking or weight</option><option>Bathroom changes</option><option>Daily care or connection</option><option>Other</option></select></label><label><span>When are you usually available?</span><select name="availability" required><option value="">Choose one</option><option>Weekday mornings</option><option>Weekday afternoons</option><option>Weekday evenings</option><option>Weekends</option><option>Flexible</option></select></label><label><span>How would you like to begin?</span><select name="contact" required><option value="">Choose one</option><option>Owner-only phone call</option><option>Coffee in a public place</option><option>Calm public walk</option><option>Open to any</option></select></label><label><span>What kind of match would feel most useful?</span><select name="matchGoal" required><option value="">Choose one</option><option>Someone facing the same care issue</option><option>Someone a few steps ahead</option><option>Someone nearby for ongoing support</option><option>Someone who understands pet loss</option></select></label><label class="field-wide"><span>What would make the conversation useful?</span><textarea name="message" maxlength="500" required></textarea></label></div><label class="consent-row"><input type="checkbox" name="consent" required><span>I agree to be contacted by email about a possible introduction.</span></label><button class="button primary" type="submit">Request my introduction →</button><p class="form-note" data-form-note role="status" aria-live="polite"></p></form></div></section>
    <section class="match-faq"><div class="wm-wrap"><h2>Questions before you join</h2><details><summary>How are introductions chosen?</summary><p>We compare the care issue, location, availability and the kind of conversation each person wants.</p></details><details><summary>When are details shared?</summary><p>Only after each person has reviewed the introduction and chosen to connect.</p></details><details><summary>What happens first?</summary><p>Most people begin with an owner-only call or coffee, then decide whether a public walk feels useful.</p></details></div></section>`,
  });
}

function wmSmartBedPage() {
  return page({
    route: "/smart-bed/",
    title: "WoafyPet Smart Bed",
    description:
      "Supportive comfort for senior dogs with quiet insights into rest, night movement, bed use and weight trend.",
    bodyClass: "bed-v6 bed-v7",
    body: `
    <section class="bed-hero-v6"><div><span>WoafyPet Smart Bed</span><h1>Support stiff joints. Track rest changes.</h1><p>Orthopedic comfort with quiet Smart Base tracking.</p>${button("Explore Bed + Smart Base", "https://www.woafy.pet/smart-bed/")}</div><figure class="bed-system-media"><div>${image("product-hero-official.png", "Complete WoafyPet Smart Bed resting on its Smart Base", { eager: true })}<strong>Full Smart Bed</strong></div><div>${image("smart-base.webp", "WoafyPet Smart Base shown separately", { eager: true })}<strong>Smart Base</strong></div></figure></section>
    <section class="bed-comfort-v6"><div class="wm-wrap"><figure>${image("product-prototype-akita.webp", "Complete WoafyPet prototype bed with a dog resting comfortably")}</figure><div><h2>Low entry. Stable support.</h2><div class="bed-benefits"><article><strong>Low entry</strong><span>Easier access</span></article><article><strong>Bolsters</strong><span>Support for settling</span></article><article><strong>Orthopedic foam</strong><span>Joint pressure relief</span></article><article><strong>Washable cover</strong><span>Simple daily care</span></article></div></div></div></section>
    <section class="bed-layers-v7"><div class="wm-wrap"><div><h2>Five layers. One complete system.</h2><ol><li><strong>Washable cover</strong><span>Everyday comfort</span></li><li><strong>Comfort foam</strong><span>Surface relief</span></li><li><strong>Orthopedic core</strong><span>Stable support</span></li><li><strong>Smart Base</strong><span>Rest and weight trends</span></li><li><strong>Non-slip base</strong><span>Steadier entry</span></li></ol></div><figure>${image("bed-layers.png", "Layer visualization of the WoafyPet Smart Bed foam and sensing system")}</figure></div></section>
    <section class="bed-insights-v6"><div class="wm-wrap"><div><h2>Track rest. Flag discomfort.</h2><p>No collar or camera.</p><div class="metric-grid"><article><span>Rest</span><strong>Total duration</strong></article><article><span>Night</span><strong>Wake-ups</strong></article><article><span>Heart rate</span><strong>Resting trend</strong></article><article><span>Weight</span><strong>Longer trends</strong></article></div>${button("Explore Smart Base", "https://www.woafy.pet/smart-base/")}</div><figure>${image("product-visualization-smart-base.png", "WoafyPet Smart Base passive wellness insight system")}</figure></div></section>
    <section class="bed-boundary-v6"><div class="wm-wrap"><h2>Awareness, not diagnosis.</h2><p>Use pattern changes to prepare a clearer veterinary conversation.</p></div></section>`,
  });
}

function wmSmartBasePage() {
  return page({
    route: "/smart-base/",
    title: "WoafyPet Smart Base",
    description:
      "Quiet sensing beneath the bed for rest duration, night movement, bed use and weight trend.",
    bodyClass: "base-v6",
    body: `
    <section class="base-hero-v6"><div><span>WoafyPet Smart Base</span><h1>Track rest without another wearable.</h1><p>The sensing layer sits beneath the bed and turns repeated use into a calmer weekly view.</p>${button("Explore the complete bed", "https://www.woafy.pet/smart-bed/")}</div><figure>${image("product-visualization-smart-base.png", "WoafyPet Smart Base product visualization", { eager: true })}</figure></section>
    <section class="base-flow"><div class="wm-wrap">${editorialHeading("From ordinary rest to a useful pattern", "No collar. No camera. No constant checking.")}<div><article><span>1</span><h2>Your dog rests normally</h2></article><article><span>2</span><h2>The base follows repeated patterns</h2></article><article><span>3</span><h2>You see a simple weekly summary</h2></article><article><span>4</span><h2>You decide what deserves attention</h2></article></div></div></section>
    <section class="base-visual"><div class="wm-wrap image-text"><figure>${image("bed-layers.png", "Exploded visualization of the WoafyPet bed and Smart Base")}</figure><div><h2>Four signals, one clearer conversation.</h2><ul><li>Rest duration</li><li>Night movement</li><li>Resting heart rate</li><li>Weight trend</li></ul><p>Look for sustained change, then bring the timeline and the whole daily routine to the professional who knows your dog.</p></div></div></section>`,
  });
}

function wmAboutPage() {
  return page({
    route: "/about/",
    title: "Bobby's story",
    description:
      "The story of Bobby, Robert, and why WoafMeow exists for the quiet changes families can miss.",
    bodyClass: "about-v6",
    body: `
    <section class="bobby-hero"><figure>${image("bobby.jpg", "Bobby, Robert Luo's Alaskan Malamute and the dog who inspired WoafMeow", { eager: true })}</figure><div><span>BOBBY'S STORY</span><h1>Bobby was eight when joint cancer took him.</h1><p>I’m Robert Luo—Bobby’s person. He was my family, my shadow and the reason WoafMeow exists.</p></div></section>
    <section class="bobby-letter"><div class="reading-width"><p class="drop-cap">The hardest truth is that we did not understand Bobby’s health change in time. Like so many dogs, he was very good at hiding pain. He kept following us, greeting us and being himself—until he could not anymore.</p><p>I still replay the small moments. A slower rise. A pause before moving. A night that did not look quite right. We loved him completely, but we did not yet know how much those quiet changes could mean.</p><blockquote>I cannot give Bobby those days back. I can help another family notice sooner.<cite>— Robert Luo, Bobby’s person and WoafMeow co-founder</cite></blockquote><p>I built WoafMeow so a dog parent can bring one ordinary change and leave with clearer observations, safer next steps and a better conversation with the veterinarian who knows their dog.</p><p>WoafyPet comes from the same promise: support aging joints now, and quietly follow rest patterns that may help a family recognize when something has changed.</p><p>Bobby’s life was much bigger than the way he died. He was proud, gentle, funny and always close. Everything here is built from the love he gave us—and from the help I wish we had while he was still beside me.</p></div></section>
    <section class="bobby-purpose"><div class="wm-wrap"><header><span>OUR MISSION · HOW WE HELP</span><h2><span>Understand the change.</span><span>Care for the whole bond.</span></h2><p>WoafMeow turns quiet changes into understanding, support and a kinder next step—so dogs can be cared for as whole lives, not symptoms.</p></header><div><article><strong>01</strong><h3>Notice with less fear</h3><p>Turn “something feels different” into a clear observation and a useful question for your care team.</p></article><article><strong>02</strong><h3>Find someone who understands</h3><p>Reach professional care, practical resources and another owner who has lived this kind of day.</p></article><article><strong>03</strong><h3>Honor the whole bond</h3><p>Support comfort, connection, goodbye and remembrance without turning vulnerable moments into sales pressure.</p></article></div><a class="button primary" href="/care-circle/">See how Bobby’s story helps today →</a></div></section>
    <section class="bobby-closing"><p>I still miss Bobby.<br>I’m building the help I wish we had sooner.</p><a class="text-link" href="/support/">Tell me about your dog →</a></section>`,
  });
}

function wmSupportPage() {
  return page({
    route: "/support/",
    title: "Contact WoafMeow",
    description:
      "Contact the WoafMeow team directly with a question, concern or story about your dog.",
    bodyClass: "support-v6 contact-v8",
    body: `
    <section class="contact-direct"><figure>${image("problem-appetite-owner-and-dogs.jpg", "A dog owner at home with two dogs", { eager: true })}</figure><div><span>CONTACT US</span><h1><span>Contact us.</span><span>Talk to a real person.</span></h1><p>Tell us what is happening or what your dog means to you.</p><form class="preview-form" data-preview-form data-submit-api="https://www.woafmeow.com/api/contact" data-success-message="Your message is with the WoafMeow team." data-form-title="WoafMeow contact"><input type="hidden" name="requestType" value="contact"><label><span>Name <em>(optional)</em></span><input name="name" autocomplete="name" maxlength="100"></label><label><span>Email</span><input name="email" type="email" autocomplete="email" maxlength="254" required></label><label><span>Message</span><textarea name="message" required minlength="12" maxlength="1200" placeholder="How can we help?"></textarea></label><button class="button primary" type="submit">Send message →</button><p class="contact-privacy">We will only use your email to reply.</p><p class="form-note" data-form-note role="status" aria-live="polite"></p></form></div></section>`,
  });
}

function legalPage(route, title, intro, sections) {
  return page({
    route,
    title,
    description: intro,
    bodyClass: "legal-page",
    body: `<section class="page-intro compact"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(intro)}</p></section><section class="section no-top"><div class="legal-content">${sections.map(([heading, copy]) => `<section><h2>${escapeHtml(heading)}</h2>${copy}</section>`).join("")}</div></section>`,
  });
}

const pages = [
  { route: "/", html: wmHomePage() },
  { route: "/smart-bed/", html: wmSmartBedPage() },
  { route: "/smart-base/", html: wmSmartBasePage() },
  { route: "/care-path/", html: wmCarePathPage() },
  { route: "/guide/", html: wmGuidePage() },
  { route: "/learn/", html: wmLearnPage() },
  { route: "/care-circle/", html: wmCareCirclePage() },
  ...lessons.map((lesson) => ({
    route: `/care-circle/${lesson.slug}/`,
    html: wmLessonPage(lesson),
  })),
  ...lessons.map((lesson) => ({
    route: `/learn/${lesson.slug}/`,
    html: wmLegacyLessonPage(lesson),
  })),
  { route: "/account/", html: wmAccountPage() },
  { route: "/health-timeline/", html: wmHealthTimelinePage() },
  { route: "/find-care/", html: wmFindCarePage() },
  { route: "/pet-loss-support/", html: wmPetLossPage() },
  { route: "/memorial-tree/", html: wmMemorialPage() },
  { route: "/wednesday-introductions/", html: wmWednesdayPage() },
  { route: "/about/", html: wmAboutPage() },
  { route: "/support/", html: wmSupportPage() },
  {
    route: "/privacy/",
    html: legalPage(
      "/privacy/",
      "Privacy",
      "WoafMeow collects only the information needed to answer a request or deliver a service you choose.",
      [
        [
          "Information you choose to share",
          "<p>Contact, guide, listing, memorial, and introduction requests use the details entered in their respective forms.</p>",
        ],
        [
          "How information is used",
          "<p>WoafMeow uses submitted details to respond to the selected request, operate the requested service, improve the care experience, and meet legal or security obligations.</p>",
        ],
        [
          "Separate choices",
          "<p>Guide delivery, Wednesday introductions, service requests, product research, and marketing consent remain separate choices.</p>",
        ],
        [
          "Sensitive situations",
          "<p>WoafMeow minimizes collection and does not use grief-support information for product marketing.</p>",
        ],
      ],
    ),
  },
  {
    route: "/terms/",
    html: legalPage(
      "/terms/",
      "Terms",
      "This website provides educational content, resource directories, and optional community introductions.",
      [
        [
          "Education",
          "<p>Care content is general education and does not replace a qualified professional who knows the individual animal.</p>",
        ],
        [
          "Product information",
          "<p>WoafyPet specifications, measurements, features, and product visuals may change as engineering, safety, manufacturing, and quality work continues.</p>",
        ],
        [
          "Introductions",
          "<p>Wednesday introductions are optional, double-confirmed owner connections. Each participant remains responsible for their own decisions and safety.</p>",
        ],
      ],
    ),
  },
  {
    route: "/accessibility/",
    html: legalPage(
      "/accessibility/",
      "Accessibility",
      "WoafMeow is designed to be understandable and usable across devices, input methods, and changing abilities.",
      [
        [
          "Accessible foundations",
          "<p>The website uses semantic headings, keyboard-accessible navigation, visible focus, descriptive image text, labeled forms, scalable type, reduced-motion support, and responsive layouts.</p>",
        ],
        [
          "Ongoing review",
          "<p>Automated and manual checks cover keyboard use, zoom, contrast, screen-reader structure, image alternatives, and form errors.</p>",
        ],
        [
          "Feedback",
          "<p>Use the Support page to report an accessibility problem or request help with any part of the website.</p>",
        ],
      ],
    ),
  },
];

const useDeployedBackend = (html) =>
  html.replaceAll("https://www.woafmeow.com/api/", `${BACKEND_ORIGIN}/api/`);

if (
  !existsSync(join(ROOT, "styles.css")) ||
  !existsSync(join(ROOT, "app.js"))
) {
  throw new Error("Missing styles.css or app.js beside build-site.mjs");
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
const distAssets = join(DIST, "assets");
mkdirSync(distAssets, { recursive: true });
const usedAssetNames = new Set(
  pages.flatMap(({ html }) =>
    [...html.matchAll(/src="\/assets\/([^"?#]+)"/g)].map((match) => match[1]),
  ),
);
for (const assetName of usedAssetNames) {
  cpSync(join(ROOT, "assets", assetName), join(distAssets, assetName));
}
cpSync(
  join(ROOT, "assets", GUIDE_PDF_NAME),
  join(distAssets, GUIDE_PDF_NAME),
);
cpSync(
  join(ROOT, "assets", "PROVENANCE.md"),
  join(distAssets, "PROVENANCE.md"),
);
cpSync(join(ROOT, "styles.css"), join(DIST, "styles.css"));
cpSync(join(ROOT, "app.js"), join(DIST, "app.js"));
const sourceCss = readFileSync(join(ROOT, "styles.css"), "utf8");
const refinementStart = sourceCss.indexOf(REFINEMENT_MARKER);
const refinementEnd = sourceCss.indexOf(
  "/* Keep guide signup copy legible",
  refinementStart,
);
if (refinementStart < 0 || refinementEnd < 0) {
  throw new Error("Missing the reference-contract CSS refinement block");
}
writeFileSync(
  join(DIST, "refinement.css"),
  `${sourceCss.slice(refinementStart, refinementEnd)}\n.guide-v7 .guide-hero-copy .email-capture h2 { color: var(--wm-forest); }\n.guide-v7 .guide-hero-copy .email-capture p, .guide-v7 .guide-hero-copy .email-capture .form-note { color: #665c55; }\n`,
);
cpSync(join(ROOT, "favicon.svg"), join(DIST, "favicon.svg"));

for (const { route, html } of pages) {
  const outputDir = route === "/" ? DIST : join(DIST, route.replace(/^\//, ""));
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "index.html"), useDeployedBackend(html));
}

const notFound = page({
  route: "/404.html",
  title: "Page not found",
  description: "The requested WoafMeow page could not be found.",
  body: `<section class="page-intro compact"><h1>We could not find that page.</h1><p>Return home or open Care Circle to find a useful starting point.</p><div class="actions">${button("Return home", "/")}${button("Open Care Circle", "/care-circle/", "secondary")}</div></section>`,
});
writeFileSync(join(DIST, "404.html"), notFound);
writeFileSync(
  join(DIST, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${PUBLIC_ORIGIN}/sitemap.xml\n`,
);
writeFileSync(join(DIST, ".nojekyll"), "");
writeFileSync(join(DIST, "CNAME"), "www.woafmeow.com\n");
writeFileSync(
  join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .filter(({ route }) => route !== "/404.html")
    .map(({ route }) => `  <url><loc>${PUBLIC_ORIGIN}${route}</loc></url>`)
    .join("\n")}\n</urlset>\n`,
);
writeFileSync(
  join(DIST, "_headers"),
  "/*\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Content-Type-Options: nosniff\n",
);
writeFileSync(
  join(DIST, "routes.json"),
  JSON.stringify(
    pages.map(({ route }) => ({
      route,
      label: routeLabels[route] || "Lesson",
    })),
    null,
    2,
  ),
);

console.log(`Built ${pages.length} preview routes in ${DIST}`);

#!/usr/bin/env node

import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const scriptDirectory = dirname(fileURLToPath(import.meta.url));

const ROUTES = [
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

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 1000 },
  { name: "1024", width: 1024, height: 900 },
  { name: "390", width: 390, height: 844 },
];

const LESSON_ROUTE = /^\/care-circle\/[^/]+\/$/;
const FULL_PAGE_ROUTES = new Set([
  "/",
  "/guide/",
  "/care-circle/",
  "/care-circle/slower-after-rest/",
  "/account/",
  "/find-care/",
  "/health-timeline/",
  "/pet-loss-support/",
  "/memorial-tree/",
  "/wednesday-introductions/",
  "/smart-bed/",
]);

const BANNED_COPY = [
  /private preview|preview only|6 free public lessons/i,
  /veterinary perspectives|woafyrelief|reviewed starting source|merck veterinary manual/i,
  /woafypet[^.!?]{0,100}in development/i,
  /no paid priority|what should we verify\?|search by provider, city, or concern/i,
  /no information (?:is|was) sent or stored|your information was not sent or stored/i,
  /woafypet does not perform background checks|no public profile|no swiping/i,
  /you will leave with one repeatable mobility observation/i,
];

function parseArgs(argv) {
  const options = {
    baseUrl: "http://127.0.0.1:4190",
    cdpUrl: "",
    routes: [],
    screenshotDir: resolve(
      scriptDirectory,
      "artifacts",
      "woafmeow-rebuild-final",
    ),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === "--base-url") options.baseUrl = argv[++index];
    else if (flag === "--cdp") options.cdpUrl = argv[++index];
    else if (flag === "--route") options.routes.push(argv[++index]);
    else if (flag === "--screenshots")
      options.screenshotDir = resolve(argv[++index]);
    else if (flag === "--help" || flag === "-h") {
      console.log(
        "Usage: node scripts/browser-smoke.mjs [--base-url URL] [--cdp URL] [--route PATH] [--screenshots DIR]",
      );
      process.exit(0);
    } else throw new Error(`Unknown argument: ${flag}`);
  }
  options.baseUrl = options.baseUrl.replace(/\/+$/, "");
  options.routes = options.routes.length ? options.routes : ROUTES;
  return options;
}

function slug(route) {
  return route === "/"
    ? "home"
    : route.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "-");
}

function normalize(copy = "") {
  return copy
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function preparePage(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    const previous = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    for (const image of document.images) image.loading = "eager";
    const step = Math.max(500, Math.round(innerHeight * 0.8));
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((done) => requestAnimationFrame(done));
    }
    await Promise.all(
      [...document.images].map(async (image) => {
        if (!image.complete)
          await Promise.race([
            new Promise((done) => {
              image.addEventListener("load", done, { once: true });
              image.addEventListener("error", done, { once: true });
            }),
            new Promise((done) => setTimeout(done, 5000)),
          ]);
        await image.decode().catch(() => {});
      }),
    );
    scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = previous;
  });
  await page.waitForTimeout(40);
}

async function checkGlobal(page, route, viewport, failures) {
  const h1 = page.locator("main h1");
  if ((await h1.count()) !== 1 || !(await h1.first().isVisible()))
    failures.push(`${route} ${viewport.name}: expected one visible h1`);
  if (!(await page.title()).includes("WoafMeow"))
    failures.push(`${route} ${viewport.name}: title is not WoafMeow branded`);
  const robots = (
    (await page.locator('meta[name="robots"]').getAttribute("content")) || ""
  ).toLowerCase();
  for (const directive of ["noindex", "nofollow", "noarchive"])
    if (!robots.includes(directive))
      failures.push(`${route}: robots missing ${directive}`);
  const bodyText = await page.locator("body").innerText();
  for (const pattern of BANNED_COPY) {
    const found = bodyText.match(pattern);
    if (found) failures.push(`${route}: rejected copy visible: ${found[0]}`);
  }

  const layout = await page.evaluate(() => {
    const root = document.documentElement;
    const overflow =
      Math.max(root.scrollWidth, document.body.scrollWidth) - root.clientWidth;
    const controls = [
      ...document.querySelectorAll("button, input, select, textarea"),
    ]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          left: rect.left,
          right: rect.right,
          shown:
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== "none" &&
            style.visibility !== "hidden",
        };
      })
      .filter(
        (item) => item.shown && (item.left < -2 || item.right > innerWidth + 2),
      );
    const type = [
      ...document.querySelectorAll(
        "main h1, main h2, main p, main button, main label",
      ),
    ]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName,
          copy: (element.textContent || "").trim().slice(0, 60),
          size: parseFloat(style.fontSize),
          shown:
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== "none" &&
            style.visibility !== "hidden",
        };
      })
      .filter((item) => item.shown);
    const sectionPadding = [...document.querySelectorAll("main > section")].map(
      (section) => {
        const style = getComputedStyle(section);
        return {
          className: section.className,
          top: parseFloat(style.paddingTop) || 0,
          bottom: parseFloat(style.paddingBottom) || 0,
        };
      },
    );
    return { overflow, controls, type, sectionPadding };
  });
  if (layout.overflow > 1)
    failures.push(
      `${route} ${viewport.name}: ${layout.overflow}px horizontal overflow`,
    );
  if (layout.controls.length)
    failures.push(
      `${route} ${viewport.name}: ${layout.controls.length} controls overflow horizontally`,
    );
  for (const item of layout.type) {
    if (item.tag === "H1" && item.size > (viewport.width <= 768 ? 48 : 72))
      failures.push(`${route} ${viewport.name}: h1 too large (${item.size}px)`);
    if (item.tag === "H2" && item.size > (viewport.width <= 768 ? 40 : 52))
      failures.push(`${route} ${viewport.name}: h2 too large (${item.size}px)`);
    if (["P", "BUTTON", "LABEL"].includes(item.tag) && item.size < 13)
      failures.push(
        `${route} ${viewport.name}: text too small (${item.size}px: ${item.copy})`,
      );
  }
  const paddingLimit = viewport.width <= 768 ? 100 : 130;
  for (const gap of layout.sectionPadding) {
    if (gap.top > paddingLimit || gap.bottom > paddingLimit)
      failures.push(
        `${route} ${viewport.name}: excessive section padding in .${String(gap.className).replace(/\s+/g, ".")} (${Math.round(gap.top)}px top, ${Math.round(gap.bottom)}px bottom)`,
      );
  }

  const images = await page.locator("img").evaluateAll((nodes) =>
    nodes.map((image, index) => {
      const rect = image.getBoundingClientRect();
      const frame = image.closest("figure")?.getBoundingClientRect();
      const style = getComputedStyle(image);
      return {
        index,
        src: image.currentSrc || image.src,
        alt: image.alt,
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        width: rect.width,
        height: rect.height,
        fit: style.objectFit,
        visible:
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden",
        outsideFrame: frame
          ? rect.left < frame.left - 2 ||
            rect.top < frame.top - 2 ||
            rect.right > frame.right + 2 ||
            rect.bottom > frame.bottom + 2
          : false,
      };
    }),
  );
  for (const image of images) {
    if (!image.complete || image.naturalWidth < 1 || image.naturalHeight < 1)
      failures.push(`${route} ${viewport.name}: broken image ${image.src}`);
    if (!image.alt.trim())
      failures.push(
        `${route} ${viewport.name}: image ${image.index + 1} has empty alt`,
      );
    if (!image.visible) continue;
    if (image.outsideFrame)
      failures.push(
        `${route} ${viewport.name}: image overflows its frame ${image.src}`,
      );
    if (image.fit === "cover")
      failures.push(`${route} ${viewport.name}: cropped image ${image.src}`);
    const naturalRatio = image.naturalWidth / image.naturalHeight;
    const renderedRatio = image.width / image.height;
    if (
      image.fit === "fill" &&
      Math.abs(renderedRatio / naturalRatio - 1) > 0.025
    )
      failures.push(`${route} ${viewport.name}: deformed image ${image.src}`);
  }
  const visibleSources = images
    .filter((image) => image.visible)
    .map((image) => image.src);
  const repeatedSources = [
    ...new Set(
      visibleSources.filter(
        (source, index) => visibleSources.indexOf(source) !== index,
      ),
    ),
  ];
  if (repeatedSources.length && !/^\/learn\/[^/]+\/$/.test(route))
    failures.push(
      `${route} ${viewport.name}: repeated images ${repeatedSources.join(", ")}`,
    );
}

async function checkNavigation(page, route, viewport, failures) {
  const nav = page.locator("[data-site-nav]");
  if ((await nav.count()) !== 1)
    return failures.push(`${route}: navigation missing`);
  const mobile = viewport.width <= 900;
  const toggle = page.locator("[data-menu-toggle]");
  if (mobile) {
    if (!(await toggle.isVisible()))
      failures.push(`${route} ${viewport.name}: mobile menu button hidden`);
    else {
      await toggle.click();
      if (
        (await toggle.getAttribute("aria-expanded")) !== "true" ||
        !(await nav.isVisible())
      )
        failures.push(`${route} ${viewport.name}: menu did not open`);
      await page.keyboard.press("Escape");
      if ((await toggle.getAttribute("aria-expanded")) !== "false")
        failures.push(`${route} ${viewport.name}: Escape did not close menu`);
    }
  } else if (!(await nav.isVisible()))
    failures.push(`${route} ${viewport.name}: desktop navigation hidden`);
}

async function checkHome(page, viewport, baseUrl, failures) {
  for (const [selector, expected] of [
    [".home-topic-card", 6],
    [".home-circle-card", 6],
    [".home-ref-guide", 1],
    [".home-support-paths > a", 4],
  ]) {
    if ((await page.locator(selector).count()) !== expected)
      failures.push(`/: expected ${expected} ${selector}`);
  }
  for (const selector of [
    ".home-ref-hero",
    ".home-ref-learn",
    ".home-care-circle",
    ".profile-gate-dialog",
    ".home-ref-guide",
    ".home-vet-testimonials",
    ".home-ref-bed",
    ".home-support-paths",
  ]) {
    if ((await page.locator(selector).count()) !== 1)
      failures.push(`/: missing ${selector}`);
  }
  const heroHeight = await page
    .locator(".home-ref-hero")
    .evaluate((node) => node.getBoundingClientRect().height);
  if (heroHeight > (viewport.width <= 768 ? 1050 : 650))
    failures.push(
      `/: ${viewport.name} hero too tall (${Math.round(heroHeight)}px)`,
    );
  const totalHeight = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  const maxHeight =
    viewport.width <= 768 ? 11000 : viewport.width <= 1100 ? 9000 : 6200;
  if (totalHeight > maxHeight)
    failures.push(
      `/: ${viewport.name} homepage too tall (${Math.round(totalHeight)}px)`,
    );
  if (
    (await page.locator("[data-home-account-form]").count()) !== 1 ||
    (await page
      .locator(
        "[data-home-account-form] input, [data-home-account-form] select, [data-home-account-form] textarea",
      )
      .count()) < 7
  )
    failures.push("/: personalized account form is incomplete");
  if (
    (await page
      .getByRole("heading", {
        name: "Veterinarian support you can trust.",
      })
      .count()) !== 1
  )
    failures.push("/: veterinarian testimonial section is incomplete");
  const smartBedHref = await page
    .locator('.home-ref-bed a[href="https://www.woafy.pet/"]')
    .first()
    .getAttribute("href");
  if (smartBedHref !== "https://www.woafy.pet/")
    failures.push("/: Smart Bed CTA does not open woafy.pet");
  if ((await page.locator("[data-guide-delivery]").count()) !== 1)
    failures.push("/: expected one guide delivery form");
  const homeImageSources = await page
    .locator("main img")
    .evaluateAll((images) =>
      images.map((image) => image.currentSrc || image.src),
    );
  if (new Set(homeImageSources).size !== homeImageSources.length)
    failures.push("/: homepage repeats an image");
  if (viewport.width === 1440) {
    const questionForm = page.locator("[data-home-question-form]").first();
    await questionForm
      .locator('[name="question"]')
      .fill("Why is my dog stiff after getting up?");
    await questionForm.evaluate((node) => node.requestSubmit());
    const registrationDialog = page.locator("[data-first-action-dialog]");
    await registrationDialog.waitFor({ state: "visible" });
    if (!(await registrationDialog.evaluate((node) => node.open)))
      failures.push("/: first personalized action did not open registration");
    if ((await registrationDialog.locator('[name="ownerName"]').count()) !== 1)
      failures.push("/: first-action registration is missing owner details");
    await registrationDialog.locator("[data-first-action-close]").click();
  }
}

async function checkCareCircle(page, viewport, failures) {
  if ((await page.locator("[data-care-post]").count()) !== 12)
    failures.push("/care-circle/: twelve public posts missing");
  if ((await page.locator("[data-care-post] img").count()) !== 12)
    failures.push("/care-circle/: every post needs an image");
  if (
    (await page.locator("[data-public-conditions]").count()) !== 0 &&
    (await page.locator("[data-public-conditions]").count()) !== 12
  )
    failures.push("/care-circle/: public conditions are incomplete");
  if ((await page.locator("[data-account-gate]").count()) !== 1)
    failures.push("/care-circle/: account gate missing");
  if (viewport.width !== 1440) return;
  await page.locator("[data-circle-filter]").nth(1).click();
  const visible = await page.locator("[data-care-post]:visible").count();
  if (visible < 1 || visible >= 12)
    failures.push(`/care-circle/: topic filter returned ${visible} posts`);
  await page.locator('[data-circle-filter="all"]').click();
}

async function checkLesson(page, route, viewport, failures) {
  if ((await page.locator("[data-lesson-chapter]").count()) !== 3)
    failures.push(`${route}: three chapters missing`);
  if ((await page.locator("[data-chapter-quiz]").count()) !== 3)
    failures.push(`${route}: three quizzes missing`);
  if ((await page.locator("[data-community-interaction]").count()) !== 1)
    failures.push(`${route}: expected one lesson-level conversation`);
  if (
    (await page
      .locator("[data-lesson-chapter] [data-community-interaction]")
      .count()) !== 0
  )
    failures.push(`${route}: chapter reactions remain`);
  if ((await page.locator(".lesson-chapter-nav").count()) !== 0)
    failures.push(`${route}: hanging chapter outline remains`);
  if ((await page.locator("[data-public-pet-profile]").count()) !== 1)
    failures.push(`${route}: public pet profile missing`);
  if (viewport.width !== 1440 || route !== "/care-circle/slower-after-rest/")
    return;
  const interaction = page.locator("[data-community-interaction]");
  await interaction.locator("[data-local-like]").click();
  await interaction.locator("[data-local-comments-toggle]").click();
  await interaction
    .locator("textarea")
    .fill("The first-rise check was useful.");
  await interaction.locator("form").evaluate((node) => node.requestSubmit());
  if ((await interaction.locator("[data-local-comment]").count()) !== 1)
    failures.push(`${route}: lesson comment failed`);
  const quiz = page.locator("[data-chapter-quiz]").first();
  const answer = await quiz.getAttribute("data-answer");
  await quiz.locator(`input[value="${answer}"]`).check();
  await quiz.locator("[data-check-quiz]").click();
  if (!(await quiz.evaluate((node) => node.classList.contains("is-correct"))))
    failures.push(`${route}: quiz did not confirm correct answer`);
}

async function checkAccountFlow(page, viewport, baseUrl, failures) {
  if ((await page.locator("[data-account-form]").count()) !== 1)
    failures.push("/account/: account form missing");
  const ageText = await page.locator('[name="petAge"]').innerText();
  for (const age of ["Under 1 year", "1–3 years", "4–6 years", "16+ years"])
    if (!ageText.includes(age))
      failures.push(`/account/: missing age option ${age}`);
  if (viewport.width !== 1440) return;
  await page.goto(
    `${baseUrl}/account/?next=ask&q=Why%20is%20my%20dog%20stiff%20after%20resting%3F`,
    { waitUntil: "domcontentloaded" },
  );
  const form = page.locator("[data-account-form]");
  await form.locator('[name="ownerName"]').fill("Taylor Example");
  await form.locator('[name="email"]').fill("caregiver@example.com");
  await form.locator('[name="petName"]').fill("Bobby");
  await form.locator('[name="petAge"]').selectOption({ label: "10–12 years" });
  await form
    .locator('[name="breed"]')
    .selectOption({ label: "Golden Retriever" });
  await form.locator('[name="conditions"]').fill("arthritis");
  await form
    .locator('[name="medications"]')
    .fill("anti-inflammatory medicine changed last week");
  await form.locator('[name="publicProfileConsent"]').check();
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/care-circle/"),
    form.evaluate((node) => node.requestSubmit()),
  ]);
  const ask = page.locator("[data-account-ask-form]");
  if (!(await ask.isVisible()))
    return failures.push(
      "/account/: signed-in Care Circle question form did not appear",
    );
  if (!(await ask.locator('[name="question"]').inputValue()).includes("stiff"))
    failures.push("/account/: first question was not carried forward");
  await ask.locator('[name="publicPetDetails"]').check();
  await Promise.all([
    page.waitForURL(
      (url) =>
        url.pathname === "/care-circle/slower-after-rest/" &&
        url.searchParams.get("mine") === "1",
    ),
    ask.evaluate((node) => node.requestSubmit()),
  ]);
  if (
    !normalize(
      await page.locator("[data-public-pet-profile]").innerText(),
    ).includes("bobby") ||
    !normalize(
      await page.locator("[data-public-pet-profile]").innerText(),
    ).includes("arthritis")
  )
    failures.push("/account/: tailored public pet profile missing");
  if (
    !normalize(
      await page.locator("[data-focused-result]").innerText(),
    ).includes("stiff")
  )
    failures.push("/account/: tailored lesson did not use the question");
  const tailoredCopy = normalize(
    await page
      .locator("[data-tailored-chapter-summary], [data-tailored-chapter-steps]")
      .allInnerTexts()
      .then((items) => items.join(" ")),
  );
  if (
    !tailoredCopy.includes("bobby") ||
    !tailoredCopy.includes("arthritis") ||
    !tailoredCopy.includes("first rise")
  )
    failures.push(
      "/account/: chapter guidance was not tailored to the dog, condition, and selected lesson",
    );
  await page.goto(`${baseUrl}/account/`, { waitUntil: "domcontentloaded" });
  const editButton = page.locator("[data-account-edit]");
  if (!(await editButton.isVisible()))
    return failures.push("/account/: edit profile control is not visible");
  await editButton.click();
  const editForm = page.locator("[data-account-form]");
  if (
    !(await editForm.isVisible()) ||
    (await editForm.locator('[name="petName"]').inputValue()) !== "Bobby"
  )
    failures.push("/account/: edit profile did not restore saved details");
  await editForm.locator('[name="ownerName"]').fill("Taylor Updated");
  await editForm.evaluate((node) => node.requestSubmit());
  if (
    !normalize(
      await page.locator("[data-account-profile-summary]").innerText(),
    ).includes("taylor updated")
  )
    failures.push("/account/: edited profile was not saved");
}

async function checkHealthTimeline(
  page,
  viewport,
  baseUrl,
  failures,
  screenshotDir,
) {
  if ((await page.locator("[data-health-root]").count()) !== 1)
    return failures.push("/health-timeline/: workspace root missing");
  if (!(await page.locator("[data-health-account-gate]").isVisible()))
    failures.push("/health-timeline/: signed-out profile gate is not visible");

  await page.evaluate(async () => {
    localStorage.setItem(
      "woafmeow-account-v1",
      JSON.stringify({
        ownerName: "Morgan Example",
        email: "health-timeline-test@example.com",
        petName: "Bailey",
        petAge: "10–12 years",
        breed: "Golden Retriever",
        conditions: "arthritis",
        medications: "carprofen",
        publicProfileConsent: true,
      }),
    );
    await new Promise((resolve) => {
      const request = indexedDB.deleteDatabase("woafmeow-health-v1");
      request.onsuccess = request.onerror = request.onblocked = () => resolve();
    });
  });
  await page.goto(`${baseUrl}/health-timeline/`, {
    waitUntil: "domcontentloaded",
  });
  const workspace = page.locator("[data-health-workspace]");
  if (!(await workspace.isVisible()))
    return failures.push(
      "/health-timeline/: saved dog profile did not open the workspace",
    );
  if (!normalize(await workspace.innerText()).includes("bailey"))
    failures.push("/health-timeline/: dog profile was not connected");

  if (viewport.width !== 1440) {
    if (viewport.width === 390) {
      await preparePage(page);
      await page.screenshot({
        path: resolve(
          screenshotDir,
          `${viewport.name}-health-timeline-signed-in-full.png`,
        ),
        fullPage: true,
      });
    }
    return;
  }

  const recordForm = page.locator("[data-health-record-form]");
  await recordForm.locator('[name="recordDate"]').fill("2026-08-12");
  await recordForm
    .locator('[name="recordType"]')
    .selectOption({ label: "Veterinary visit" });
  await recordForm.locator('[name="recordFile"]').setInputFiles({
    name: "bailey-vet-note.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(
      "Bailey has arthritis. Track stiffness after rest, weight, and response after a carprofen dose change.",
    ),
  });
  await recordForm
    .locator('[name="recordNote"]')
    .fill("Review first-rise stiffness at the next appointment.");
  await recordForm.evaluate((node) => node.requestSubmit());
  await page.waitForFunction(
    () =>
      document.querySelectorAll("[data-health-records] article").length >= 1,
  );

  const logForm = page.locator("[data-health-log-form]");
  const addLog = async (date, weight, observation) => {
    await logForm.locator('[name="logDate"]').fill(date);
    await logForm
      .locator('[name="category"]')
      .selectOption({ label: "Mobility" });
    await logForm
      .locator('[name="severity"]')
      .selectOption({ label: "Moderate" });
    await logForm.locator('[name="weight"]').fill(weight);
    await logForm.locator('[name="observation"]').fill(observation);
    await logForm
      .locator('[name="medicineChange"]')
      .fill("Carprofen dose reviewed with veterinarian");
    await logForm.evaluate((node) => node.requestSubmit());
    await page.waitForTimeout(50);
  };
  await addLog(
    "2026-08-01",
    "72",
    "Needed two attempts to rise after the morning nap.",
  );
  await addLog(
    "2026-08-20",
    "69",
    "Rose slowly after rest and paused before the hallway steps.",
  );
  await page.waitForFunction(
    () =>
      document.querySelectorAll("[data-health-records] article").length >= 3,
  );

  if ((await page.locator("[data-health-records] article").count()) !== 3)
    failures.push("/health-timeline/: record and two changes were not added");
  const mentions = normalize(
    await page.locator("[data-health-record-mentions]").innerText(),
  );
  const patterns = normalize(
    await page.locator("[data-health-pattern-summary]").innerText(),
  );
  const weight = normalize(
    await page.locator("[data-health-weight-summary]").innerText(),
  );
  if (!mentions.includes("arthritis"))
    failures.push("/health-timeline/: known condition was not organized");
  if (!patterns.includes("mobility") || !patterns.includes("medicine response"))
    failures.push(
      "/health-timeline/: record and change patterns were not organized",
    );
  if (!weight.includes("down 3.0"))
    failures.push("/health-timeline/: weight direction was not calculated");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () =>
      document.querySelectorAll("[data-health-records] article").length >= 3,
  );
  if ((await page.locator("[data-health-records] article").count()) !== 3)
    failures.push("/health-timeline/: timeline did not persist after reload");
  await preparePage(page);
  await page.screenshot({
    path: resolve(
      screenshotDir,
      `${viewport.name}-health-timeline-signed-in-full.png`,
    ),
    fullPage: true,
  });
}

async function checkDirectory(page, viewport, apiCalls, failures) {
  if ((await page.locator("[data-directory-profile]").count()) < 300)
    failures.push("/find-care/: expected at least 300 official profiles");
  if ((await page.locator("[data-directory-resource]").count()) < 32)
    failures.push("/find-care/: expected at least 32 official resources");
  if ((await page.locator("[data-directory-search]").count()) !== 0)
    failures.push("/find-care/: removed search box returned");
  if (
    (await page.locator("[data-directory-category]").count()) !== 1 ||
    (await page.locator("[data-directory-region]").count()) !== 1
  )
    failures.push("/find-care/: selectors missing");
  const initialProfiles = await page
    .locator("[data-directory-profile]:visible")
    .count();
  const initialResources = await page
    .locator("[data-directory-resource]:visible")
    .count();
  if (initialProfiles !== 9 || initialResources !== 3)
    failures.push(
      `/find-care/: expected 9+3 initial cards, found ${initialProfiles}+${initialResources}`,
    );
  const geometry = await page
    .locator("[data-directory-item]:visible")
    .evaluateAll((cards) =>
      cards.map((card) => {
        const box = card.getBoundingClientRect();
        const visual = (
          card.querySelector("figure") ||
          card.querySelector(".provider-monogram")
        )?.getBoundingClientRect();
        return { width: box.width, visualHeight: visual?.height || 0 };
      }),
    );
  if (geometry.length) {
    for (const key of ["width", "visualHeight"]) {
      const values = geometry.map((item) => item[key]);
      if (Math.max(...values) - Math.min(...values) > 2)
        failures.push(`/find-care/ ${viewport.name}: uneven card ${key}`);
    }
  }
  if (viewport.width !== 1440) return;
  const category = page.locator("[data-directory-category]");
  for (const value of [
    "senior-veterinarians",
    "pain-mobility-rehab",
    "nutrition-weight",
    "emergency-vets",
    "hospice-palliative-care",
    "grief-counselors",
    "memorial-aftercare",
  ]) {
    await category.selectOption(value);
    const profiles = await page
      .locator("[data-directory-profile]:visible")
      .count();
    const resources = await page
      .locator("[data-directory-resource]:visible")
      .count();
    if (profiles + resources < 3)
      failures.push(`/find-care/: ${value} has fewer than three options`);
    if (resources < 3)
      failures.push(
        `/find-care/: ${value} has fewer than three official directories`,
      );
  }
  await category.selectOption("all");
  const region = page.locator("[data-directory-region]");
  await region.selectOption("Arizona");
  const arizonaTitles = await page
    .locator("[data-directory-profile]:visible h3")
    .allTextContents();
  await region.selectOption("California");
  const californiaTitles = await page
    .locator("[data-directory-profile]:visible h3")
    .allTextContents();
  if (
    !arizonaTitles.length ||
    !californiaTitles.length ||
    JSON.stringify(arizonaTitles) === JSON.stringify(californiaTitles)
  )
    failures.push(
      "/find-care/: changing region did not change provider listings",
    );
  await region.selectOption("all");
  const before = await page.locator("[data-directory-item]:visible").count();
  await page.locator("[data-directory-load-more]").click();
  const after = await page.locator("[data-directory-item]:visible").count();
  if (after <= before)
    failures.push("/find-care/: show more did not reveal options");

  const form = page.locator("[data-provider-inquiry-form]");
  await form.locator('[name="contactName"]').fill("Taylor Example");
  await form.locator('[name="email"]').fill("taylor@example.com");
  await form.locator('[name="organization"]').fill("Example Practice");
  await form.locator('[name="city"]').fill("Toronto");
  await form.locator('[name="region"]').selectOption("Ontario");
  await form.locator('[name="serviceType"]').selectOption("Other");
  await form.locator('[name="website"]').fill("https://example.com");
  await form
    .locator('[name="message"]')
    .fill(
      "We help families understand senior-dog mobility and comfort options.",
    );
  await form.locator('[name="consent"]').check();
  const callsBefore = apiCalls.length;
  await form.evaluate((node) => node.requestSubmit());
  await page.waitForTimeout(100);
  if (
    !normalize(
      await form.locator("[data-provider-inquiry-note]").innerText(),
    ).includes("submitted for review")
  )
    failures.push("/find-care/: provider success state missing");
  const call = apiCalls
    .slice(callsBefore)
    .find((item) => item.url.endsWith("/api/provider-inquiry"));
  if (
    !call ||
    call.method !== "POST" ||
    !call.body.includes("Example Practice")
  )
    failures.push("/find-care/: provider API payload missing");
}

async function submitGeneric(
  page,
  selector,
  values,
  endpoint,
  apiCalls,
  failures,
) {
  const form = page.locator(selector);
  for (const [name, value] of Object.entries(values)) {
    const field = form.locator(`[name="${name}"]`);
    const type = await field.getAttribute("type");
    const tag = await field.evaluate((node) => node.tagName);
    if (type === "checkbox") await field.check();
    else if (tag === "SELECT")
      await field.selectOption({ index: Number(value) });
    else await field.fill(String(value));
  }
  const before = apiCalls.length;
  await form.evaluate((node) => node.requestSubmit());
  await page.waitForTimeout(100);
  const call = apiCalls.slice(before).find((item) => item.url === endpoint);
  if (!call || call.method !== "POST")
    failures.push(`${selector}: did not POST to ${endpoint}`);
  const note = form.locator("[data-form-note]");
  if (
    (await note.count()) &&
    !(await note.evaluate((node) => node.classList.contains("is-confirmed")))
  )
    failures.push(`${selector}: success state missing`);
}

async function checkJourney(page, route, viewport, apiCalls, failures) {
  if (route === "/guide/") {
    if (
      (await page.locator(".guide-topics-v6 article").count()) !== 6 ||
      (await page.locator(".guide-topics-v6 img").count()) !== 6
    )
      failures.push("/guide/: six image-led guide topics missing");
    if (viewport.width === 1440)
      await submitGeneric(
        page,
        "#guide-download",
        { email: "guide@example.com" },
        "https://www.woafmeow.com/api/newsletter",
        apiCalls,
        failures,
      );
  }
  if (route === "/wednesday-introductions/") {
    if ((await page.locator("main img").count()) < 6)
      failures.push(`${route}: image-led introduction story incomplete`);
    if (viewport.width === 1440)
      await submitGeneric(
        page,
        "[data-form-title='Wednesday introduction']",
        {
          name: "Taylor",
          email: "taylor@example.com",
          zip: "M5V 2T6",
          dogAge: 1,
          issue: 1,
          contact: 1,
          message: "I would like to meet someone navigating mobility changes.",
          consent: true,
        },
        "https://www.woafmeow.com/api/contact",
        apiCalls,
        failures,
      );
  }
  if (route === "/support/" && viewport.width === 1440)
    await submitGeneric(
      page,
      "[data-form-title='WoafMeow support']",
      {
        name: "Taylor",
        email: "taylor@example.com",
        topic: 1,
        message: "I need help choosing the right care lesson.",
        consent: true,
      },
      "https://www.woafmeow.com/api/contact",
      apiCalls,
      failures,
    );
  if (route === "/memorial-tree/") {
    const dialog = page.locator("[data-tree-purchase]");
    if (await dialog.isVisible())
      failures.push(`${route}: price visible before purchase click`);
    if (viewport.width === 1440) {
      await page.locator("[data-tree-purchase-open]").first().click();
      if (
        !(await dialog.isVisible()) ||
        !normalize(await dialog.innerText()).includes("$10 per tree")
      )
        failures.push(`${route}: price dialog did not open`);
      await submitGeneric(
        page,
        "[data-tree-purchase] form",
        {
          name: "Taylor",
          email: "taylor@example.com",
          petName: "Bobby",
          meaning: "Always beside us.",
        },
        "https://www.woafmeow.com/api/memorial-interest",
        apiCalls,
        failures,
      );
      await page.locator("[data-tree-purchase-close]").click();
    }
  }
}

async function inspect(page, route, viewport, options, apiCalls) {
  const failures = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const response = await page.goto(new URL(route, `${options.baseUrl}/`).href, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  if (!response || response.status() >= 400)
    failures.push(`${route}: HTTP ${response?.status() || "no response"}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await preparePage(page);
  await checkGlobal(page, route, viewport, failures);
  await checkNavigation(page, route, viewport, failures);
  if (route === "/") await checkHome(page, viewport, options.baseUrl, failures);
  if (route === "/care-circle/")
    await checkCareCircle(page, viewport, failures);
  if (LESSON_ROUTE.test(route))
    await checkLesson(page, route, viewport, failures);
  if (route === "/account/")
    await checkAccountFlow(page, viewport, options.baseUrl, failures);
  if (route === "/health-timeline/")
    await checkHealthTimeline(
      page,
      viewport,
      options.baseUrl,
      failures,
      options.screenshotDir,
    );
  if (route === "/find-care/")
    await checkDirectory(page, viewport, apiCalls, failures);
  await checkJourney(page, route, viewport, apiCalls, failures);
  for (const error of consoleErrors)
    failures.push(`${route}: console error ${error}`);
  for (const error of pageErrors)
    failures.push(`${route}: page error ${error}`);

  await page.goto(new URL(route, `${options.baseUrl}/`).href, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await preparePage(page);

  const viewportShot = resolve(
    options.screenshotDir,
    `${viewport.name}-${slug(route)}.png`,
  );
  await page.screenshot({ path: viewportShot });
  let fullPageShot = "";
  if (
    (viewport.width === 1440 || viewport.width === 390) &&
    FULL_PAGE_ROUTES.has(route)
  ) {
    fullPageShot = resolve(
      options.screenshotDir,
      `${viewport.name}-${slug(route)}-full.png`,
    );
    await preparePage(page);
    await page.screenshot({ path: fullPageShot, fullPage: true });
  }
  return {
    route,
    viewport: viewport.name,
    viewportShot,
    fullPageShot,
    failures,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const { chromium } = require("playwright");
  mkdirSync(options.screenshotDir, { recursive: true });
  const connected = Boolean(options.cdpUrl);
  const launchOptions = { headless: true };
  if (process.env.CHROME_EXECUTABLE)
    launchOptions.executablePath = process.env.CHROME_EXECUTABLE;
  const browser = connected
    ? await chromium.connectOverCDP(options.cdpUrl)
    : await chromium.launch(launchOptions);
  const results = [];
  try {
    for (const viewport of VIEWPORTS) {
      const context = connected
        ? browser.contexts()[0]
        : await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height },
            colorScheme: "light",
            reducedMotion: "reduce",
          });
      const apiCalls = [];
      await context.route("https://www.woafmeow.com/api/**", async (route) => {
        const request = route.request();
        apiCalls.push({
          method: request.method(),
          url: request.url(),
          body: request.postData() || "",
        });
        await route.fulfill({ status: 204, body: "" });
      });
      for (const route of options.routes) {
        const page = await context.newPage();
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        try {
          results.push(await inspect(page, route, viewport, options, apiCalls));
        } catch (error) {
          results.push({
            route,
            viewport: viewport.name,
            failures: [
              `${route} ${viewport.name}: test crashed: ${error.message}`,
            ],
          });
        } finally {
          await page.close();
        }
      }
      if (!connected) await context.close();
    }
  } finally {
    if (!connected) await browser.close();
  }
  writeFileSync(
    resolve(options.screenshotDir, "results.json"),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), viewports: VIEWPORTS, results }, null, 2)}\n`,
  );
  const failures = results.flatMap((result) => result.failures || []);
  if (failures.length) {
    console.error(`Browser verification failed (${failures.length}):`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  } else
    console.log(
      `Browser verification passed: ${results.length} route/viewport checks. Artifacts: ${options.screenshotDir}`,
    );
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});

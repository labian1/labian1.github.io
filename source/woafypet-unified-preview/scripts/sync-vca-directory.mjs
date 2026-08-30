#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const cache = "/tmp/vca-dir.html";
const sourceUrl = "https://vcahospitals.com/find-a-hospital/location-directory";
const output = resolve(root, "data", "find-care-profiles.vca.json");
const targetProfileCount = 420;
const checkedDate = "2026-08-30";

const decode = (value = "") =>
  value
    .replace(/<br\s*\/?>/gi, ", ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();

const slug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

let html;
try {
  const response = await fetch(sourceUrl, {
    headers: { "user-agent": "WoafMeow directory research/1.0" },
  });
  if (!response.ok) throw new Error(`VCA directory returned ${response.status}`);
  html = await response.text();
  writeFileSync(cache, html);
} catch (error) {
  if (!existsSync(cache)) throw error;
  html = readFileSync(cache, "utf8");
}

const states = [];
const stateChunks = html.split('<div class="location-accordion__state">').slice(1);
for (const chunk of stateChunks) {
  const region = decode(chunk.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1]);
  if (!region) continue;
  const entries = [];
  for (const item of chunk.matchAll(/<li class="col-12[\s\S]*?<\/li>/gi)) {
    const block = item[0];
    const link = block.match(/<a href="(\/[^"]+)">([\s\S]*?)<\/a>/i);
    if (!link) continue;
    const title = decode(link[2]);
    const address = decode(
      block.match(/location-accordion__location-address">([\s\S]*?)<\/span>/i)?.[1],
    );
    const phone = decode(
      block.match(/location-accordion__location-phone">([\s\S]*?)<\/span>/i)?.[1],
    ).replace(/^Tel:\s*/i, "");
    const city = address.split(",").at(-2)?.trim() || region;
    const categories = ["senior-veterinarians"];
    if (/emergency|urgent/i.test(title)) categories.push("emergency-vets");
    if (/specialty|specialist|referral/i.test(title)) categories.push("specialty-hospitals");
    const isEmergency = categories.includes("emergency-vets");
    const isSpecialty = categories.includes("specialty-hospitals");
    const visitFit = isEmergency
      ? "For urgent symptoms, use the official page to confirm whether this location is accepting emergency cases now, then call before traveling when possible."
      : isSpecialty
        ? "For referral or advanced care, use the official page to confirm the specialty team, referral requirements, records to bring and appointment route."
        : "For an examination, ongoing senior-dog care or a new change, use the official page to confirm services, hours and the best appointment route.";
    entries.push({
      id: `vca-${slug(link[1])}`,
      title,
      organization: "VCA Animal Hospitals",
      city,
      region,
      coverage: address || `${city}, ${region}`,
      phone,
      coverageKey: "united-states",
      categories,
      mode: phone ? `Call ${phone}; confirm current hours and services` : "Confirm current hours and services",
      summary: `${title} publishes this official hospital profile for ${address || `${city}, ${region}`}${phone ? ` and lists ${phone} as its contact number` : ""}.`,
      useWhen: visitFit,
      url: `https://vcahospitals.com${link[1]}`,
      sourceType: "Provider-published hospital profile",
      profileType: "Official-source clinic profile",
      checked: checkedDate,
    });
  }
  if (entries.length) states.push(entries);
}

const selected = [];
const selectedUrls = new Set();
let cursor = 0;
while (selected.length < targetProfileCount) {
  let added = false;
  for (const entries of states) {
    const entry = entries[cursor];
    if (entry && !selectedUrls.has(entry.url)) {
      selected.push(entry);
      selectedUrls.add(entry.url);
      added = true;
      if (selected.length === targetProfileCount) break;
    }
  }
  if (!added) break;
  cursor += 1;
}

if (selected.length < targetProfileCount) {
  throw new Error(
    `Only parsed ${selected.length} unique VCA profiles; expected ${targetProfileCount}`,
  );
}

writeFileSync(output, `${JSON.stringify(selected, null, 2)}\n`);
console.log(`Wrote ${selected.length} official VCA profiles to ${output}`);

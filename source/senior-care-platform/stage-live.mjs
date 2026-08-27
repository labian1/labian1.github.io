import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(root, "../outputs/woafypet-senior-care-live");
const site = path.join(output, "senior-care-platform");
const routes = fs.readFileSync(path.join(root, "sitemap-routes.txt"), "utf8").trim().split("\n");
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(site, { recursive: true });

for (const name of ["assets", "media"]) {
  fs.cpSync(path.join(root, name), path.join(site, name), { recursive: true });
}
// Cloudflare Pages Functions must live at the deployment root, not under the
// public /senior-care-platform path.
fs.cpSync(path.join(root, "functions"), path.join(output, "functions"), { recursive: true });
fs.cpSync(path.join(root, "migrations"), path.join(output, "migrations"), { recursive: true });
for (const retiredFunction of [
  "admin-products.js",
  "membership-checkout.js",
  "membership-interest.js",
  "products.js",
  "store-checkout.js",
  "vendor-application.js",
]) {
  fs.rmSync(path.join(output, "functions", "api", retiredFunction), { force: true });
}
for (const name of ["index.html", "script.js", "styles.css", "homepage-lock.css", "sitemap-routes.txt"]) {
  fs.copyFileSync(path.join(root, name), path.join(site, name));
}
for (const name of ["wrangler.jsonc", "BREVO_SETUP.md", "RELEASE_README.md"]) {
  fs.copyFileSync(path.join(root, name), path.join(output, name));
}
fs.writeFileSync(path.join(output, ".dev.vars.example"), `# Copy to .dev.vars for local Wrangler development only.
# Configure the same values as encrypted Pages secrets in production.
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
FORM_NOTIFICATION_EMAIL=robert.luo@woafmeow.com
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
`);
for (const route of routes) {
  const relativeRoute = route.replace(/^\/senior-care-platform\/?/, "").replace(/\/$/, "");
  if (!relativeRoute) continue;
  const source = path.join(root, relativeRoute, "index.html");
  const destination = path.join(site, relativeRoute, "index.html");
  if (!fs.existsSync(source)) throw new Error(`Missing generated route: ${route}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

fs.writeFileSync(path.join(output, "index.html"), '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/senior-care-platform/"><title>WoafMeow</title><a href="/senior-care-platform/">Open WoafMeow</a>\n');

const legacyRouteRedirects = [
  ["shop/memorial-trees", "remember/living-tributes/"],
  ["shop/products/living-memorial-tree", "remember/living-tributes/"],
  ["shop", "remember/"],
  ["membership", "community/"],
  ["sell-with-us", "find-care/#listing-inquiry"],
  ["for-providers", "find-care/#listing-inquiry"],
  ["submit-listing", "find-care/#listing-inquiry"],
];
const exactRedirects = legacyRouteRedirects.flatMap(([source, destination]) => [
  `/senior-care-platform/${source} /senior-care-platform/${destination} 301`,
  `/${source} /senior-care-platform/${destination} 301`,
]);
const dynamicRedirects = legacyRouteRedirects.flatMap(([source, destination]) => [
  `/senior-care-platform/${source}/* /senior-care-platform/${destination} 301`,
  `/${source}/* /senior-care-platform/${destination} 301`,
]);
const redirects = [...exactRedirects, ...dynamicRedirects];
redirects.push("/ /senior-care-platform/ 302");
fs.writeFileSync(path.join(output, "_redirects"), `${redirects.join("\n")}\n`);

console.log(`Staged ${routes.length} routes in ${output}`);

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(root, "../outputs/woafmeow-hostinger-live");
const publicHtml = path.join(output, "public_html");
const routes = fs
  .readFileSync(path.join(root, "sitemap-routes.txt"), "utf8")
  .split(/\r?\n/)
  .map((route) => route.trim())
  .filter(Boolean);

const rewriteRootPaths = (contents) => contents
  .replaceAll("/senior-care-platform/", "/")
  .replaceAll("https://woafypet-senior-care.pages.dev/senior-care-platform/", "https://www.woafmeow.com/");

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(publicHtml, { recursive: true });

for (const name of ["assets", "media"]) {
  fs.cpSync(path.join(root, name), path.join(publicHtml, name), { recursive: true });
}

for (const name of ["styles.css", "homepage-lock.css", "script.js"]) {
  const contents = fs.readFileSync(path.join(root, name), "utf8");
  fs.writeFileSync(path.join(publicHtml, name), rewriteRootPaths(contents));
}

for (const route of routes) {
  const relativeRoute = route.replace(/^\/senior-care-platform\/?/, "").replace(/\/$/, "");
  const source = relativeRoute ? path.join(root, relativeRoute, "index.html") : path.join(root, "index.html");
  const destination = relativeRoute
    ? path.join(publicHtml, relativeRoute, "index.html")
    : path.join(publicHtml, "index.html");
  if (!fs.existsSync(source)) throw new Error(`Missing generated route: ${route}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, rewriteRootPaths(fs.readFileSync(source, "utf8")));
}

const htaccess = `Options -Indexes
DirectoryIndex index.html
RewriteEngine On

# Retire legacy commerce routes while preserving useful inbound links.
RewriteRule ^(?:senior-care-platform/)?shop/memorial-trees(?:/.*)?$ /remember/living-tributes/ [R=301,L,NE]
RewriteRule ^(?:senior-care-platform/)?shop/products/living-memorial-tree(?:/.*)?$ /remember/living-tributes/ [R=301,L,NE]
RewriteRule ^(?:senior-care-platform/)?shop(?:/.*)?$ /remember/ [R=301,L,NE]
RewriteRule ^(?:senior-care-platform/)?membership(?:/.*)?$ /community/ [R=301,L,NE]
RewriteRule ^(?:senior-care-platform/)?sell-with-us(?:/.*)?$ /find-care/#listing-inquiry [R=301,L,NE]
RewriteRule ^(?:senior-care-platform/)?for-providers(?:/.*)?$ /find-care/#listing-inquiry [R=301,L,NE]
RewriteRule ^(?:senior-care-platform/)?submit-listing(?:/.*)?$ /find-care/#listing-inquiry [R=301,L,NE]

# Keep legacy campaign and Care Circle links working after the Hostinger move.
RewriteRule ^senior-care-platform/?(.*)$ /$1 [R=301,L]
RewriteRule ^care-circle/?$ /community/ [R=301,L]

# Preserve real files and route directories generated for WoafMeow.
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

ErrorDocument 404 /404.html
`;
fs.writeFileSync(path.join(publicHtml, ".htaccess"), htaccess);

const homeHtml = fs.readFileSync(path.join(publicHtml, "index.html"), "utf8");
const notFoundHtml = homeHtml
  .replace(/<title>[^<]*<\/title>/i, "<title>Page not found | WoafMeow</title>")
  .replace(
    /<main>[\s\S]*?<\/main>/i,
    `<main><section class="page-hero compact"><div class="wrap"><div class="page-hero-copy"><h1>We couldn’t find that page.</h1><p>The care you need may still be close by. Return home, ask Care Circle, or search the professional directory.</p><div class="actions"><a class="button primary" href="/">Return home</a><a class="button secondary" href="/community/">Ask Care Circle</a><a class="button secondary" href="/find-care/">Find care</a></div></div></div></section></main>`,
  );
fs.writeFileSync(path.join(publicHtml, "404.html"), notFoundHtml);

// Keep every dynamic request on the same Hostinger origin as the public site.
const apiDir = path.join(publicHtml, "api");
fs.mkdirSync(apiDir, { recursive: true });
fs.writeFileSync(path.join(apiDir, ".htaccess"), `<FilesMatch "^\\.env">
Require all denied
</FilesMatch>

RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.php [QSA,L]
`);
fs.copyFileSync(path.join(root, "hostinger-api", "index.php"), path.join(apiDir, "index.php"));
fs.copyFileSync(
  path.join(root, "hostinger-api", "WoafMeow_Senior_Dog_Care_Field_Guide.pdf"),
  path.join(apiDir, "WoafMeow_Senior_Dog_Care_Field_Guide.pdf"),
);
fs.writeFileSync(path.join(apiDir, ".env.example"), `# Copy this file to api/.env on Hostinger, then replace each placeholder.
# These three values are required for retained-form owner notifications.
BREVO_API_KEY=
BREVO_SENDER_EMAIL=hello@woafmeow.com
FORM_NOTIFICATION_EMAIL=robert.luo@woafmeow.com
BREVO_WEBSITE_LIST_ID=
`);

// Hostinger PHP must be able to create account and form records. Keep the
// storage folder on the site volume while denying direct web access.
const dataDir = path.join(publicHtml, ".woafmeow-data");
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, ".htaccess"), `Require all denied\n`);

fs.writeFileSync(path.join(output, "HOSTINGER_DEPLOYMENT.md"), `# WoafMeow Hostinger deployment

- Upload the contents of \`public_html/\` to the WoafMeow site's \`public_html\` directory.
- Connect both \`woafmeow.com\` and \`www.woafmeow.com\` in Hostinger.
- Set \`www.woafmeow.com\` as the preferred domain and enable SSL.
- The site is generated for the domain root; there is no \`/senior-care-platform/\` path.
- Dynamic \`/api/*\` requests run directly on Hostinger through \`public_html/api/index.php\`.
- Account and form records are stored in \`public_html/.woafmeow-data/\`; its included \`.htaccess\` blocks public access.
- Copy \`public_html/api/.env.example\` to \`public_html/api/.env\`. For retained-form notifications, set \`BREVO_API_KEY\`, a Brevo-verified \`BREVO_SENDER_EMAIL\`, and \`FORM_NOTIFICATION_EMAIL\`; set \`BREVO_WEBSITE_LIST_ID\` when contact-list sync is enabled. The included API \`.htaccess\` blocks both files from public access.
- Form notifications default to \`robert.luo@woafmeow.com\` in the backend source.
`);

console.log(`Staged ${routes.length} root routes for Hostinger in ${publicHtml}`);

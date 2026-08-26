import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("./dist/", import.meta.url)));
const PORT = Number.parseInt(process.env.WOAFY_PREVIEW_PORT || "4190", 10);
const HOST = process.env.WOAFY_PREVIEW_HOST || "127.0.0.1";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

if (!existsSync(join(ROOT, "index.html"))) {
  throw new Error("Preview build not found. Run `node build-site.mjs` first.");
}

function sendFile(response, path, status = 200) {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self' https://www.woafmeow.com https://woafypet-senior-care.pages.dev; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://www.woafmeow.com https://woafypet-senior-care.pages.dev",
    "Content-Type": mimeTypes[extname(path)] || "application/octet-stream",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  });
  createReadStream(path).pipe(response);
}

const server = createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, {
      "Allow": "GET, HEAD",
      "Content-Type": "application/json; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    });
    response.end(JSON.stringify({ previewOnly: true, message: "Submissions are disabled in this private preview." }));
    return;
  }

  const decodedPath = decodeURIComponent(url.pathname);
  const normalizedPath = normalize(decodedPath).replace(/^\.\.(?:[/\\]|$)/, "");
  let filePath = resolve(ROOT, `.${normalizedPath}`);

  if (!filePath.startsWith(ROOT)) {
    sendFile(response, join(ROOT, "404.html"), 404);
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    if (!decodedPath.endsWith("/")) {
      response.writeHead(308, {
        "Location": `${decodedPath}/${url.search}`,
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      });
      response.end();
      return;
    }
    filePath = join(filePath, "index.html");
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    sendFile(response, join(ROOT, "404.html"), 404);
    return;
  }

  if (request.method === "HEAD") {
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self' https://www.woafmeow.com https://woafypet-senior-care.pages.dev; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://www.woafmeow.com https://woafypet-senior-care.pages.dev",
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    });
    response.end();
    return;
  }

  sendFile(response, filePath);
});

server.listen(PORT, HOST, () => {
  console.log(`WoafyPet private preview: http://${HOST}:${PORT}`);
});

const close = () => server.close(() => process.exit(0));
process.on("SIGINT", close);
process.on("SIGTERM", close);

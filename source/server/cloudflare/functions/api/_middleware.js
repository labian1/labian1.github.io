const productionOrigins = new Set([
  "https://labian1.github.io",
  "https://woafmeow.com",
  "https://www.woafmeow.com",
]);

const allowedOrigin = (request) => {
  const origin = request.headers.get("origin") || "";
  if (productionOrigins.has(origin)) return origin;
  try {
    const url = new URL(origin);
    if (["localhost", "127.0.0.1"].includes(url.hostname) && ["http:", "https:"].includes(url.protocol)) return origin;
  } catch {
    // A missing or invalid Origin is valid for same-origin and server-to-server requests.
  }
  return "";
};

const addCorsHeaders = (headers, origin) => {
  if (origin) headers.set("access-control-allow-origin", origin);
  headers.set("access-control-allow-methods", "GET, POST, DELETE, OPTIONS");
  headers.set("access-control-allow-headers", "content-type, x-care-circle-member, x-care-circle-token");
  headers.set("access-control-max-age", "86400");
  headers.append("vary", "Origin");
};

export async function onRequest(context) {
  const origin = allowedOrigin(context.request);
  if (context.request.method === "OPTIONS") {
    const headers = new Headers();
    addCorsHeaders(headers, origin);
    return new Response(null, { status: 204, headers });
  }

  const response = await context.next();
  const headers = new Headers(response.headers);
  addCorsHeaders(headers, origin);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

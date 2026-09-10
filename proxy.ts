import { NextRequest, NextResponse } from "next/server";

/**
 * Markdown content negotiation for agents (RFC 8288 + Cloudflare "Markdown for Agents").
 *
 * When a client requests the homepage (or any top-level page) with
 * `Accept: text/markdown`, rewrite the request to `/api/markdown` which
 * returns a markdown representation of the page. Browsers (which send
 * `Accept: text/html,...`) continue to receive HTML.
 */
export function proxy(request: NextRequest) {
  const accept = request.headers.get("accept") || "";
  const { pathname, search } = request.nextUrl;

  // Skip Next.js internals, static files, API routes, and well-known resources
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/.well-known") ||
    pathname.includes(".") // files like /favicon.ico, /llms.txt, images
  ) {
    return NextResponse.next();
  }

  // Prefer markdown only when the client explicitly asks for it and it ranks
  // ahead of text/html. Simple check: text/markdown present and either
  // text/html absent or markdown appears first.
  const wantsMarkdown = /text\/markdown/i.test(accept);
  const htmlIndex = accept.toLowerCase().indexOf("text/html");
  const mdIndex = accept.toLowerCase().indexOf("text/markdown");
  const markdownPreferred =
    wantsMarkdown && (htmlIndex === -1 || mdIndex < htmlIndex);

  if (markdownPreferred) {
    const url = request.nextUrl.clone();
    url.pathname = "/api/markdown";
    url.searchParams.set("path", pathname + search);
    const res = NextResponse.rewrite(url);
    res.headers.set("Vary", "Accept");
    return res;
  }

  const res = NextResponse.next();
  res.headers.set("Vary", "Accept");
  return res;
}

export const config = {
  matcher: [
    // Run on all paths except static assets and Next internals.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

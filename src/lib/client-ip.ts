import type { NextRequest } from "next/server";

// Behind Cloudflare -> Apache, cf-connecting-ip is the authoritative client
// address; x-forwarded-for can be rewritten by intermediate proxies. Falling
// back to a single proxy IP would rate limit every visitor as one bucket.
export function clientIp(request: NextRequest) {
  return request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "anonymous";
}

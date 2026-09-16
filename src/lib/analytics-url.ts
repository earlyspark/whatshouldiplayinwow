/** Remove shareable result IDs and query parameters from analytics URLs. */
export function redactedPageUrl(href: string, base?: string): URL {
  const url = new URL(href, base);
  url.search = "";
  url.hash = "";
  if (/^\/result\/[^/]+\/?$/.test(url.pathname)) url.pathname = "/result/[id]";
  return url;
}

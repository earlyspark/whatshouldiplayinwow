function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;

  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl().replace(/\/+$/, "");

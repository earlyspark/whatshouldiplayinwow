/**
 * Resolves the canonical origin for metadata, sitemaps, and share links.
 *
 * Production sets NEXT_PUBLIC_SITE_URL to the custom domain. Preview
 * deployments leave it unset and fall back to the deployment's own hostname,
 * so preview canonical tags and Open Graph images reference the preview
 * rather than production.
 */
function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;

  // Vercel-provided hostnames never include a protocol.
  const vercelHost =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
      : process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;

  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl().replace(/\/+$/, "");

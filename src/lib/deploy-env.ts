/**
 * Host-neutral deployment environment.
 *
 * Replaces the Vercel-provided `VERCEL` / `VERCEL_ENV` pair. `APP_ENV` is set
 * on the server (cPanel Node.js app) and at build time (GitHub Actions); an
 * unset or unrecognised value deliberately falls back to "development" so a
 * misconfigured host degrades to the safe, non-recording behaviour rather than
 * silently writing to production data.
 */
export type DeployEnv = "production" | "preview" | "development";

export function deployEnv(): DeployEnv {
  const value = process.env.APP_ENV;
  return value === "production" || value === "preview" ? value : "development";
}

export function isProductionDeployment() {
  return deployEnv() === "production";
}

export function isPreviewDeployment() {
  return deployEnv() === "preview";
}

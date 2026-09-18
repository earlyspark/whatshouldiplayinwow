// APP_ENV is set on the server and at build time; unset or unknown values fall back to
// "development" so a misconfigured host never writes to production data.
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

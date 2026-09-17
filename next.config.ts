import type { NextConfig } from "next";
import { contentSecurityPolicy } from "./src/lib/content-security-policy";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
  // Webpack can't trace the OG routes' process.cwd() file reads, so ship them explicitly.
  outputFileTracingIncludes: {
    "/*": ["./assets/crest.png", "./assets/fonts/*.ttf"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy(process.env.NODE_ENV === "development") },
        ],
      },
    ];
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;

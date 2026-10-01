import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["pg"],
  // Pre-deploy executes inside the traced runtime artifact, not the source checkout.
  // Include server-only migration tooling and its raw pg dependencies explicitly.
  outputFileTracingIncludes: {
    "/*": [
      "./scripts/migrate.mjs",
      "./scripts/verify-database.mjs",
      "./scripts/cleanup-contact-probe.mjs",
      "./migrations/*.sql",
      "./package.json",
      "./node_modules/pg*/**/*",
      "./node_modules/postgres-*/**/*",
      "./node_modules/split2/**/*",
      "./node_modules/xtend/**/*",
    ],
  },
};

export default nextConfig;

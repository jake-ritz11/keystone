import type { NextConfig } from "next";

const config: NextConfig = {
  // The packages ship TypeScript source, so Next compiles them along with the app.
  transpilePackages: ["@keystone-ui/tokens", "@keystone-ui/ui"],
};

export default config;

import { withBaml } from "@boundaryml/baml-nextjs-plugin";
import type { NextConfig } from "next";

// Import and trigger environment validation at server startup
// This ensures the application fails fast with clear error messages
// if required environment variables are missing or invalid
import "./lib/schemas/env";

const nextConfig: NextConfig = {
  // Experimental features for debugging
  experimental: {
    browserDebugInfoInTerminal: true,
  },
};

export default withBaml()(nextConfig);

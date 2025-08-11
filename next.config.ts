import { withBaml } from "@boundaryml/baml-nextjs-plugin";
import type { NextConfig } from "next";

// Import and trigger environment validation at server startup
// This ensures the application fails fast with clear error messages
// if required environment variables are missing or invalid
import "./lib/schemas/env";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },
};

export default withBaml()(nextConfig);

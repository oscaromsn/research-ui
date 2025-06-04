import { withBaml } from "@boundaryml/baml-nextjs-plugin"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
}

// biome-ignore lint/style/noDefaultExport: Next.js requires default export for config
export default withBaml()(nextConfig)

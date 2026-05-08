import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/skills/[slug]/download": ["./skills/**/*"],
    "/skills/[slug]/source": ["./skills/**/*"],
  },
};

export default nextConfig;

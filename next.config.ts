import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep Next's type checking enabled while avoiding the CLI output parser
    // issue observed with the local Node/TypeScript toolchain.
    useTypeScriptCli: false,
  },
};

export default nextConfig;

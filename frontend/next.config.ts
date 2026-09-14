import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactCompiler: true,
    experimental: {
        // Cached production compilations have reused the retired global stylesheet.
        turbopackFileSystemCacheForBuild: false,
    },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents / partialPrefetching are off: every signed-in page reads cookies per request,
  // and the pages are built by several people; static-shell rules would break their builds.
  distDir: process.env.NEXT_DIST_DIR || ".next", // parallel agents use separate build dirs
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"], // the dev server is opened at 127.0.0.1 by the tests
  async redirects() {
    return [
      { source: "/team", destination: "/team/families", permanent: false },
      { source: "/dashboard/children", destination: "/dashboard", permanent: false },
    ];
  },
};

export default nextConfig;

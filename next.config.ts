import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
  async redirects() {
    const rules = [
      {
        source: "/reduce-image-size",
        destination: "/image-resizer",
        permanent: true,
      },
      {
        source: "/reduce-images-size",
        destination: "/image-resizer",
        permanent: true,
      },
    ];

    const fromHost = process.env.REDIRECT_FROM_HOST?.trim();
    const targetOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(
      /\/+$/,
      ""
    );

    if (!fromHost || !targetOrigin) {
      return rules;
    }

    return [
      ...rules,
      {
        source: "/:path*",
        has: [{ type: "host", value: fromHost }],
        destination: `${targetOrigin}/:path*`,
        permanent: true,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

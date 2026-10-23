import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const apiUrl = new URL(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
);

const remotePattern: RemotePattern = {
  protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
  hostname: apiUrl.hostname,
  port: apiUrl.port,
  pathname: "/images/**",
};

const nextConfig: NextConfig = {
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  images: {
    remotePatterns: [
      remotePattern,
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;

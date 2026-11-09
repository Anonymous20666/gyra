import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/((?!api|_next/static|favicon.ico).*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      {
        source: "/:path*.(png|jpg|jpeg|webp|svg|avif|ico|gif|woff|woff2|ttf|otf|mp4|webm|mp3)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;

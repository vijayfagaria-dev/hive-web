import type { NextConfig } from "next";

// Proxy /api/* to the FastAPI backend so the browser only ever talks to the Next
// origin — session cookies stay same-origin (no CORS). Override API_ORIGIN in prod.
const API_ORIGIN = process.env.API_ORIGIN ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;

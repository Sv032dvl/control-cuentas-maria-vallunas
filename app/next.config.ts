import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permitir SVG como imágenes con next/image
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;

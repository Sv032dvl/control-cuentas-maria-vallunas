import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "María Vallunas — Control de Caja",
    short_name: "María Vallunas",
    description:
      "Cierre diario de caja y rentabilidad por unidad de negocio.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff7ed",
    theme_color: "#c2410c",
    lang: "es-CO",
    categories: ["business", "finance", "productivity"],
    icons: [
      // Next.js genera /icon (512px) y /apple-icon (180px) desde icon.tsx + apple-icon.tsx
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}

import type { MetadataRoute } from "next";

import { BRAND, BRAND_COLORS } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: "Cayenne",
    description: BRAND.description,
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: BRAND_COLORS.cream,
    theme_color: BRAND_COLORS.cream,
    categories: ["health", "lifestyle", "productivity"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/512-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Log cayenne", url: "/log", description: "Log today in ten seconds" },
      { name: "My progress", url: "/progress", description: "Streaks and trends" },
    ],
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PsychPath",
    short_name: "PsychPath",
    description:
      "A Duolingo-style psychology trainer — master's prep, gamified.",
    start_url: "/learn",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f5fc",
    theme_color: "#6c5ce7",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StayRank",
    short_name: "StayRank",
    description:
      "Plan a trip with friends and rank where to stay — everyone's top 3, with notes, into one leaderboard.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6fbff",
    theme_color: "#1e93f0",
    orientation: "portrait",
    categories: ["travel", "productivity", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

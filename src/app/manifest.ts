import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "آرینو | نوبت‌دهی آرایشگاه",
    short_name: "آرینو",
    description: "جستجو و رزرو خدمات زیبایی در آرینو",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#171717",
    lang: "fa",
    dir: "rtl",
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

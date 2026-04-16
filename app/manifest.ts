import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prumo",
    short_name: "Prumo",
    description: "Seu sistema de gestão pessoal — produtividade, finanças, hábitos e mais.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0B0B0B",
    theme_color: "#00C878",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  }
}

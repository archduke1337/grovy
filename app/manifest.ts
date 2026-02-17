import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Grovy",
    short_name: "Grovy",
    description: "A premium open-source music player built for the web",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#000000",
    theme_color: "#000000",
    dir: "ltr",
    lang: "en-US",
    icons: [
      {
        src: "/icons/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["music", "multimedia", "entertainment"],
    shortcuts: [
      {
        name: "Play Music",
        short_name: "Play",
        description: "Launch the music player",
        url: "/",
        icons: [
          {
            src: "/icons/logo.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    ],
  };
}

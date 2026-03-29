import { MetadataRoute } from "next";
import { APP_DESCRIPTION, APP_NAME } from "@/app/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
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
        name: "Search Music",
        short_name: "Search",
        description: "Open Grovy and search music",
        url: "/?q=lofi",
        icons: [
          {
            src: "/icons/logo.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      {
        name: "Open Source",
        short_name: "Code",
        description: "View project details and repository links",
        url: "/opensource",
        icons: [
          {
            src: "/icons/logo.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      {
        name: "Home",
        short_name: "Home",
        description: "Open the player home",
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

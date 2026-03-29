import type { Metadata } from "next";
import { APP_NAME } from "@/app/lib/seo";

export const metadata: Metadata = {
  title: "Playlists",
  description: `Your local playlists in ${APP_NAME}.`,
  alternates: {
    canonical: "/playlists",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function PlaylistsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import type { Metadata } from "next";
import { APP_NAME } from "@/app/lib/seo";

export const metadata: Metadata = {
  title: "Favorites",
  description: `Your personal favorites in ${APP_NAME}.`,
  alternates: {
    canonical: "/favorites",
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

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

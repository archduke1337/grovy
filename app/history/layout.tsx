import type { Metadata } from "next";
import { APP_NAME } from "@/app/lib/seo";

export const metadata: Metadata = {
  title: "History",
  description: `Your personal listening history in ${APP_NAME}.`,
  alternates: {
    canonical: "/history",
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

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

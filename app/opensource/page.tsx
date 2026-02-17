import type { Metadata } from "next";
import { OpenSourceContent } from "./OpenSourceContent";

export const metadata: Metadata = {
  title: "Open Source",
  description: "Grovy is a free, open-source music player built with Next.js, TypeScript, and modern web technologies. View the source code, contribute, and join the community.",
  openGraph: {
    title: "Open Source | Grovy",
    description: "Grovy is a free, open-source music player built with Next.js, TypeScript, and modern web technologies.",
    images: ["/icons/logo.png"],
  },
};

export default function OpenSourcePage() {
  return <OpenSourceContent />;
}

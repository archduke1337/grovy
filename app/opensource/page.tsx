import type { Metadata } from "next";
import { APP_NAME, absoluteUrl } from "@/app/lib/seo";
import { OpenSourceContent } from "./OpenSourceContent";

const canonicalPath = "/opensource";
const pageTitle = `Open Source | ${APP_NAME}`;
const pageDescription =
  "See how Grovy is built, browse the source code, and contribute to the open-source web music player.";

export const metadata: Metadata = {
  title: "Open Source",
  description: pageDescription,
  alternates: {
    canonical: canonicalPath,
  },
  keywords: [
    "grovy open source",
    "music player source code",
    "next.js music app",
    "contribute to grovy",
  ],
  openGraph: {
    type: "website",
    url: absoluteUrl(canonicalPath),
    title: pageTitle,
    description: pageDescription,
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "Grovy open-source page",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: [absoluteUrl("/twitter-image")],
  },
};

export default function OpenSourcePage() {
  const sourceCodeSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: APP_NAME,
    description: pageDescription,
    codeRepository: "https://github.com/archduke1337/grovy",
    license: "https://github.com/archduke1337/grovy/blob/master/LICENSE",
    programmingLanguage: ["TypeScript", "JavaScript"],
    runtimePlatform: "Web",
    url: absoluteUrl(canonicalPath),
  };

  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: pageTitle,
    description: pageDescription,
    url: absoluteUrl(canonicalPath),
    mainEntity: {
      "@type": "SoftwareApplication",
      name: APP_NAME,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web",
      isAccessibleForFree: true,
    },
  };

  return (
    <>
      <OpenSourceContent />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sourceCodeSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
      />
    </>
  );
}

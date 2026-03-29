import type { Metadata } from "next";
import { APP_NAME, absoluteUrl } from "@/app/lib/seo";

const canonicalPath = "/tos";
const pageTitle = `Terms of Service | ${APP_NAME}`;
const pageDescription =
  "Read the Grovy terms, privacy details, and usage conditions for the web music player.";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: pageDescription,
  alternates: {
    canonical: canonicalPath,
  },
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
        alt: "Grovy terms of service",
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

export default function TermsOfService() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 pb-32 space-y-8 sm:space-y-12">
      <header className="space-y-3 sm:space-y-4">
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-white/20">
          Legal
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-[-0.03em]">
          Terms of Service
        </h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-white/30 font-medium">
          Last updated: February 18, 2026
        </p>
      </header>

      <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 sm:space-y-8">
        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">1. Acceptance of Terms</h2>
          <p className="text-[14px] sm:text-[15px] text-gray-600 dark:text-white/40 leading-relaxed">
            By accessing and using Grovy ("the Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. Grovy is an open-source music player that allows you to play, discover, and manage music.
          </p>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">2. Description of Service</h2>
          <p className="text-[14px] sm:text-[15px] text-gray-600 dark:text-white/40 leading-relaxed">
            Grovy is a web-based music player application that provides the following features:
          </p>
          <ul className="space-y-2 text-[14px] sm:text-[15px] text-gray-600 dark:text-white/40 list-disc list-inside leading-relaxed">
            <li>Music search and discovery via third-party APIs</li>
            <li>Local audio file playback</li>
            <li>Playlist creation and management (stored locally)</li>
            <li>Music streaming and playback controls</li>
            <li>Trending and chart exploration by region</li>
          </ul>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">3. User Responsibilities</h2>
          <p className="text-[14px] sm:text-[15px] text-gray-600 dark:text-white/40 leading-relaxed">
            You are responsible for your use of the Service and any content you access through it. You agree not to use the Service for any unlawful purpose or in any way that could damage, disable, overburden, or impair the Service. You are solely responsible for ensuring that your use of any content complies with applicable copyright laws.
          </p>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">4. Intellectual Property</h2>
          <p className="text-[14px] sm:text-[15px] text-gray-600 dark:text-white/40 leading-relaxed">
            Grovy is open-source software licensed under the MIT License. The source code is freely available and can be modified, distributed, and used in accordance with the MIT License terms. Music content accessed through the Service is the property of the respective rights holders.
          </p>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">5. Privacy & Data</h2>
          <p className="text-[14px] sm:text-[15px] text-gray-600 dark:text-white/40 leading-relaxed">
            Grovy respects your privacy. User preferences, playlists, favorites, playback history, and metadata caches are stored locally in your browser using localStorage and IndexedDB. Search and streaming requests are routed through Grovy API endpoints only to fetch music metadata or media from upstream providers. If the app is deployed on Vercel, privacy-focused aggregated usage metrics may also be processed through Vercel Web Analytics.
          </p>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">6. Third-Party Services</h2>
          <p className="text-[14px] sm:text-[15px] text-gray-600 dark:text-white/40 leading-relaxed">
            The Service may utilize third-party APIs and services for music data retrieval and streaming. We are not responsible for the content, availability, or policies of these third-party services. Your use of such services is subject to their respective terms and conditions.
          </p>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">7. Disclaimer of Warranties</h2>
          <p className="text-[14px] sm:text-[15px] text-gray-600 dark:text-white/40 leading-relaxed">
            The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or free of harmful components.
          </p>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">8. Limitation of Liability</h2>
          <p className="text-[14px] sm:text-[15px] text-gray-600 dark:text-white/40 leading-relaxed">
            In no event shall Grovy or its contributors be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Service.
          </p>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">9. Changes to Terms</h2>
          <p className="text-[14px] sm:text-[15px] text-gray-600 dark:text-white/40 leading-relaxed">
            We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated revision date. Your continued use of the Service following any changes constitutes acceptance of those changes.
          </p>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">10. Contact</h2>
          <p className="text-[14px] sm:text-[15px] text-gray-600 dark:text-white/40 leading-relaxed">
            If you have any questions about these Terms, please reach out via{" "}
            <a href="https://archduke.is-a.dev/contact" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2 transition-colors">
              our contact page
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}

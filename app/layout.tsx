import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import { Analytics } from "@vercel/analytics/next"
import { PlayerProvider } from "@/app/context/PlayerContext";
import "./globals.css";
import { Navbar } from "@/app/components/Navbar";
import { Sidebar } from "@/app/components/Sidebar";
import { BottomPlayer } from "@/app/components/BottomPlayer";
import { ToastProvider } from "@/app/components/Toast";

// Dynamic imports for non-critical components (no ssr: false in Server Components)
const CommandPalette = dynamic(() => import("@/app/components/CommandPalette").then(m => ({ default: m.CommandPalette })));
const AmbientBackground = dynamic(() => import("@/app/components/AmbientBackground").then(m => ({ default: m.AmbientBackground })));
const SmoothScroll = dynamic(() => import("@/app/components/SmoothScroll"));
const KeyboardShortcuts = dynamic(() => import("@/app/components/KeyboardShortcuts").then(m => ({ default: m.KeyboardShortcuts })));

const APP_NAME = "Grovy";
const APP_DESCRIPTION = "A premium open-source music player built for the web. Stream, discover, and enjoy music with a beautiful interface.";
const APP_URL = "https://grovy.vercel.app";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: `${APP_NAME} — Premium Music Streaming`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "music player",
    "web music player",
    "open source",
    "streaming",
    "grovy",
    "PWA",
    "next.js",
    "music discovery",
    "trending music",
    "charts",
    "lyrics",
    "audio player",
  ],
  authors: [{ name: "Archduke", url: "https://archduke.is-a.dev" }],
  creator: "Archduke",
  publisher: "Archduke",
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "https://grovy.vercel.app",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Premium Music Streaming`,
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/icons/logo.png",
        width: 512,
        height: 512,
        alt: "Grovy Logo",
        type: "image/png",
      },
      {
        url: "/icons/logo.png",
        width: 1200,
        height: 630,
        alt: "Grovy - Open Source Music Player",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Premium Music Streaming`,
    description: APP_DESCRIPTION,
    images: ["/icons/logo.png"],
    creator: "@archduke1337",
  },
  icons: {
    icon: [
      { url: "/icons/logo.png", type: "image/png", sizes: "any" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/icons/logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "Entertainment",
  referrer: "origin-when-cross-origin",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Performance: DNS Prefetch for external domains */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://ytapi.gauravramyadav.workers.dev" />
        <link rel="dns-prefetch" href="https://jiosaavn-api.gauravramyadav.workers.dev" />

        {/* Preconnect for critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Pixel font for brand name */}
        <link href="https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&display=swap" rel="stylesheet" />
        
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
        <meta name="msapplication-TileColor" content="#000000" />
        
        <link rel="icon" type="image/png" href="/icons/logo.png" />
        <link rel="shortcut icon" href="/icons/logo.png" />
        <link rel="apple-touch-icon" href="/icons/logo.png" />
        
        {/* Structured Data (JSON-LD) for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: APP_NAME,
              description: APP_DESCRIPTION,
              url: APP_URL,
              applicationCategory: "MultimediaApplication",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "1000",
              },
              screenshot: [
                {
                  "@type": "ImageObject",
                  url: `${APP_URL}/icons/logo.png`,
                  width: 512,
                  height: 512,
                },
              ],
              author: {
                "@type": "Person",
                name: "Archduke",
                url: "https://archduke.is-a.dev",
              },
              inLanguage: "en-US",
              isAccessibleForFree: true,
              operatingSystem: ["Web"],
              permissions: ["music streaming", "offline playback"],
            }),
          }}
        />

        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: APP_NAME,
              url: APP_URL,
              logo: `${APP_URL}/icons/logo.png`,
              description: APP_DESCRIPTION,
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "Customer Support",
                url: "https://github.com/archduke1337/grovy/issues",
              },
              sameAs: [
                "https://github.com/archduke1337/grovy",
                "https://twitter.com",
              ],
            }),
          }}
        />
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then((registration) => console.log('SW registered'))
                    .catch((error) => console.log('SW registration failed:', error));
                });
              }
            `,
          }}
        />
      </head>
      <body className="bg-[#f5f5f7] dark:bg-black min-h-dvh overflow-x-hidden antialiased" suppressHydrationWarning>
        <PlayerProvider>
          <ToastProvider>
          <AmbientBackground />
          <KeyboardShortcuts />
          <div className="flex">
            <Sidebar />
            <div className="flex-1 lg:ml-64 relative min-h-dvh flex flex-col">
              <SmoothScroll>
                <CommandPalette />
                <Navbar />
                <main className="flex-1 pt-14 sm:pt-16 md:pt-20 pb-28 sm:pb-32 safe-bottom">
                  {children}
                </main>
                <BottomPlayer />
              </SmoothScroll>
            </div>
          </div>
          </ToastProvider>
          <Analytics />
        </PlayerProvider>
      </body>
    </html>
  );
}

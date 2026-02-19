import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next"
import { PlayerProvider } from "@/app/context/PlayerContext";
import "./globals.css";
import { Navbar } from "@/app/components/Navbar";
import { BottomPlayer } from "@/app/components/BottomPlayer";
import { CommandPalette } from "@/app/components/CommandPalette";
import { AmbientBackground } from "@/app/components/AmbientBackground";
import SmoothScroll from "@/app/components/SmoothScroll";
import { ToastProvider } from "@/app/components/Toast";

const APP_NAME = "Grovy";
const APP_DESCRIPTION = "A premium open-source music player built for the web. Stream, discover, and enjoy music with a beautiful interface.";
const APP_URL = "https://grovy.vercel.app";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: `${APP_NAME} — Open Source Music Player`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: ["music player", "web music player", "open source", "streaming", "grovy", "PWA", "next.js"],
  authors: [{ name: "Archduke", url: "https://archduke.is-a.dev" }],
  creator: "Archduke",
  publisher: "Archduke",
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Open Source Music Player`,
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/icons/logo.png",
        width: 512,
        height: 512,
        alt: "Grovy Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Open Source Music Player`,
    description: APP_DESCRIPTION,
    images: ["/icons/logo.png"],
  },
  icons: {
    icon: [
      { url: "/icons/logo.png", type: "image/png" },
    ],
    apple: [
      { url: "/icons/logo.png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
  },
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
        {/* Pixel font for brand name */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&display=swap" rel="stylesheet" />
        
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
        <meta name="msapplication-TileColor" content="#000000" />
        
        <link rel="icon" type="image/png" href="/icons/logo.png" />
        <link rel="shortcut icon" href="/icons/logo.png" />
        <link rel="apple-touch-icon" href="/icons/logo.png" />
        
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
      <body className="bg-[#f5f5f7] dark:bg-black min-h-screen min-h-dvh overflow-x-hidden antialiased" suppressHydrationWarning>
        <PlayerProvider>
          <ToastProvider>
          <AmbientBackground />
          <SmoothScroll>
            <CommandPalette />
            <Navbar />
            <main className="min-h-screen min-h-dvh pt-14 sm:pt-16 md:pt-20 pb-28 sm:pb-32 safe-bottom">
              {children}
            </main>
            <BottomPlayer />
          </SmoothScroll>
          </ToastProvider>
          <Analytics />
        </PlayerProvider>
      </body>
    </html>
  );
}

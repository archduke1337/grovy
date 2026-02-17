import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next"
import { PlayerProvider } from "@/app/context/PlayerContext";
import "./globals.css";
import { Navbar } from "@/app/components/Navbar";
import { BottomPlayer } from "@/app/components/BottomPlayer";
import { CommandPalette } from "@/app/components/CommandPalette";
import { AmbientBackground } from "@/app/components/AmbientBackground";
import SmoothScroll from "@/app/components/SmoothScroll";

const APP_NAME = "Grovy";
const APP_DESCRIPTION = "Premium open-source web music player";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: APP_NAME,
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#007AFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />

        <meta name="msapplication-TileColor" content="#007AFF" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
        <link rel="shortcut icon" href="/icons/icon.svg" />
        <link
          rel="apple-touch-icon"
          href="/icons/icon.svg"
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
      <body className="bg-bg dark:bg-bg-dark min-h-screen overflow-x-hidden antialiased" suppressHydrationWarning>
        <PlayerProvider>
          <AmbientBackground />
          <SmoothScroll>
            <CommandPalette />
            <Navbar />
            <main className="min-h-screen pt-20 pb-24">
              {children}
            </main>
            <BottomPlayer />
          </SmoothScroll>
          <Analytics />
        </PlayerProvider>
      </body>
    </html>
  );
}

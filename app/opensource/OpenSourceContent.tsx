"use client";

import { motion } from "framer-motion";
import { Github, GitBranch, Star, ExternalLink, Shield, Terminal, Radio, Disc3, Headphones, Eye } from "lucide-react";
import Image from "next/image";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.06, delayChildren: 0.1 } 
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, y: 0, 
    transition: { type: "spring", stiffness: 220, damping: 30 } 
  }
};

const TECH_STACK = [
  { layer: "Framework", tech: "Next.js 16 + Turbopack", role: "App router, API routes, SSR" },
  { layer: "Language", tech: "TypeScript", role: "Type safety across client and server" },
  { layer: "Styling", tech: "Tailwind CSS", role: "Utility classes, dark mode, responsive" },
  { layer: "Animation", tech: "Framer Motion", role: "Layout transitions, gestures, spring physics" },
  { layer: "Streaming", tech: "HLS.js + YT IFrame", role: "Adaptive bitrate, dual-source playback" },
  { layer: "Validation", tech: "Zod", role: "Runtime schema validation on API responses" },
  { layer: "Color", tech: "ColorThief", role: "Dominant palette extraction from artwork" },
  { layer: "Deployment", tech: "Vercel", role: "Edge functions, CDN, analytics" },
];

const API_ROUTES = [
  { method: "GET", path: "/api/songs", desc: "Search + trending + charts" },
  { method: "GET", path: "/api/stream", desc: "Audio stream proxy with codec selection" },
  { method: "GET", path: "/api/search", desc: "Multi-source search (songs, artists, albums)" },
  { method: "GET", path: "/api/lyrics", desc: "Lyrics lookup by title + artist" },
  { method: "GET", path: "/api/songs/radio", desc: "Auto-generated radio queue" },
  { method: "GET", path: "/api/songs/related", desc: "Related tracks for current song" },
  { method: "GET", path: "/api/artist/info", desc: "Artist metadata and top songs" },
];

export function OpenSourceContent() {
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-[860px] mx-auto px-4 sm:px-5 md:px-6 py-6 sm:py-10 md:py-16 pb-36 space-y-12 sm:space-y-16 md:space-y-24"
    >
      {/* Hero */}
      <motion.header variants={fadeUp} className="space-y-5 sm:space-y-6 md:space-y-8">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Image 
            src="/icons/logo.png" 
            alt="Grovy" 
            width={40} 
            height={40} 
            className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10"
          />
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-white/20">
            Open Source
          </span>
        </div>

        <h1 className="text-[2rem] sm:text-[2.8rem] md:text-[3.5rem] lg:text-[4.2rem] font-bold text-gray-900 dark:text-white tracking-[-0.04em] leading-[1.05]">
          Built in the open,<br />
          <span className="text-gray-300 dark:text-white/15">because music should be free.</span>
        </h1>

        <p className="text-[14px] sm:text-[15px] md:text-[17px] text-gray-500 dark:text-white/35 leading-[1.7] max-w-[640px]">
          Grovy started as a weekend project — a frustration with bloated music players 
          that track everything you listen to. No ads, no accounts, no invasive tracking. 
          Just a clean player that respects your time and your data, with privacy-first local storage 
          and optional aggregated analytics when deployed on Vercel.
          The entire source code is on GitHub under the MIT license.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-1">
          <a 
            href="https://github.com/archduke1337/grovy" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-semibold text-[13px] hover:opacity-90 transition-all active:scale-[0.98]"
          >
            <Github size={16} />
            Source Code
            <ExternalLink size={12} className="opacity-40" />
          </a>
          <a 
            href="https://github.com/archduke1337/grovy/stargazers" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-transparent text-gray-600 dark:text-white/50 font-semibold text-[13px] hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all border border-gray-200 dark:border-white/[0.06]"
          >
            <Star size={14} />
            Star on GitHub
          </a>
        </div>
      </motion.header>

      {/* What it does */}
      <motion.section variants={fadeUp} className="space-y-5 sm:space-y-6">
        <h2 className="text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/20">
          What it does
        </h2>

        <div className="space-y-4 sm:space-y-5">
          {[
            { 
              icon: Radio, 
              title: "Streams from multiple sources", 
              body: "Grovy pulls from JioSaavn and YouTube Music simultaneously, interleaves results, and lets you play anything instantly. No account needed." 
            },
            { 
              icon: Eye, 
              title: "Ambient UI that adapts to your music", 
              body: "Album art colors are extracted in real-time using ColorThief. The entire interface — backgrounds, gradients, accents — shifts to match whatever you're listening to." 
            },
            { 
              icon: Headphones, 
              title: "Proper audio handling",
              body: "HLS adaptive streaming for JioSaavn tracks, YouTube IFrame API for YT content, with automatic codec selection preferring opus/webm at the highest available bitrate." 
            },
            { 
              icon: Disc3, 
              title: "Runs entirely in the browser", 
              body: "Playlists, favorites, play history, and cached metadata are stored locally in localStorage + IndexedDB. There is no app-managed user database." 
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3 sm:gap-4 md:gap-5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={15} className="text-gray-500 dark:text-white/30 sm:w-[17px] sm:h-[17px]" />
              </div>
              <div className="space-y-0.5 sm:space-y-1 min-w-0">
                <h3 className="font-semibold text-[14px] sm:text-[15px] text-gray-900 dark:text-white tracking-tight">{title}</h3>
                <p className="text-[13px] sm:text-[14px] text-gray-500 dark:text-white/30 leading-[1.65]">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Tech Stack — cards on mobile, table on desktop */}
      <motion.section variants={fadeUp} className="space-y-5 sm:space-y-6">
        <h2 className="text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/20">
          How it works
        </h2>

        {/* Mobile: card layout */}
        <div className="sm:hidden space-y-2">
          {TECH_STACK.map((item, i) => (
            <div 
              key={item.layer}
              className={`px-4 py-3 rounded-xl border border-gray-100 dark:border-white/[0.04] ${i % 2 === 0 ? 'bg-gray-50/50 dark:bg-white/[0.01]' : ''}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-[13px] text-gray-900 dark:text-white/70">{item.layer}</span>
                <span className="font-mono text-[12px] text-gray-500 dark:text-white/35 text-right">{item.tech}</span>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-white/20 mt-0.5">{item.role}</p>
            </div>
          ))}
        </div>

        {/* Tablet+: table layout */}
        <div className="hidden sm:block rounded-2xl border border-gray-150 dark:border-white/[0.05] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/[0.04]">
                <th className="px-4 md:px-5 py-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-white/20">Layer</th>
                <th className="px-4 md:px-5 py-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-white/20">Tech</th>
                <th className="px-4 md:px-5 py-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-white/20 hidden md:table-cell">Role</th>
              </tr>
            </thead>
            <tbody className="text-[13px] sm:text-[14px]">
              {TECH_STACK.map((item, i) => (
                <tr 
                  key={item.layer} 
                  className={`border-b border-gray-50 dark:border-white/[0.02] ${i % 2 === 0 ? 'bg-gray-50/50 dark:bg-white/[0.01]' : ''}`}
                >
                  <td className="px-4 md:px-5 py-2.5 sm:py-3 font-medium text-gray-900 dark:text-white/70">{item.layer}</td>
                  <td className="px-4 md:px-5 py-2.5 sm:py-3 font-mono text-gray-600 dark:text-white/40">{item.tech}</td>
                  <td className="px-4 md:px-5 py-2.5 sm:py-3 text-gray-400 dark:text-white/20 hidden md:table-cell">{item.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* API Routes */}
      <motion.section variants={fadeUp} className="space-y-5 sm:space-y-6">
        <h2 className="text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/20">
          API Routes
        </h2>

        <div className="rounded-xl sm:rounded-2xl border border-gray-150 dark:border-white/[0.05] p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
          {API_ROUTES.map(({ method, path, desc }) => (
            <div key={path} className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 py-1 sm:py-1.5">
              <code className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                {method}
              </code>
              <code className="text-[12px] sm:text-[13px] font-mono text-gray-800 dark:text-white/60 shrink-0">
                {path}
              </code>
              <span className="text-[11px] sm:text-[12px] text-gray-400 dark:text-white/20 w-full sm:w-auto">
                <span className="hidden sm:inline">— </span>{desc}
              </span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* License */}
      <motion.section variants={fadeUp} className="space-y-3 sm:space-y-4">
        <h2 className="text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/20">
          License
        </h2>
        <div className="flex gap-3 sm:gap-4">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Shield size={15} className="text-emerald-600 dark:text-emerald-400 sm:w-[17px] sm:h-[17px]" />
          </div>
          <p className="text-[13px] sm:text-[14px] md:text-[15px] text-gray-600 dark:text-white/40 leading-[1.65]">
            MIT License. Do whatever you want with it — fork it, ship it, sell it, 
            learn from it. Attribution appreciated but not required. See{" "}
            <a 
              href="https://github.com/archduke1337/grovy/blob/main/LICENSE" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-900 dark:text-white/60 underline underline-offset-2 decoration-gray-300 dark:decoration-white/10 hover:decoration-gray-500 dark:hover:decoration-white/30 transition-colors"
            >
              LICENSE
            </a> for the full text.
          </p>
        </div>
      </motion.section>

      {/* Contributing */}
      <motion.section variants={fadeUp} className="space-y-4 sm:space-y-5">
        <h2 className="text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/20">
          Contributing
        </h2>
        <p className="text-[13px] sm:text-[14px] md:text-[15px] text-gray-500 dark:text-white/30 leading-[1.65] max-w-[600px]">
          If you find a bug or have an idea, open an issue. If you want to fix something 
          yourself, PRs are welcome — just keep the code clean and the UI minimal. 
          No contribution guidelines doc needed, just common sense.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <a 
            href="https://github.com/archduke1337/grovy/issues" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/[0.04] text-gray-700 dark:text-white/50 font-medium text-[13px] hover:bg-gray-200 dark:hover:bg-white/[0.07] transition-all border border-gray-150 dark:border-white/[0.04]"
          >
            <GitBranch size={14} />
            Issues
          </a>
          <a 
            href="https://github.com/archduke1337/grovy/pulls" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/[0.04] text-gray-700 dark:text-white/50 font-medium text-[13px] hover:bg-gray-200 dark:hover:bg-white/[0.07] transition-all border border-gray-150 dark:border-white/[0.04]"
          >
            <Terminal size={14} />
            Pull Requests
          </a>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.div variants={fadeUp} className="pt-4 border-t border-gray-100 dark:border-white/[0.04]">
        <p className="text-[11px] sm:text-[12px] text-gray-400 dark:text-white/15 leading-relaxed">
          Grovy is not affiliated with YouTube, JioSaavn, or Google. 
          It is an independent project that uses publicly available APIs. 
          All trademarks belong to their respective owners.
        </p>
      </motion.div>
    </motion.div>
  );
}

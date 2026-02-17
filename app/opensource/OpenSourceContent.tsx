"use client";

import { motion } from "framer-motion";
import { Github, GitBranch, Star, ExternalLink, Shield, Terminal, Layers, Radio, Disc3, Headphones, Eye, Volume2 } from "lucide-react";
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

export function OpenSourceContent() {
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-[860px] mx-auto px-5 sm:px-6 py-10 sm:py-16 pb-36 space-y-16 sm:space-y-24"
    >
      {/* Hero — tight, editorial */}
      <motion.header variants={fadeUp} className="space-y-6 sm:space-y-8">
        <div className="flex items-center gap-3">
          <Image 
            src="/icons/logo.png" 
            alt="Grovy" 
            width={40} 
            height={40} 
            className="w-9 h-9 sm:w-10 sm:h-10"
          />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-white/20">
            Open Source
          </span>
        </div>

        <h1 className="text-[2.5rem] sm:text-[3.5rem] md:text-[4.2rem] font-bold text-gray-900 dark:text-white tracking-[-0.04em] leading-[1.05]">
          Built in the open,<br />
          <span className="text-gray-300 dark:text-white/15">because music should be free.</span>
        </h1>

        <p className="text-[15px] sm:text-[17px] text-gray-500 dark:text-white/35 leading-[1.7] max-w-[640px]">
          Grovy started as a weekend project — a frustration with bloated music players 
          that track everything you listen to. No ads, no accounts, no telemetry. 
          Just a clean player that respects your time and your data. 
          The entire source code is on GitHub under the MIT license.
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <a 
            href="https://github.com/archduke1337/grovy" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-semibold text-[13px] hover:opacity-90 transition-all active:scale-[0.98]"
          >
            <Github size={16} />
            Source Code
            <ExternalLink size={12} className="opacity-40" />
          </a>
          <a 
            href="https://github.com/archduke1337/grovy/stargazers" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-transparent text-gray-600 dark:text-white/50 font-semibold text-[13px] hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all border border-gray-200 dark:border-white/[0.06]"
          >
            <Star size={14} />
            Star on GitHub
          </a>
        </div>
      </motion.header>

      {/* What Grovy does — concrete, not vague */}
      <motion.section variants={fadeUp} className="space-y-6">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/20">
          What it does
        </h2>

        <div className="space-y-4">
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
              body: "Playlists, favorites, play history, volume — everything is stored in localStorage. There is no backend database. Your data never leaves your device." 
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4 sm:gap-5">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={17} className="text-gray-500 dark:text-white/30" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-[15px] text-gray-900 dark:text-white tracking-tight">{title}</h3>
                <p className="text-[14px] text-gray-500 dark:text-white/30 leading-[1.65]">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Architecture — shows we know what we're talking about */}
      <motion.section variants={fadeUp} className="space-y-6">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/20">
          How it works
        </h2>

        <div className="rounded-2xl border border-gray-150 dark:border-white/[0.05] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/[0.04]">
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-white/20">Layer</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-white/20">Tech</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-white/20 hidden sm:table-cell">Role</th>
              </tr>
            </thead>
            <tbody className="text-[13px] sm:text-[14px]">
              {[
                ["Framework", "Next.js 16 + Turbopack", "App router, API routes, SSR"],
                ["Language", "TypeScript", "Type safety across client and server"],
                ["Styling", "Tailwind CSS", "Utility classes, dark mode, responsive"],
                ["Animation", "Framer Motion", "Layout transitions, gestures, spring physics"],
                ["Streaming", "HLS.js + YT IFrame", "Adaptive bitrate, dual-source playback"],
                ["Validation", "Zod", "Runtime schema validation on API responses"],
                ["Color", "ColorThief", "Dominant palette extraction from artwork"],
                ["Deployment", "Vercel", "Edge functions, CDN, analytics"],
              ].map(([layer, tech, role], i) => (
                <tr 
                  key={layer} 
                  className={`border-b border-gray-50 dark:border-white/[0.02] ${i % 2 === 0 ? 'bg-gray-50/50 dark:bg-white/[0.01]' : ''}`}
                >
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-white/70">{layer}</td>
                  <td className="px-5 py-3 font-mono text-gray-600 dark:text-white/40">{tech}</td>
                  <td className="px-5 py-3 text-gray-400 dark:text-white/20 hidden sm:table-cell">{role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* API structure */}
      <motion.section variants={fadeUp} className="space-y-6">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/20">
          API Routes
        </h2>

        <div className="rounded-2xl border border-gray-150 dark:border-white/[0.05] p-5 sm:p-6 space-y-3">
          <div className="grid gap-2">
            {[
              { method: "GET", path: "/api/songs", desc: "Search + trending + charts" },
              { method: "GET", path: "/api/stream", desc: "Audio stream proxy with codec selection" },
              { method: "GET", path: "/api/search", desc: "Multi-source search (songs, artists, albums)" },
              { method: "GET", path: "/api/lyrics", desc: "Lyrics lookup by title + artist" },
              { method: "GET", path: "/api/songs/radio", desc: "Auto-generated radio queue" },
              { method: "GET", path: "/api/songs/related", desc: "Related tracks for current song" },
              { method: "GET", path: "/api/artist/info", desc: "Artist metadata and top songs" },
            ].map(({ method, path, desc }) => (
              <div key={path} className="flex items-start gap-3 py-1.5">
                <code className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  {method}
                </code>
                <code className="text-[13px] font-mono text-gray-800 dark:text-white/60 shrink-0">
                  {path}
                </code>
                <span className="text-[12px] text-gray-400 dark:text-white/20 hidden sm:inline">
                  — {desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* License */}
      <motion.section variants={fadeUp} className="space-y-4">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/20">
          License
        </h2>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Shield size={17} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-1">
            <p className="text-[14px] sm:text-[15px] text-gray-600 dark:text-white/40 leading-[1.65]">
              MIT License. Do whatever you want with it — fork it, ship it, sell it, 
              learn from it. Attribution appreciated but not required. See{" "}
              <a 
                href="https://github.com/archduke1337/grovy/blob/master/LICENSE" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-900 dark:text-white/60 underline underline-offset-2 decoration-gray-300 dark:decoration-white/10 hover:decoration-gray-500 dark:hover:decoration-white/30 transition-colors"
              >
                LICENSE
              </a> for the full text.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Contribute — minimal, not salesy */}
      <motion.section variants={fadeUp} className="space-y-5">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/20">
          Contributing
        </h2>
        <p className="text-[14px] sm:text-[15px] text-gray-500 dark:text-white/30 leading-[1.65] max-w-[600px]">
          If you find a bug or have an idea, open an issue. If you want to fix something 
          yourself, PRs are welcome — just keep the code clean and the UI minimal. 
          No contribution guidelines doc needed, just common sense.
        </p>
        <div className="flex flex-wrap gap-3">
          <a 
            href="https://github.com/archduke1337/grovy/issues" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/[0.04] text-gray-700 dark:text-white/50 font-medium text-[13px] hover:bg-gray-200 dark:hover:bg-white/[0.07] transition-all border border-gray-150 dark:border-white/[0.04]"
          >
            <GitBranch size={14} />
            Issues
          </a>
          <a 
            href="https://github.com/archduke1337/grovy/pulls" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/[0.04] text-gray-700 dark:text-white/50 font-medium text-[13px] hover:bg-gray-200 dark:hover:bg-white/[0.07] transition-all border border-gray-150 dark:border-white/[0.04]"
          >
            <Terminal size={14} />
            Pull Requests
          </a>
        </div>
      </motion.section>

      {/* Footer note */}
      <motion.div variants={fadeUp} className="pt-4 border-t border-gray-100 dark:border-white/[0.04]">
        <p className="text-[12px] text-gray-400 dark:text-white/15 leading-relaxed">
          Grovy is not affiliated with YouTube, JioSaavn, or Google. 
          It is an independent project that uses publicly available APIs. 
          All trademarks belong to their respective owners.
        </p>
      </motion.div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Github, Heart, Code, GitBranch, Star, ExternalLink, FileCode, Shield, Users, Sparkles, Zap } from "lucide-react";
import Image from "next/image";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.08, delayChildren: 0.15 } 
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { 
    opacity: 1, y: 0, 
    transition: { type: "spring", stiffness: 200, damping: 28 } 
  }
};

const TECH_STACK = [
  { name: "Next.js 16", desc: "React framework with Turbopack", icon: "⚡" },
  { name: "TypeScript", desc: "Type-safe development", icon: "🔷" },
  { name: "Tailwind CSS", desc: "Utility-first styling", icon: "🎨" },
  { name: "Framer Motion", desc: "Fluid animations", icon: "✨" },
  { name: "Web Audio API", desc: "Advanced audio processing", icon: "🔊" },
  { name: "HLS.js", desc: "Adaptive streaming", icon: "📡" },
  { name: "ColorThief", desc: "Dynamic palette extraction", icon: "🎆" },
  { name: "Zod", desc: "Schema validation", icon: "🛡️" },
];

const FEATURES = [
  { 
    icon: Code, 
    title: "100% Open Source", 
    desc: "MIT licensed — fork, modify, and use it however you want. No strings attached.",
    gradient: "from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5",
  },
  { 
    icon: Shield, 
    title: "Privacy First", 
    desc: "All data stays in your browser. Zero tracking, zero analytics, zero data collection on your music habits.",
    gradient: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5",
  },
  { 
    icon: Users, 
    title: "Community Driven", 
    desc: "Built by the community, for the community. Every contribution — code, docs, or ideas — is welcome.",
    gradient: "from-purple-500/10 to-pink-500/10 dark:from-purple-500/5 dark:to-pink-500/5",
  },
  { 
    icon: Zap, 
    title: "Modern & Fast", 
    desc: "Built with Next.js 16 + Turbopack for blazing-fast development. PWA-ready with offline support.",
    gradient: "from-orange-500/10 to-red-500/10 dark:from-orange-500/5 dark:to-red-500/5",
  },
  { 
    icon: Sparkles, 
    title: "Dynamic Theming", 
    desc: "Colors automatically sync to album art using palette extraction. Your player, your vibe.",
    gradient: "from-yellow-500/10 to-amber-500/10 dark:from-yellow-500/5 dark:to-amber-500/5",
  },
  { 
    icon: FileCode, 
    title: "Clean Architecture", 
    desc: "Type-safe context providers, Zod-validated API responses, and component-driven design.",
    gradient: "from-cyan-500/10 to-sky-500/10 dark:from-cyan-500/5 dark:to-sky-500/5",
  },
];

export function OpenSourceContent() {
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 pb-32 space-y-14 sm:space-y-24"
    >
      {/* Hero */}
      <motion.header variants={fadeUp} className="text-center space-y-5 sm:space-y-8 pt-4 sm:pt-12">
        <div className="flex justify-center">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="relative"
          >
            <div className="absolute inset-0 blur-[30px] bg-blue-500/20 dark:bg-blue-500/10 rounded-full scale-150" />
            <Image 
              src="/icons/logo.png" 
              alt="Grovy" 
              width={96} 
              height={96} 
              className="relative w-20 h-20 sm:w-24 sm:h-24 drop-shadow-lg"
            />
          </motion.div>
        </div>
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-gray-900 dark:text-white tracking-[-0.04em] leading-[0.95]">
            Open Source
            <br />
            <span className="text-gray-300 dark:text-white/15">at Heart</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-500 dark:text-white/30 font-medium max-w-2xl mx-auto leading-relaxed">
            Grovy is free, open-source software built with care. 
            Every line of code is transparent, auditable, and community-driven.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 sm:pt-4">
          <a 
            href="https://github.com/archduke1337/grovy" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-7 sm:px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black font-semibold text-[13px] sm:text-[14px] hover:opacity-90 transition-all shadow-lg active:scale-[0.98] w-full sm:w-auto justify-center"
          >
            <Github size={18} />
            View on GitHub
            <ExternalLink size={13} className="opacity-40" />
          </a>
          <a 
            href="https://github.com/archduke1337/grovy/stargazers" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-7 sm:px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-white/60 font-semibold text-[13px] sm:text-[14px] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all border border-gray-200 dark:border-white/[0.06] w-full sm:w-auto justify-center"
          >
            <Star size={16} className="text-yellow-500" />
            Star the Repo
          </a>
        </div>
      </motion.header>

      {/* Features */}
      <motion.section variants={fadeUp} className="space-y-6 sm:space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-[-0.02em]">
            Why Open Source?
          </h2>
          <p className="text-sm text-gray-400 dark:text-white/20 max-w-md mx-auto">
            Transparency, privacy, and community — these are the pillars of Grovy.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, gradient }) => (
            <motion.div 
              key={title}
              variants={fadeUp}
              whileHover={{ y: -3, scale: 1.01 }}
              className={`relative p-5 sm:p-6 rounded-2xl sm:rounded-[1.5rem] bg-gradient-to-br ${gradient} border border-gray-100 dark:border-white/[0.04] space-y-3 group transition-all hover:border-gray-200 dark:hover:border-white/[0.08] hover:shadow-lg`}
            >
              <div className="w-11 h-11 rounded-xl bg-white dark:bg-white/[0.06] shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                <Icon size={20} className="text-gray-700 dark:text-white/50" />
              </div>
              <h3 className="font-bold text-[15px] sm:text-[16px] text-gray-900 dark:text-white tracking-tight">{title}</h3>
              <p className="text-[13px] sm:text-[14px] text-gray-500 dark:text-white/30 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Tech Stack */}
      <motion.section variants={fadeUp} className="space-y-6 sm:space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-[-0.02em]">
            Built With
          </h2>
          <p className="text-sm text-gray-400 dark:text-white/20 max-w-md mx-auto">
            Modern technologies for a premium music experience.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {TECH_STACK.map((tech) => (
            <motion.div 
              key={tech.name}
              variants={fadeUp}
              whileHover={{ y: -2 }}
              className="relative p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-all group"
            >
              <div className="space-y-2">
                <span className="text-xl sm:text-2xl block">{tech.icon}</span>
                <h3 className="font-bold text-[13px] sm:text-[14px] text-gray-900 dark:text-white leading-tight">{tech.name}</h3>
                <p className="text-[11px] sm:text-[12px] text-gray-500 dark:text-white/25 font-medium leading-snug">{tech.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* License Badge */}
      <motion.section variants={fadeUp} className="text-center space-y-5 sm:space-y-6">
        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[12px] sm:text-[13px] font-bold border border-emerald-100 dark:border-emerald-500/15 shadow-sm">
          <Shield size={15} />
          MIT License
        </div>
        <p className="text-[14px] sm:text-[15px] text-gray-500 dark:text-white/30 max-w-xl mx-auto leading-relaxed">
          Grovy is released under the MIT License. You are free to use, modify, distribute, 
          and sell copies of the software. See the{" "}
          <a href="https://github.com/archduke1337/grovy/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 underline underline-offset-2 transition-colors">
            LICENSE
          </a>{" "}
          file for full details.
        </p>
      </motion.section>

      {/* Contribute CTA */}
      <motion.section variants={fadeUp}>
        <div className="relative p-8 sm:p-10 md:p-14 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden text-center space-y-5 sm:space-y-7">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-white dark:from-white/[0.03] dark:via-white/[0.01] dark:to-transparent" />
          <div className="absolute inset-0 border border-gray-200/60 dark:border-white/[0.04] rounded-[1.5rem] sm:rounded-[2rem]" />
          
          <div className="relative z-10 space-y-5 sm:space-y-7">
            <div className="space-y-2 sm:space-y-3">
              <div className="inline-flex items-center gap-2 text-blue-500 dark:text-blue-400 mb-2">
                <Heart size={16} className="fill-current" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Get Involved</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-[-0.02em]">
                Want to Contribute?
              </h2>
              <p className="text-[13px] sm:text-[15px] text-gray-500 dark:text-white/30 max-w-lg mx-auto leading-relaxed">
                Whether it&apos;s fixing bugs, improving documentation, or adding new features — 
                every contribution makes Grovy better for everyone.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a 
                href="https://github.com/archduke1337/grovy/issues" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-semibold text-[13px] hover:opacity-90 transition-all w-full sm:w-auto justify-center active:scale-[0.98]"
              >
                <GitBranch size={16} />
                View Issues
              </a>
              <a 
                href="https://github.com/archduke1337/grovy/pulls" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-white/60 font-semibold text-[13px] hover:bg-gray-200 dark:hover:bg-white/[0.08] border border-gray-200 dark:border-white/[0.06] transition-all w-full sm:w-auto justify-center"
              >
                Pull Requests
              </a>
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}

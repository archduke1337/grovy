"use client";

import { motion } from "framer-motion";
import { Github, Heart, Code, GitBranch, Star, ExternalLink, FileCode, Shield, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 28 } }
};

const TECH_STACK = [
  { name: "Next.js 16", desc: "React framework with Turbopack", color: "from-black to-gray-800" },
  { name: "TypeScript", desc: "Type-safe development", color: "from-blue-600 to-blue-500" },
  { name: "Tailwind CSS", desc: "Utility-first styling", color: "from-cyan-500 to-teal-500" },
  { name: "Framer Motion", desc: "Fluid animations", color: "from-purple-500 to-pink-500" },
  { name: "Web Audio API", desc: "Advanced audio processing", color: "from-orange-500 to-red-500" },
  { name: "HLS.js", desc: "Adaptive streaming", color: "from-emerald-500 to-green-500" },
];

const FEATURES = [
  { icon: Code, title: "100% Open Source", desc: "MIT licensed — fork, modify, and use it however you want." },
  { icon: Shield, title: "Privacy First", desc: "All data stays in your browser. Zero tracking, zero analytics on your music." },
  { icon: Users, title: "Community Driven", desc: "Built by the community, for the community. Contributions welcome." },
  { icon: FileCode, title: "Modern Stack", desc: "Built with Next.js 16, TypeScript, and cutting-edge web technologies." },
];

export default function OpenSourcePage() {
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 pb-32 space-y-12 sm:space-y-20"
    >
      {/* Hero */}
      <motion.header variants={fadeUp} className="text-center space-y-4 sm:space-y-6 pt-4 sm:pt-8">
        <div className="flex justify-center">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Image 
              src="/icons/logo.png" 
              alt="Grovy" 
              width={80} 
              height={80} 
              className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg"
            />
          </motion.div>
        </div>
        <div className="space-y-2 sm:space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-[-0.03em]">
            Open Source at Heart
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-500 dark:text-white/30 font-medium max-w-2xl mx-auto leading-relaxed">
            Grovy is free, open-source software built with love. 
            Every line of code is transparent, auditable, and community-driven.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 sm:pt-4">
          <a 
            href="https://github.com/groovymusic/grovy" 
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black font-semibold text-[13px] sm:text-[14px] hover:opacity-90 transition-all shadow-lg active:scale-95 w-full sm:w-auto justify-center"
          >
            <Github size={18} />
            View on GitHub
            <ExternalLink size={14} className="opacity-50" />
          </a>
          <a 
            href="https://github.com/groovymusic/grovy/stargazers" 
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-white/60 font-semibold text-[13px] sm:text-[14px] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all border border-gray-200 dark:border-white/[0.06] w-full sm:w-auto justify-center"
          >
            <Star size={16} className="text-yellow-500" />
            Star the Repo
          </a>
        </div>
      </motion.header>

      {/* Features */}
      <motion.section variants={fadeUp} className="space-y-6 sm:space-y-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight text-center">
          Why Open Source?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div 
              key={title}
              className="p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.04] space-y-2 sm:space-y-3 hover:border-gray-200 dark:hover:border-white/[0.08] transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center">
                <Icon size={20} className="text-gray-600 dark:text-white/40" />
              </div>
              <h3 className="font-bold text-[15px] sm:text-[16px] text-gray-900 dark:text-white">{title}</h3>
              <p className="text-[13px] sm:text-[14px] text-gray-500 dark:text-white/30 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Tech Stack */}
      <motion.section variants={fadeUp} className="space-y-6 sm:space-y-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight text-center">
          Built With
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {TECH_STACK.map((tech) => (
            <div 
              key={tech.name}
              className="relative p-4 sm:p-5 rounded-xl sm:rounded-2xl overflow-hidden group hover:scale-[1.02] transition-transform"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${tech.color} opacity-[0.06] dark:opacity-[0.08] group-hover:opacity-[0.1] dark:group-hover:opacity-[0.15] transition-opacity`} />
              <div className="absolute inset-0 border border-gray-200/50 dark:border-white/[0.05] rounded-xl sm:rounded-2xl" />
              <div className="relative z-10 space-y-1">
                <h3 className="font-bold text-[13px] sm:text-[15px] text-gray-900 dark:text-white">{tech.name}</h3>
                <p className="text-[11px] sm:text-[12px] text-gray-500 dark:text-white/25 font-medium">{tech.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* License */}
      <motion.section variants={fadeUp} className="text-center space-y-4 sm:space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[12px] sm:text-[13px] font-semibold border border-emerald-100 dark:border-emerald-500/20">
          <Shield size={14} />
          MIT License
        </div>
        <p className="text-[14px] sm:text-[15px] text-gray-500 dark:text-white/30 max-w-xl mx-auto leading-relaxed">
          Grovy is released under the MIT License. You are free to use, modify, distribute, 
          and sell copies of the software. See the{" "}
          <a href="https://github.com/groovymusic/grovy/blob/main/LICENSE" target="_blank" className="text-blue-500 hover:text-blue-600 underline underline-offset-2 transition-colors">
            LICENSE
          </a>{" "}
          file for full details.
        </p>
      </motion.section>

      {/* Contribute CTA */}
      <motion.section variants={fadeUp}>
        <div className="relative p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl overflow-hidden text-center space-y-4 sm:space-y-6">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/[0.03] dark:to-transparent" />
          <div className="absolute inset-0 border border-gray-200/50 dark:border-white/[0.04] rounded-2xl sm:rounded-3xl" />
          <div className="relative z-10 space-y-4 sm:space-y-6">
            <div className="space-y-2 sm:space-y-3">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                Want to Contribute?
              </h2>
              <p className="text-[13px] sm:text-[15px] text-gray-500 dark:text-white/30 max-w-lg mx-auto leading-relaxed">
                We welcome contributions from everyone. Whether it's fixing bugs, 
                improving documentation, or adding new features — every contribution counts.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a 
                href="https://github.com/groovymusic/grovy/issues" 
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-semibold text-[13px] hover:opacity-90 transition-all w-full sm:w-auto justify-center"
              >
                <GitBranch size={16} />
                View Issues
              </a>
              <a 
                href="https://github.com/groovymusic/grovy/pulls" 
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-white/60 font-semibold text-[13px] hover:bg-gray-200 dark:hover:bg-white/[0.08] border border-gray-200 dark:border-white/[0.06] transition-all w-full sm:w-auto justify-center"
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

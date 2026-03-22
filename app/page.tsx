'use client';

import React from 'react';
import Link from 'next/link';
import { DiscoveryGrid } from '@/features/discovery/components/DiscoveryGrid';
import { Sparkles, Zap, Flame } from 'lucide-react';
import { motion } from 'motion/react';

const MOCK_TRENDING = [
  { id: '1', title: 'Greatest RPGs of All Time', views: 1200, remixes: 15 },
  { id: '4', title: 'MCU Movie Ranking', views: 5600, remixes: 120 },
  { id: '3', title: 'Programming Languages by Speed', views: 3400, remixes: 8 },
  { id: '7', title: 'Top 10 Pizza Toppings', views: 890, remixes: 45 },
];

const MOCK_RECENT = [
  { id: '2', title: 'Best Pizza Toppings (Objective)', views: 850, remixes: 32 },
  { id: '5', title: 'Fast Food Burgers', views: 900, remixes: 45 },
  { id: '6', title: 'Desktop Operating Systems', views: 1100, remixes: 5 },
  { id: '8', title: 'Coffee Brew Methods', views: 420, remixes: 12 },
];

export default function HomePage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <main className="min-h-screen bg-bg-main">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 border-b border-border-main">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-24 -right-24 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none"
        />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-7xl mx-auto px-4 text-center relative z-10"
        >
          <motion.div
            variants={item}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-accent/20 text-accent text-xs font-black uppercase tracking-[0.2em] mb-8"
          >
            <Sparkles size={14} />
            The Ultimate Tier List Platform
          </motion.div>

          <motion.h1
            variants={item}
            className="text-6xl md:text-8xl font-black text-text-main tracking-tighter uppercase italic leading-[0.8] mb-8"
          >
            Rank <span className="text-accent drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">Everything</span><br />
            Share <span className="underline decoration-accent/30 underline-offset-8">Anything</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="max-w-2xl mx-auto text-xl text-text-muted font-medium mb-12"
          >
            Join the community of creators ranking the world&apos;s best (and worst) content.
            Create templates or remix existing lists in seconds.
          </motion.p>

          <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/create"
              className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-accent-foreground px-8 py-4 rounded-item font-black text-lg uppercase tracking-widest shadow-panel transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500 skew-x-12"
              />
              <Zap size={20} className="fill-current" />
              Create A List
            </Link>
            <Link
              href="#trending"
              className="w-full sm:w-auto bg-surface hover:bg-surface-hover text-text-main border border-border-main px-8 py-4 rounded-item font-black text-lg uppercase tracking-widest transition-all"
            >
              Explore Trends
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Discovery Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div id="trending" className="scroll-mt-24">
          <DiscoveryGrid
            title={
              <span className="flex items-center gap-3">
                <Flame className="text-danger" fill="currentColor" />
                Trending Now
              </span>
            }
            lists={MOCK_TRENDING}
          />
        </div>

        <DiscoveryGrid
          title="Recently Added"
          lists={MOCK_RECENT}
        />
      </div>
    </main>
  );
}

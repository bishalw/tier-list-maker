'use client';

import React from 'react';
import { ProfileTierListCard } from '@/features/profile/components/ProfileTierListCard';
import { motion } from 'motion/react';

interface DiscoveryGridProps {
  title: React.ReactNode;
  lists: Array<{
    id: string;
    title: string;
    views: number;
    remixes: number;
    thumbnailUrl?: string;
  }>;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function DiscoveryGrid({ title, lists }: DiscoveryGridProps) {
  return (
    <section className="py-12">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="flex items-center justify-between mb-8"
      >
        <h2 className="text-3xl font-black text-text-main uppercase italic tracking-tight">
          {title}
        </h2>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {lists.map((list) => (
          <motion.div key={list.id} variants={item} className="h-full">
            <ProfileTierListCard
              title={list.title}
              views={list.views}
              remixes={list.remixes}
              thumbnailUrl={list.thumbnailUrl}
              onClick={() => {
                window.location.href = `/create?list=${list.id}`;
              }}
            />
          </motion.div>
        ))}
      </motion.div>

      {lists.length === 0 && (
        <div className="bg-surface border border-border-main rounded-panel p-12 text-center">
          <p className="text-text-muted font-bold uppercase tracking-widest">
            No lists found in this category yet.
          </p>
        </div>
      )}
    </section>
  );
}

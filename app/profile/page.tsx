'use client';

import React from 'react';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { ProfileTierListCard } from '@/features/profile/components/ProfileTierListCard';
import { useRouter } from 'next/navigation';

// Mock data for initial UI implementation
const MOCK_PROFILE = {
  username: 'RankingKing',
  avatarUrl: undefined,
  stats: {
    totalLists: 12,
    totalRemixes: 45,
    totalViews: 12400,
  }
};

const MOCK_LISTS = [
  { id: '1', title: 'Greatest RPGs of All Time', views: 1200, remixes: 15 },
  { id: '2', title: 'Best Pizza Toppings (Objective)', views: 850, remixes: 32 },
  { id: '3', title: 'Programming Languages by Speed', views: 3400, remixes: 8 },
  { id: '4', title: 'MCU Movie Ranking', views: 5600, remixes: 120 },
  { id: '5', title: 'Fast Food Burgers', views: 900, remixes: 45 },
  { id: '6', title: 'Desktop Operating Systems', views: 1100, remixes: 5 },
];

export default function ProfilePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-bg-main p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <ProfileHeader
          username={MOCK_PROFILE.username}
          avatarUrl={MOCK_PROFILE.avatarUrl}
          stats={MOCK_PROFILE.stats}
        />

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-text-main uppercase italic tracking-tight">
            My Tier Lists
          </h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-surface border border-border-main rounded-item text-xs font-bold uppercase text-text-main hover:bg-surface-hover transition-colors">
              Recently Added
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {MOCK_LISTS.map((list) => (
            <ProfileTierListCard
              key={list.id}
              title={list.title}
              views={list.views}
              remixes={list.remixes}
              onClick={() => router.push(`/t/${list.id}`)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

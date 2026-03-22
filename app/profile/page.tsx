'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { ProfileTierListCard } from '@/features/profile/components/ProfileTierListCard';
import { useProfileScreen } from '@/features/profile/hooks/useProfileScreen';

export default function ProfilePage() {
  const router = useRouter();
  const { user, displayName, isLoading, tierLists, stats, signOut } = useProfileScreen();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login?next=/profile');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <main className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-main p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <ProfileHeader
          displayName={displayName}
          avatarUrl={user.user_metadata?.avatar_url}
          stats={stats}
          onSignOut={signOut}
        />

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-text-main uppercase italic tracking-tight">
            My Tier Lists
          </h2>
        </div>

        {tierLists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
              <Plus size={32} className="text-accent" />
            </div>
            <h3 className="text-xl font-bold text-text-main mb-2">
              No tier lists yet
            </h3>
            <p className="text-text-muted mb-6 max-w-sm">
              Create your first tier list and share your rankings with the world.
            </p>
            <Link
              href="/create"
              className="px-6 py-3 bg-accent hover:bg-accent-hover text-accent-foreground rounded-item font-black text-sm uppercase tracking-widest transition-all hover:-translate-y-0.5 shadow-panel"
            >
              Create Your First Tier List
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tierLists.map((tierList) => (
              <ProfileTierListCard
                key={tierList.id}
                title={tierList.title}
                remixes={tierList.remixCount}
                onClick={() => router.push(`/create?list=${tierList.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

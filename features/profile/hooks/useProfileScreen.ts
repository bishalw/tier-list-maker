'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getTierListsByOwner } from '@/features/tier-list/queries';
import type { TierListRecord } from '@/features/tier-list/types';

export function useProfileScreen() {
  const { user, isLoading: isAuthLoading, signOut } = useAuth();
  const [tierLists, setTierLists] = useState<TierListRecord[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(true);

  const displayName =
    user?.user_metadata?.full_name ??
    user?.email?.split('@')[0] ??
    'User';

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      setIsLoadingLists(false);
      return;
    }

    getTierListsByOwner(user.id)
      .then(setTierLists)
      .catch((err) => console.error('Failed to load tier lists:', err))
      .finally(() => setIsLoadingLists(false));
  }, [user, isAuthLoading]);

  const stats = {
    totalLists: tierLists.length,
    totalRemixes: tierLists.reduce((sum, tl) => sum + tl.remixCount, 0),
  };

  return {
    user,
    displayName,
    isLoading: isAuthLoading || isLoadingLists,
    tierLists,
    stats,
    signOut,
  };
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { deleteTierListAction, renameTierListAction } from '@/features/tier-list/actions';
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

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = useCallback((id: string) => {
    setDeletingId(id);
  }, []);

  const cancelDelete = useCallback(() => {
    setDeletingId(null);
  }, []);

  const deleteTierList = useCallback(async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteTierListAction({ id: deletingId });
      setTierLists((prev) => prev.filter((tl) => tl.id !== deletingId));
      setDeletingId(null);
    } catch (err) {
      console.error('Failed to delete tier list:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [deletingId]);

  const renameTierList = useCallback(async (id: string, newTitle: string) => {
    try {
      await renameTierListAction({ id, title: newTitle });
      setTierLists((prev) =>
        prev.map((tl) => (tl.id === id ? { ...tl, title: newTitle } : tl))
      );
    } catch (err) {
      console.error('Failed to rename tier list:', err);
    }
  }, []);

  const stats = {
    totalLists: tierLists.length,
    totalRemixes: tierLists.reduce((sum, tl) => sum + tl.remixCount, 0),
    totalViews: tierLists.reduce((sum, tl) => sum + tl.viewCount, 0),
  };

  return {
    user,
    displayName,
    isLoading: isAuthLoading || isLoadingLists,
    tierLists,
    stats,
    signOut,
    renameTierList,
    deletingId,
    isDeleting,
    confirmDelete,
    cancelDelete,
    deleteTierList,
  };
}

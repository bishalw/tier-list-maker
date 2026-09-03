'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { deleteTierListAction, renameTierListAction } from '@/features/tier-list/actions';
import { getTierListsByOwner } from '@/features/tier-list/queries';
import { ACTION_FAILURE_MESSAGES, isActionFailure } from '@/features/tier-list/results';
import type { TierListRecord } from '@/features/tier-list/types';

export function useProfileScreen() {
  const { user, isLoading: isAuthLoading, signOut } = useAuth();
  const [tierLists, setTierLists] = useState<TierListRecord[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    let canceled = false;

    getTierListsByOwner(user.id)
      .then((lists) => {
        if (!canceled) {
          setTierLists(lists);
        }
      })
      .catch((err) => {
        console.error('Failed to load tier lists:', err);
        if (!canceled) {
          setErrorMessage('Could not load your tier lists. Please refresh to try again.');
        }
      })
      .finally(() => {
        if (!canceled) {
          setIsLoadingLists(false);
        }
      });

    return () => {
      canceled = true;
    };
  }, [user, isAuthLoading]);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = useCallback((id: string) => {
    setDeletingId(id);
  }, []);

  const cancelDelete = useCallback(() => {
    setDeletingId(null);
  }, []);

  // Local state is only updated once the server confirms the write actually
  // matched a row — a delete or rename that touched nothing used to disappear
  // from the list anyway.
  const deleteTierList = useCallback(async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const result = await deleteTierListAction({ id: deletingId });

      if (isActionFailure(result)) {
        // A list that is already gone is the outcome the user wanted.
        if (result.code !== 'not-found') {
          setErrorMessage(result.message);
          return;
        }
      }

      setTierLists((prev) => prev.filter((tl) => tl.id !== deletingId));
      setDeletingId(null);
    } catch (err) {
      console.error('Failed to delete tier list:', err);
      setErrorMessage(ACTION_FAILURE_MESSAGES.unavailable);
    } finally {
      setIsDeleting(false);
    }
  }, [deletingId]);

  const renameTierList = useCallback(async (id: string, newTitle: string) => {
    setErrorMessage(null);

    try {
      const result = await renameTierListAction({ id, title: newTitle });

      if (isActionFailure(result)) {
        setErrorMessage(result.message);
        return;
      }

      setTierLists((prev) =>
        prev.map((tl) =>
          tl.id === id ? { ...tl, title: newTitle, updatedAt: result.data.updatedAt } : tl
        )
      );
    } catch (err) {
      console.error('Failed to rename tier list:', err);
      setErrorMessage(ACTION_FAILURE_MESSAGES.unavailable);
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
    errorMessage,
    clearErrorMessage: () => setErrorMessage(null),
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

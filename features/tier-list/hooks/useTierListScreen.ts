'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTierStore } from '../../../store/useTierStore';
import { ensureAnonymousSession, subscribeToAuthState } from '../../../lib/supabase/auth';
import { mapSearchParamsToRouteState } from '../mappers';
import { getCommunityConsensus, getRemixById, getTierListById } from '../queries';
import { deriveIsReadOnly } from '../services/ownership';
import type { Item } from '../../../types';

export function useTierListScreen() {
  const searchParams = useSearchParams();
  const routeState = useMemo(() => mapSearchParamsToRouteState(searchParams), [searchParams]);

  const [isMounted, setIsMounted] = useState(false);
  const [isLoadingShared, setIsLoadingShared] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [sharedListOwner, setSharedListOwner] = useState<string | null>(null);
  const [remixCount, setRemixCount] = useState(0);
  const [viewMode, setViewMode] = useState<'creator' | 'community' | 'compare'>('creator');
  const [communityItems, setCommunityItems] = useState<Item[] | null>(null);
  const [compareItems, setCompareItems] = useState<Item[] | null>(null);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const tiers = useTierStore((state) => state.tiers);
  const items = useTierStore((state) => state.items);
  const boardBackground = useTierStore((state) => state.boardBackground);
  const theme = useTierStore((state) => state.theme);
  const reorderTiers = useTierStore((state) => state.reorderTiers);
  const moveItem = useTierStore((state) => state.moveItem);
  const addTier = useTierStore((state) => state.addTier);
  const hydrateBoardState = useTierStore((state) => state.hydrateBoardState);
  const returnItemsToPool = useTierStore((state) => state.returnItemsToPool);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let isActive = true;

    ensureAnonymousSession()
      .then((session) => {
        if (isActive) {
          setCurrentUserId(session?.user.id ?? null);
        }
      })
      .catch((error) => {
        console.error('Error initializing Supabase auth:', error);
      });

    const unsubscribe = subscribeToAuthState((session) => {
      if (isActive) {
        setCurrentUserId(session?.user.id ?? null);
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setCommunityItems(null);
    setCompareItems(null);
    setViewMode(routeState.compareId ? 'compare' : 'creator');
  }, [routeState.compareId, routeState.targetListId]);

  useEffect(() => {
    async function loadSharedList() {
      if (!routeState.targetListId) {
        setIsReadOnly(false);
        setSharedListOwner(null);
        setRemixCount(0);
        setViewMode('creator');
        return;
      }

      setIsLoadingShared(true);
      try {
        const tierList = await getTierListById(routeState.targetListId);

        if (!tierList) {
          setSharedListOwner(null);
          setRemixCount(0);
          setIsReadOnly(false);
          return;
        }

        hydrateBoardState(tierList.boardState);
        setRemixCount(tierList.remixCount);
        setSharedListOwner(tierList.ownerId);

        if (routeState.remixingId) {
          setIsReadOnly(false);
          returnItemsToPool();
        } else {
          setIsReadOnly(
            deriveIsReadOnly({
              targetListId: routeState.targetListId,
              remixingId: routeState.remixingId,
              ownerId: tierList.ownerId,
              currentUserId,
            })
          );
          setViewMode(routeState.compareId ? 'compare' : 'creator');
        }
      } catch (error) {
        console.error('Error fetching shared list:', error);
      } finally {
        setIsLoadingShared(false);
      }
    }

    if (isMounted) {
      loadSharedList();
    }
  }, [
    currentUserId,
    hydrateBoardState,
    isMounted,
    returnItemsToPool,
    routeState.compareId,
    routeState.remixingId,
    routeState.targetListId,
  ]);

  useEffect(() => {
    setIsReadOnly(
      deriveIsReadOnly({
        targetListId: routeState.targetListId,
        remixingId: routeState.remixingId,
        ownerId: sharedListOwner,
        currentUserId,
      })
    );
  }, [currentUserId, routeState.remixingId, routeState.targetListId, sharedListOwner]);

  useEffect(() => {
    async function loadCompareRemix() {
      if (viewMode !== 'compare' || !routeState.targetListId || !routeState.compareId) return;

      try {
        const remix = await getRemixById(routeState.targetListId, routeState.compareId);
        setCompareItems(remix?.items ?? null);
      } catch (error) {
        console.error('Error fetching compare list:', error);
      }
    }

    if (isMounted) {
      loadCompareRemix();
    }
  }, [isMounted, routeState.compareId, routeState.targetListId, viewMode]);

  useEffect(() => {
    async function loadCommunityConsensus() {
      if (viewMode !== 'community' || communityItems !== null || !routeState.targetListId) return;

      setIsLoadingCommunity(true);
      try {
        const consensus = await getCommunityConsensus({
          tierListId: routeState.targetListId,
          items,
          tiers,
        });
        setCommunityItems(consensus);
      } catch (error) {
        console.error('Error fetching community consensus:', error);
      } finally {
        setIsLoadingCommunity(false);
      }
    }

    if (isMounted) {
      loadCommunityConsensus();
    }
  }, [communityItems, isMounted, items, routeState.targetListId, tiers, viewMode]);

  useEffect(() => {
    if (isMounted) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [isMounted, theme]);

  const effectiveItems =
    viewMode === 'community' && communityItems
      ? communityItems
      : viewMode === 'compare' && compareItems
        ? compareItems
        : items;
  const effectiveIsReadOnly = isReadOnly || viewMode === 'community' || viewMode === 'compare';

  const groupedItems = useMemo(() => {
    const grouped = new Map<string | null, Item[]>();
    grouped.set(null, []);
    tiers.forEach((tier) => grouped.set(tier.id, []));

    effectiveItems.forEach((item) => {
      if (!grouped.has(item.tierId)) {
        grouped.set(item.tierId, []);
      }
      grouped.get(item.tierId)?.push(item);
    });

    return grouped;
  }, [effectiveItems, tiers]);

  return {
    addTier,
    boardBackground,
    effectiveIsReadOnly,
    groupedItems,
    isLoadingCommunity,
    isLoadingShared,
    isMounted,
    items,
    remixCount,
    reorderTiers,
    routeState,
    setViewMode,
    tiers,
    viewMode,
    moveItem,
  };
}

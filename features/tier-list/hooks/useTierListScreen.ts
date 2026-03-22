'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getBrowserSupabaseClient } from '../../../lib/supabase/client';
import { cleanupLegacyTierStoreStorage } from '../../../store/cleanupLegacyTierStore';
import { hydrateBoardState } from '../../../store/hydrateBoardState';
import { boardStore, useBoardStore } from '../../../store/useBoardStore';
import { prefsStore, usePrefsStore } from '../../../store/usePrefsStore';
import { mapSearchParamsToRouteState } from '../mappers';
import { recordViewAction } from '../actions';
import { getCommunityConsensus, getRemixById, getTierListById } from '../queries';
import { deriveIsViewer, deriveIsReadOnly } from '../services/ownership';
import type { Item } from '../../../types';
import type { ViewMode } from '../types';

export function useTierListScreen() {
  const searchParams = useSearchParams();
  const routeState = useMemo(() => mapSearchParamsToRouteState(searchParams), [searchParams]);

  const [isMounted, setIsMounted] = useState(false);
  const [isLoadingShared, setIsLoadingShared] = useState(false);
  const [isViewer, setIsViewer] = useState(false);
  const [hasSharedListContext, setHasSharedListContext] = useState(false);
  const [hasStartedEditing, setHasStartedEditing] = useState(false);
  const [originalItems, setOriginalItems] = useState<Item[] | null>(null);
  const [sharedListOwner, setSharedListOwner] = useState<string | null>(null);
  const [title, setTitle] = useState('My Tier List');
  const [remixCount, setRemixCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('creator');
  const [communityItems, setCommunityItems] = useState<Item[] | null>(null);
  const [compareItems, setCompareItems] = useState<Item[] | null>(null);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const tiers = useBoardStore((state) => state.tiers);
  const items = useBoardStore((state) => state.items);
  const reorderTiers = useBoardStore((state) => state.reorderTiers);
  const moveItemStore = useBoardStore((state) => state.moveItem);
  const addTier = useBoardStore((state) => state.addTier);
  const returnItemsToPool = useBoardStore((state) => state.returnItemsToPool);
  const boardBackground = usePrefsStore((state) => state.boardBackground);
  const theme = usePrefsStore((state) => state.theme);

  const refreshCurrentUser = useCallback(async () => {
    try {
      const supabase = getBrowserSupabaseClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      setCurrentUserId(user?.id ?? null);
    } catch (error) {
      console.error('Error fetching Supabase user:', error);
      setCurrentUserId(null);
    }
  }, []);

  useEffect(() => {
    let canceled = false;
    void (async () => {
      try {
        await Promise.all([boardStore.persist?.rehydrate?.(), prefsStore.persist?.rehydrate?.()]);
      } finally {
        if (canceled) return;
        cleanupLegacyTierStoreStorage();
        setIsMounted(true);
      }
    })();

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    void refreshCurrentUser();
  }, [refreshCurrentUser]);

  useEffect(() => {
    setCommunityItems(null);
    setCompareItems(null);
    setHasStartedEditing(false);
    setOriginalItems(null);
    setViewMode(routeState.compareId ? 'compare' : 'creator');
  }, [routeState.compareId, routeState.targetListId]);

  useEffect(() => {
    async function loadSharedList() {
      // Dev-only mock viewer mode: ?mock=viewer
      if (process.env.NODE_ENV === 'development' && searchParams.get('mock') === 'viewer') {
        const mockTiers = [
          { id: 's', label: 'S', color: '#ef4444' },
          { id: 'a', label: 'A', color: '#f97316' },
          { id: 'b', label: 'B', color: '#eab308' },
          { id: 'c', label: 'C', color: '#22c55e' },
        ];
        const mockItems: Item[] = [
          { id: 'm1', content: 'Mario', type: 'text', tierId: 's' },
          { id: 'm2', content: 'Luigi', type: 'text', tierId: 's' },
          { id: 'm3', content: 'Peach', type: 'text', tierId: 'a' },
          { id: 'm4', content: 'Bowser', type: 'text', tierId: 'a' },
          { id: 'm5', content: 'Toad', type: 'text', tierId: 'b' },
          { id: 'm6', content: 'Yoshi', type: 'text', tierId: 'b' },
          { id: 'm7', content: 'Wario', type: 'text', tierId: 'c' },
          { id: 'm8', content: 'Waluigi', type: 'text', tierId: null },
        ];
        // Community has slightly different rankings to show diff arrows
        const mockCommunityItems: Item[] = [
          { id: 'm1', content: 'Mario', type: 'text', tierId: 's' },
          { id: 'm2', content: 'Luigi', type: 'text', tierId: 'a' },  // moved down
          { id: 'm3', content: 'Peach', type: 'text', tierId: 's' },  // moved up
          { id: 'm4', content: 'Bowser', type: 'text', tierId: 'b' }, // moved down
          { id: 'm5', content: 'Toad', type: 'text', tierId: 'a' },   // moved up
          { id: 'm6', content: 'Yoshi', type: 'text', tierId: 'b' },
          { id: 'm7', content: 'Wario', type: 'text', tierId: 'c' },
          { id: 'm8', content: 'Waluigi', type: 'text', tierId: null },
        ];
        hydrateBoardState({
          tiers: mockTiers,
          items: mockItems,
          itemSize: 'medium',
          imageFit: 'cover',
          boardBackground: 'theme-default',
          theme: 'modern',
        });
        setOriginalItems(mockItems);
        setRemixCount(12);
        setCommunityItems(mockCommunityItems);
        setSharedListOwner('mock-owner');
        setIsViewer(true);
        setHasSharedListContext(true);
        return;
      }

      if (!routeState.targetListId) {
        setIsViewer(false);
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
          setIsViewer(false);
          return;
        }

        hydrateBoardState(tierList.boardState);
        setTitle(tierList.title);
        setRemixCount(tierList.remixCount);
        setViewCount(tierList.viewCount);
        setSharedListOwner(tierList.ownerId);

        if (routeState.remixingId) {
          setIsViewer(false);
          returnItemsToPool();
        } else {
          const viewer = deriveIsViewer({
            targetListId: routeState.targetListId,
            remixingId: routeState.remixingId,
            ownerId: tierList.ownerId,
            currentUserId,
          });
          setIsViewer(viewer);
          setViewMode(routeState.compareId ? 'compare' : 'creator');

          // Snapshot original items for diff indicators
          if (viewer) {
            setOriginalItems(tierList.boardState.items);
            setHasSharedListContext(true);
            // Fire-and-forget view recording
            recordViewAction(routeState.targetListId).catch(() => {});
          }
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
    isMounted,
    returnItemsToPool,
    refreshCurrentUser,
    routeState.compareId,
    routeState.remixingId,
    routeState.targetListId,
    searchParams,
  ]);

  useEffect(() => {
    // Don't override isViewer when in mock mode
    if (process.env.NODE_ENV === 'development' && searchParams.get('mock') === 'viewer') return;

    const viewer = deriveIsViewer({
      targetListId: routeState.targetListId,
      remixingId: routeState.remixingId,
      ownerId: sharedListOwner,
      currentUserId,
    });
    setIsViewer(viewer);
  }, [currentUserId, routeState.remixingId, routeState.targetListId, searchParams, sharedListOwner]);

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
      // Load eagerly for viewers with enough remixes, or on-demand when tab is selected
      const shouldEagerLoad = isViewer && !hasStartedEditing && remixCount >= 3;
      if (!shouldEagerLoad && viewMode !== 'community') return;
      if (communityItems !== null || !routeState.targetListId) return;

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
  }, [communityItems, hasStartedEditing, isMounted, isViewer, items, remixCount, routeState.targetListId, tiers, viewMode]);

  useEffect(() => {
    if (isMounted) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [isMounted, theme]);

  // Wrap moveItem to detect first edit by a viewer
  const moveItem = useCallback(
    (
      sourceTierId: string | null,
      destTierId: string | null,
      sourceIndex: number,
      destIndex: number
    ) => {
      if (isViewer && !hasStartedEditing) {
        setHasStartedEditing(true);
        setViewMode('yours');
      }
      moveItemStore(sourceTierId, destTierId, sourceIndex, destIndex);
    },
    [isViewer, hasStartedEditing, moveItemStore]
  );

  const handleStartEditing = useCallback(() => {
    setHasStartedEditing(true);
    setViewMode('yours');
  }, []);

  const effectiveItems =
    viewMode === 'community' && communityItems
      ? communityItems
      : viewMode === 'compare' && compareItems
        ? compareItems
        : viewMode === 'creator' && isViewer && hasStartedEditing && originalItems
          ? originalItems
          : items;

  const effectiveIsReadOnly =
    deriveIsReadOnly(viewMode) ||
    (viewMode === 'creator' && isViewer && hasStartedEditing);

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
    title,
    setTitle,
    communityItems,
    effectiveIsReadOnly,
    groupedItems,
    handleStartEditing,
    hasSharedListContext,
    hasStartedEditing,
    isLoadingCommunity,
    isLoadingShared,
    isMounted,
    isViewer,
    items,
    originalItems,
    remixCount,
    viewCount,
    reorderTiers,
    routeState,
    refreshCurrentUser,
    setViewMode,
    tiers,
    theme,
    viewMode,
    moveItem,
  };
}

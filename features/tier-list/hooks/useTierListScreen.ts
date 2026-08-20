'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getBrowserSupabaseClient } from '../../../lib/supabase/client';
import { cleanupLegacyTierStoreStorage } from '../../../store/cleanupLegacyTierStore';
import { enterRemoteBoardSession, restoreDraftBoardSession } from '../../../store/boardSession';
import { boardStore, useBoardStore } from '../../../store/useBoardStore';
import { prefsStore, usePrefsStore } from '../../../store/usePrefsStore';
import { mapSearchParamsToRouteState } from '../mappers';
import { recordViewAction } from '../actions';
import { getCommunityConsensus, getRemixById, getTierListById } from '../queries';
import { deriveIsViewer, deriveIsReadOnly } from '../services/ownership';
import type { Item } from '../../../types';
import type { TierListRecord, ViewMode } from '../types';

export type TierListLoadStatus = 'idle' | 'loading' | 'ready' | 'not-found' | 'error';

const MOCK_LIST_ID = 'mock-list';

/** Dev-only fixture reachable at `?mock=viewer`. */
function buildMockViewerList(): { record: TierListRecord; communityItems: Item[] } {
  const tiers = [
    { id: 's', label: 'S', color: '#ef4444' },
    { id: 'a', label: 'A', color: '#f97316' },
    { id: 'b', label: 'B', color: '#eab308' },
    { id: 'c', label: 'C', color: '#22c55e' },
  ];
  const items: Item[] = [
    { id: 'm1', content: 'Mario', type: 'text', tierId: 's' },
    { id: 'm2', content: 'Luigi', type: 'text', tierId: 's' },
    { id: 'm3', content: 'Peach', type: 'text', tierId: 'a' },
    { id: 'm4', content: 'Bowser', type: 'text', tierId: 'a' },
    { id: 'm5', content: 'Toad', type: 'text', tierId: 'b' },
    { id: 'm6', content: 'Yoshi', type: 'text', tierId: 'b' },
    { id: 'm7', content: 'Wario', type: 'text', tierId: 'c' },
    { id: 'm8', content: 'Waluigi', type: 'text', tierId: null },
  ];

  return {
    record: {
      id: MOCK_LIST_ID,
      ownerId: 'mock-owner',
      title: 'Mock Shared List',
      description: '',
      isPublic: true,
      remixCount: 12,
      viewCount: 340,
      createdAt: '',
      updatedAt: '',
      boardState: {
        tiers,
        items,
        itemSize: 'medium',
        imageFit: 'cover',
        boardBackground: 'theme-default',
        theme: 'modern',
      },
    },
    // Slightly different rankings so the diff arrows have something to show.
    communityItems: [
      { id: 'm1', content: 'Mario', type: 'text', tierId: 's' },
      { id: 'm2', content: 'Luigi', type: 'text', tierId: 'a' },
      { id: 'm3', content: 'Peach', type: 'text', tierId: 's' },
      { id: 'm4', content: 'Bowser', type: 'text', tierId: 'b' },
      { id: 'm5', content: 'Toad', type: 'text', tierId: 'a' },
      { id: 'm6', content: 'Yoshi', type: 'text', tierId: 'b' },
      { id: 'm7', content: 'Wario', type: 'text', tierId: 'c' },
      { id: 'm8', content: 'Waluigi', type: 'text', tierId: null },
    ],
  };
}

export function useTierListScreen() {
  const searchParams = useSearchParams();
  const routeState = useMemo(() => mapSearchParamsToRouteState(searchParams), [searchParams]);
  const isMockViewer =
    process.env.NODE_ENV === 'development' && searchParams.get('mock') === 'viewer';
  const targetListId = routeState.targetListId ?? (isMockViewer ? MOCK_LIST_ID : null);

  const [isMounted, setIsMounted] = useState(false);
  const [loadStatus, setLoadStatus] = useState<TierListLoadStatus>('idle');
  const [listRecord, setListRecord] = useState<TierListRecord | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isUserResolved, setIsUserResolved] = useState(false);
  const [hasStartedEditing, setHasStartedEditing] = useState(false);
  const [title, setTitle] = useState('My Tier List');
  const [viewMode, setViewMode] = useState<ViewMode>('creator');
  const [communityItems, setCommunityItems] = useState<Item[] | null>(null);
  const [compareItems, setCompareItems] = useState<Item[] | null>(null);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);

  // Guards against a slow response for a previously selected list landing after
  // a newer one and hydrating the wrong board.
  const loadTokenRef = useRef(0);
  const recordedViewsRef = useRef(new Set<string>());

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

      // Being signed out is the normal case for a visitor following a share
      // link, not an error worth reporting.
      if (error && error.name !== 'AuthSessionMissingError') {
        throw error;
      }

      setCurrentUserId(user?.id ?? null);
    } catch (error) {
      console.error('Error fetching Supabase user:', error);
      setCurrentUserId(null);
    } finally {
      setIsUserResolved(true);
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
    setViewMode(routeState.compareId ? 'compare' : 'creator');
  }, [routeState.compareId, targetListId]);

  /**
   * Loads the shared list exactly once per target.
   *
   * This deliberately does not depend on the signed-in user: ownership only
   * affects derived state below, and depending on it made the effect run again
   * once auth resolved, re-hydrating the board and discarding anything the
   * visitor had already changed.
   */
  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const token = loadTokenRef.current + 1;
    loadTokenRef.current = token;
    const isCurrent = () => loadTokenRef.current === token;

    if (!targetListId) {
      setListRecord(null);
      setLoadStatus('idle');
      // Hand the board back to the visitor's own draft.
      void restoreDraftBoardSession();
      return;
    }

    if (isMockViewer) {
      const mock = buildMockViewerList();
      enterRemoteBoardSession(MOCK_LIST_ID, mock.record.boardState);
      setListRecord(mock.record);
      setTitle(mock.record.title);
      setCommunityItems(mock.communityItems);
      setLoadStatus('ready');
      return;
    }

    setLoadStatus('loading');

    void (async () => {
      try {
        const tierList = await getTierListById(targetListId);
        if (!isCurrent()) {
          return;
        }

        if (!tierList) {
          setListRecord(null);
          setLoadStatus('not-found');
          return;
        }

        enterRemoteBoardSession(tierList.id, tierList.boardState);
        setListRecord(tierList);
        setTitle(tierList.title);
        setLoadStatus('ready');

        if (routeState.remixingId) {
          returnItemsToPool();
        }
      } catch (error) {
        console.error('Error fetching shared list:', error);
        if (isCurrent()) {
          setListRecord(null);
          setLoadStatus('error');
        }
      }
    })();
  }, [isMockViewer, isMounted, returnItemsToPool, routeState.remixingId, targetListId]);

  const ownerId = listRecord?.ownerId ?? null;
  const remixCount = listRecord?.remixCount ?? 0;
  const viewCount = listRecord?.viewCount ?? 0;
  const originalItems = listRecord?.boardState.items ?? null;

  /**
   * True while the board on screen might still change owner. Editing during
   * this window would be silently overwritten by the hydration that follows.
   */
  const isOwnershipPending =
    Boolean(targetListId) && (loadStatus === 'loading' || loadStatus === 'idle' || !isUserResolved);

  const isViewer = useMemo(
    () =>
      deriveIsViewer({
        targetListId,
        remixingId: routeState.remixingId,
        ownerId,
        currentUserId,
      }),
    [currentUserId, ownerId, routeState.remixingId, targetListId]
  );

  const hasSharedListContext = isViewer && listRecord !== null;

  useEffect(() => {
    if (!isViewer || !targetListId || isMockViewer) {
      return;
    }

    if (recordedViewsRef.current.has(targetListId)) {
      return;
    }

    recordedViewsRef.current.add(targetListId);
    void recordViewAction({ tierListId: targetListId });
  }, [isMockViewer, isViewer, targetListId]);

  useEffect(() => {
    if (!isMounted || viewMode !== 'compare' || !targetListId || !routeState.compareId) {
      return;
    }

    let canceled = false;

    void (async () => {
      try {
        const remix = await getRemixById(targetListId, routeState.compareId as string);
        if (!canceled) {
          setCompareItems(remix?.items ?? null);
        }
      } catch (error) {
        console.error('Error fetching compare list:', error);
        if (!canceled) {
          setCompareItems(null);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [isMounted, routeState.compareId, targetListId, viewMode]);

  useEffect(() => {
    // Load eagerly for viewers with enough remixes, or on demand when the tab is
    // selected.
    const shouldEagerLoad = isViewer && !hasStartedEditing && remixCount >= 3;
    if (!isMounted || (!shouldEagerLoad && viewMode !== 'community')) {
      return;
    }

    if (communityItems !== null || !targetListId || !listRecord) {
      return;
    }

    let canceled = false;
    setIsLoadingCommunity(true);

    void (async () => {
      try {
        // Always measured against the creator's saved board, never against the
        // live store, which a viewer may already have re-ranked.
        const consensus = await getCommunityConsensus({
          tierListId: targetListId,
          items: listRecord.boardState.items,
          tiers: listRecord.boardState.tiers,
        });

        if (!canceled) {
          setCommunityItems(consensus);
        }
      } catch (error) {
        console.error('Error fetching community consensus:', error);
      } finally {
        if (!canceled) {
          setIsLoadingCommunity(false);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [
    communityItems,
    hasStartedEditing,
    isMounted,
    isViewer,
    listRecord,
    remixCount,
    targetListId,
    viewMode,
  ]);

  useEffect(() => {
    if (isMounted) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [isMounted, theme]);

  const effectiveIsReadOnly = deriveIsReadOnly({
    viewMode,
    isViewer,
    hasStartedEditing,
    isOwnershipPending,
  });

  // Wrap moveItem to detect the first edit by a viewer.
  const moveItem = useCallback(
    (
      sourceTierId: string | null,
      destTierId: string | null,
      sourceIndex: number,
      destIndex: number
    ) => {
      if (effectiveIsReadOnly) {
        return;
      }

      if (isViewer && !hasStartedEditing) {
        setHasStartedEditing(true);
        setViewMode('yours');
      }

      moveItemStore(sourceTierId, destTierId, sourceIndex, destIndex);
    },
    [effectiveIsReadOnly, hasStartedEditing, isViewer, moveItemStore]
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

  const groupedItems = useMemo(() => {
    const grouped = new Map<string | null, Item[]>();
    grouped.set(null, []);
    tiers.forEach((tier) => grouped.set(tier.id, []));

    effectiveItems.forEach((item) => {
      // Items can only reach an unknown tier through a view-mode payload, never
      // through the store, which keeps every `tierId` resolvable.
      if (!grouped.has(item.tierId)) {
        grouped.get(null)?.push(item);
        return;
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
    isLoadingShared: loadStatus === 'loading',
    isMounted,
    isViewer,
    items,
    listUpdatedAt: listRecord?.updatedAt ?? null,
    loadStatus,
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

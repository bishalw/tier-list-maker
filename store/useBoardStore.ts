'use client';

import { useStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { temporal } from 'zundo';
import type { Item, Theme, Tier } from '../types';
import { createDefaultTiers } from '../constants/theme';
import { MAX_ITEMS, MAX_TIERS, MIN_TIERS } from '../constants/board';
import { createTierId } from '../lib/ids';
import { getPersistStorage } from './persistStorage';
import { reconcileBoardSnapshot, sanitizeItem, sanitizeTier } from './boardInvariants';

const BOARD_STORAGE_KEY = 'tier-list-board-storage';
const BOARD_STORAGE_VERSION = 1;
const BOARD_STORE_GLOBAL_KEY = '__tier_list_board_store__';

/**
 * Every snapshot in the undo stack holds a full copy of `tiers` and `items`, so
 * the history is bounded rather than growing for the lifetime of the tab.
 */
const UNDO_HISTORY_LIMIT = 100;

function createInitialBoardState(): Pick<BoardState, 'tiers' | 'items'> {
  return {
    tiers: createDefaultTiers('modern'),
    items: [],
  };
}

interface BoardState {
  tiers: Tier[];
  items: Item[];
  reorderTiers: (startIndex: number, endIndex: number) => void;
  moveItem: (
    sourceTierId: string | null,
    destTierId: string | null,
    sourceIndex: number,
    destIndex: number
  ) => void;
  addItem: (newItem: Item) => void;
  addItems: (newItems: Item[]) => void;
  deleteItem: (id: string) => void;
  addTier: () => void;
  updateTier: (id: string, updates: Partial<Tier>) => void;
  deleteTier: (id: string) => void;
  returnItemsToPool: () => void;
  assignItemToTier: (itemId: string, targetTierId: string | null) => void;
  deleteAllItems: () => void;
  resetTiers: (theme: Theme) => void;
  applyTemplate: (newTiers: Tier[]) => void;
  replaceBoard: (snapshot: { tiers: Tier[]; items: Item[] }) => void;
}

type PersistedBoardState = Pick<BoardState, 'tiers' | 'items'>;

const noop = () => {};
const fallbackBoardState: BoardState = {
  ...createInitialBoardState(),
  reorderTiers: noop,
  moveItem: noop as BoardState['moveItem'],
  addItem: noop as BoardState['addItem'],
  addItems: noop as BoardState['addItems'],
  deleteItem: noop as BoardState['deleteItem'],
  addTier: noop,
  updateTier: noop as BoardState['updateTier'],
  deleteTier: noop as BoardState['deleteTier'],
  returnItemsToPool: noop,
  assignItemToTier: noop as BoardState['assignItemToTier'],
  deleteAllItems: noop,
  resetTiers: noop as BoardState['resetTiers'],
  applyTemplate: noop as BoardState['applyTemplate'],
  replaceBoard: noop as BoardState['replaceBoard'],
};

function partializeBoardState(state: BoardState): PersistedBoardState {
  return {
    tiers: state.tiers,
    items: state.items,
  };
}

/** Drops any `tierId` that no longer resolves, so items fall back to the pool. */
function repoolOrphanedItems(items: Item[], tiers: Tier[]): Item[] {
  const tierIds = new Set(tiers.map((tier) => tier.id));

  return items.map((item) =>
    item.tierId !== null && !tierIds.has(item.tierId) ? { ...item, tierId: null } : item
  );
}

function withUniqueIds(existing: Item[], incoming: Item[]): Item[] {
  const takenIds = new Set(existing.map((item) => item.id));
  const accepted: Item[] = [];

  for (const candidate of incoming) {
    const sanitized = sanitizeItem(candidate);
    if (!sanitized) {
      continue;
    }

    const item = takenIds.has(sanitized.id)
      ? { ...sanitized, id: `${sanitized.id}-${takenIds.size}` }
      : sanitized;

    takenIds.add(item.id);
    accepted.push(item);
  }

  return accepted;
}

function createBoardStore() {
  return createStore<BoardState>()(
    persist(
      temporal(
        (set) => ({
          ...createInitialBoardState(),

          reorderTiers: (startIndex, endIndex) =>
            set((state) => {
              const newTiers = Array.from(state.tiers);
              const [reorderedTier] = newTiers.splice(startIndex, 1);

              if (!reorderedTier) {
                return state;
              }

              newTiers.splice(endIndex, 0, reorderedTier);
              return { tiers: newTiers };
            }),

          moveItem: (sourceTierId, destTierId, sourceIndex, destIndex) =>
            set((state) => {
              const grouped = new Map<string | null, Item[]>();
              grouped.set(null, []);
              state.tiers.forEach((tier) => grouped.set(tier.id, []));

              state.items.forEach((item) => {
                if (!grouped.has(item.tierId)) {
                  grouped.set(item.tierId, []);
                }

                grouped.get(item.tierId)?.push(item);
              });

              const sourceList = grouped.get(sourceTierId) || [];
              const destList = grouped.get(destTierId) || [];
              const sourceItem = sourceList[sourceIndex];

              if (!sourceItem) {
                return state;
              }

              const draggedItem = { ...sourceItem, tierId: destTierId };
              sourceList.splice(sourceIndex, 1);

              if (sourceTierId === destTierId) {
                sourceList.splice(destIndex, 0, draggedItem);
              } else {
                destList.splice(destIndex, 0, draggedItem);
              }

              const newItems: Item[] = [];
              grouped.forEach((list) => newItems.push(...list));

              return { items: newItems };
            }),

          assignItemToTier: (itemId, targetTierId) =>
            set((state) => {
              const item = state.items.find((i) => i.id === itemId);
              if (!item || item.tierId === targetTierId) {
                return state;
              }

              if (targetTierId !== null && !state.tiers.some((tier) => tier.id === targetTierId)) {
                return state;
              }

              // Move the item to the end of the destination group instead of
              // leaving it at its old array index, so tap-to-assign matches
              // where a drag to the end of that tier would have placed it.
              const remaining = state.items.filter((i) => i.id !== itemId);
              const moved = { ...item, tierId: targetTierId };

              let insertAt = remaining.length;
              for (let index = remaining.length - 1; index >= 0; index -= 1) {
                if (remaining[index].tierId === targetTierId) {
                  insertAt = index + 1;
                  break;
                }
              }

              return {
                items: [...remaining.slice(0, insertAt), moved, ...remaining.slice(insertAt)],
              };
            }),

          addItem: (newItem) =>
            set((state) => {
              if (state.items.length >= MAX_ITEMS) {
                return state;
              }

              const accepted = withUniqueIds(state.items, [newItem]);
              if (accepted.length === 0) {
                return state;
              }

              return { items: [...state.items, ...accepted] };
            }),

          addItems: (newItems) =>
            set((state) => {
              const capacity = MAX_ITEMS - state.items.length;
              if (capacity <= 0) {
                return state;
              }

              const accepted = withUniqueIds(state.items, newItems).slice(0, capacity);
              if (accepted.length === 0) {
                return state;
              }

              return { items: [...state.items, ...accepted] };
            }),

          deleteItem: (id) =>
            set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

          addTier: () =>
            set((state) => {
              if (state.tiers.length >= MAX_TIERS) {
                return state;
              }

              return {
                tiers: [...state.tiers, { id: createTierId(), label: 'NEW', color: '#cccccc' }],
              };
            }),

          updateTier: (id, updates) =>
            set((state) => ({
              tiers: state.tiers.map((tier) => {
                if (tier.id !== id) {
                  return tier;
                }

                // `id` is never taken from the update payload: rewriting it here
                // would orphan every item assigned to this tier.
                const { id: _ignoredId, ...safeUpdates } = updates;
                return sanitizeTier({ ...tier, ...safeUpdates }) ?? tier;
              }),
            })),

          deleteTier: (id) =>
            set((state) => {
              // A board with no tiers renders, but cannot be saved: the persisted
              // schema requires at least one.
              if (state.tiers.length <= MIN_TIERS) {
                return state;
              }

              const tiers = state.tiers.filter((tier) => tier.id !== id);
              if (tiers.length === state.tiers.length) {
                return state;
              }

              return {
                tiers,
                items: state.items.map((item) =>
                  item.tierId === id ? { ...item, tierId: null } : item
                ),
              };
            }),

          returnItemsToPool: () =>
            set((state) => ({
              items: state.items.map((item) =>
                item.tierId === null ? item : { ...item, tierId: null }
              ),
            })),

          deleteAllItems: () => set({ items: [] }),

          resetTiers: (theme) =>
            set((state) => {
              const tiers = createDefaultTiers(theme);

              // Items assigned to tiers that the new palette does not define
              // would otherwise stay in state while disappearing from the board.
              return { tiers, items: repoolOrphanedItems(state.items, tiers) };
            }),

          applyTemplate: (newTiers) =>
            set((state) => {
              const { tiers } = reconcileBoardSnapshot(
                { tiers: newTiers, items: [] },
                { fallbackTiers: state.tiers }
              );

              return {
                tiers,
                items: state.items.map((item) =>
                  item.tierId === null ? item : { ...item, tierId: null }
                ),
              };
            }),

          replaceBoard: (snapshot) =>
            set((state) => {
              const { tiers, items } = reconcileBoardSnapshot(snapshot, {
                fallbackTiers: state.tiers,
              });

              return { tiers, items };
            }),
        }),
        {
          limit: UNDO_HISTORY_LIMIT,
          partialize: partializeBoardState,
        }
      ),
      {
        name: BOARD_STORAGE_KEY,
        version: BOARD_STORAGE_VERSION,
        storage: createJSONStorage(getPersistStorage),
        skipHydration: true,
        partialize: partializeBoardState,
        migrate: (persistedState, version) => {
          if (version >= BOARD_STORAGE_VERSION || typeof persistedState !== 'object' || persistedState === null) {
            return persistedState as PersistedBoardState;
          }

          // v0 payloads predate the pooled-item representation, so an item could
          // be stored without a `tierId` at all. `merge` reconciles the rest.
          const legacy = persistedState as { tiers?: unknown; items?: unknown };
          const items = Array.isArray(legacy.items)
            ? legacy.items.map((item) =>
                typeof item === 'object' && item !== null && !('tierId' in item)
                  ? { ...item, tierId: null }
                  : item
              )
            : [];

          return { tiers: Array.isArray(legacy.tiers) ? legacy.tiers : [], items } as PersistedBoardState;
        },
        merge: (persistedState, currentState) => {
          if (typeof persistedState !== 'object' || persistedState === null) {
            return currentState;
          }

          // Salvage what is valid rather than discarding the whole board because
          // one item is malformed, and repair anything that violates a board
          // invariant before it reaches the UI.
          const { tiers, items } = reconcileBoardSnapshot(
            persistedState as { tiers: unknown; items: unknown },
            { fallbackTiers: currentState.tiers }
          );

          return { ...currentState, tiers, items };
        },
      }
    )
  );
}

type BoardStoreApi = ReturnType<typeof createBoardStore>;

function getBoardStore(): BoardStoreApi {
  if (typeof window !== 'undefined') {
    const existing = (window as unknown as Record<string, unknown>)[
      BOARD_STORE_GLOBAL_KEY
    ] as BoardStoreApi | undefined;
    if (existing) {
      return existing;
    }

    const created = createBoardStore();
    (window as unknown as Record<string, unknown>)[BOARD_STORE_GLOBAL_KEY] = created;
    return created;
  }

  return createBoardStore();
}

export const boardStore = getBoardStore();

/** Returns the board to its initial contents, e.g. when leaving a shared list. */
export function resetBoardStore() {
  boardStore.setState(createInitialBoardState(), false);
}

function getSafeBoardState(state: BoardState | undefined): BoardState {
  if (state) return state;
  const initial = boardStore.getInitialState?.() as BoardState | undefined;
  if (initial) return initial;
  const current = boardStore.getState?.() as BoardState | undefined;
  if (current) return current;
  return fallbackBoardState;
}

export function useBoardStore<T>(selector: (state: BoardState) => T) {
  return useStore(boardStore, (state) => selector(getSafeBoardState(state as BoardState | undefined)));
}

export { BOARD_STORAGE_KEY, BOARD_STORAGE_VERSION, UNDO_HISTORY_LIMIT };
export type { BoardState, PersistedBoardState };

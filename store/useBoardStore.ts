'use client';

import { useStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { temporal } from 'zundo';
import type { Item, Theme, Tier } from '../types';
import { createDefaultTiers } from '../constants/theme';

const BOARD_STORAGE_KEY = 'tier-list-board-storage';
const BOARD_STORE_GLOBAL_KEY = '__tier_list_board_store__';

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const initialBoardState = {
  tiers: createDefaultTiers('modern'),
  items: [],
} satisfies Pick<BoardState, 'tiers' | 'items'>;

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
}

type PersistedBoardState = Pick<BoardState, 'tiers' | 'items'>;

const noop = () => {};
const fallbackBoardState: BoardState = {
  tiers: initialBoardState.tiers,
  items: initialBoardState.items,
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
};

function partializeBoardState(state: BoardState): PersistedBoardState {
  return {
    tiers: state.tiers,
    items: state.items,
  };
}

function isTier(value: unknown): value is Tier {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Tier).id === 'string' &&
    typeof (value as Tier).label === 'string' &&
    typeof (value as Tier).color === 'string'
  );
}

function isItem(value: unknown): value is Item {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Item).id === 'string' &&
    typeof (value as Item).content === 'string' &&
    ((value as Item).type === 'image' || (value as Item).type === 'text') &&
    (typeof (value as Item).tierId === 'string' || (value as Item).tierId === null)
  );
}

function isPersistedBoardState(value: unknown): value is PersistedBoardState {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as PersistedBoardState).tiers) &&
    Array.isArray((value as PersistedBoardState).items) &&
    (value as PersistedBoardState).tiers.every(isTier) &&
    (value as PersistedBoardState).items.every(isItem)
  );
}

function getPersistStorage() {
  try {
    if (
      typeof window !== 'undefined' &&
      typeof window.localStorage?.getItem === 'function' &&
      typeof window.localStorage?.setItem === 'function' &&
      typeof window.localStorage?.removeItem === 'function'
    ) {
      return window.localStorage;
    }
  } catch {
    // Accessing localStorage can throw in some browser privacy modes.
  }

  return noopStorage;
}

function createBoardStore() {
  return createStore<BoardState>()(
    persist(
      temporal(
        (set) => ({
          ...initialBoardState,

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
              if (!item || item.tierId === targetTierId) return state;
              return {
                items: state.items.map((i) =>
                  i.id === itemId ? { ...i, tierId: targetTierId } : i
                ),
              };
            }),

          addItem: (newItem) => set((state) => ({ items: [...state.items, newItem] })),
          addItems: (newItems) => set((state) => ({ items: [...state.items, ...newItems] })),
          deleteItem: (id) =>
            set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
          addTier: () =>
            set((state) => ({
              tiers: [
                ...state.tiers,
                { id: `tier-${Date.now()}`, label: 'NEW', color: '#cccccc' },
              ],
            })),
          updateTier: (id, updates) =>
            set((state) => ({
              tiers: state.tiers.map((tier) =>
                tier.id === id ? { ...tier, ...updates } : tier
              ),
            })),
          deleteTier: (id) =>
            set((state) => ({
              tiers: state.tiers.filter((tier) => tier.id !== id),
              items: state.items.map((item) =>
                item.tierId === id ? { ...item, tierId: null } : item
              ),
            })),
          returnItemsToPool: () =>
            set((state) => ({
              items: state.items.map((item) => ({ ...item, tierId: null })),
            })),
          deleteAllItems: () => set({ items: [] }),
          resetTiers: (theme) => set({ tiers: createDefaultTiers(theme) }),
          applyTemplate: (newTiers) =>
            set((state) => ({
              tiers: newTiers,
              items: state.items.map((item) => ({ ...item, tierId: null })),
            })),
        }),
        {
          partialize: partializeBoardState,
        }
      ),
      {
        name: BOARD_STORAGE_KEY,
        storage: createJSONStorage(getPersistStorage),
        skipHydration: true,
        partialize: partializeBoardState,
        merge: (persistedState, currentState) => {
          if (!isPersistedBoardState(persistedState)) {
            return currentState;
          }

          return {
            ...currentState,
            ...persistedState,
          };
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

export { BOARD_STORAGE_KEY };

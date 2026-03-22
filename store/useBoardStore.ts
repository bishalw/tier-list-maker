import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { Item, Theme, Tier } from '../types';
import { createDefaultTiers } from '../constants/theme';

const BOARD_STORAGE_KEY = 'tier-list-board-storage';

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
  addItems: (newItems: Item[]) => void;
  deleteItem: (id: string) => void;
  addTier: () => void;
  updateTier: (id: string, updates: Partial<Tier>) => void;
  deleteTier: (id: string) => void;
  returnItemsToPool: () => void;
  deleteAllItems: () => void;
  resetTiers: (theme: Theme) => void;
  applyTemplate: (newTiers: Tier[]) => void;
}

export const useBoardStore = create<BoardState>()(
  temporal(
    persist(
      (set) => ({
        tiers: createDefaultTiers('modern'),
        items: [],

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

        addItems: (newItems) => set((state) => ({ items: [...state.items, ...newItems] })),
        deleteItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
        addTier: () =>
          set((state) => ({
            tiers: [...state.tiers, { id: `tier-${Date.now()}`, label: 'NEW', color: '#cccccc' }],
          })),
        updateTier: (id, updates) =>
          set((state) => ({
            tiers: state.tiers.map((tier) => (tier.id === id ? { ...tier, ...updates } : tier)),
          })),
        deleteTier: (id) =>
          set((state) => ({
            tiers: state.tiers.filter((tier) => tier.id !== id),
            items: state.items.map((item) => (item.tierId === id ? { ...item, tierId: null } : item)),
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
        name: BOARD_STORAGE_KEY,
        partialize: (state) => ({
          tiers: state.tiers,
          items: state.items,
        }),
      }
    ),
    {
      partialize: (state) => ({
        tiers: state.tiers,
        items: state.items,
      }),
    }
  )
);

export { BOARD_STORAGE_KEY };

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import { Item, Tier, ItemSize, ImageFit, Theme, TierBoardState, BoardBackground } from '../types';
import { createDefaultTiers, THEME_DEFAULT_BOARD_BACKGROUND } from '../constants/theme';

interface TierState {
  tiers: Tier[];
  items: Item[];
  itemSize: ItemSize;
  imageFit: ImageFit;
  boardBackground: BoardBackground;
  theme: Theme;
  
  // Actions
  setItemSize: (size: ItemSize) => void;
  setImageFit: (fit: ImageFit) => void;
  setBoardBackground: (color: string) => void;
  resetBoardBackground: () => void;
  setTheme: (theme: Theme) => void;
  reorderTiers: (startIndex: number, endIndex: number) => void;
  moveItem: (sourceTierId: string | null, destTierId: string | null, sourceIndex: number, destIndex: number) => void;
  addItems: (newItems: Item[]) => void;
  deleteItem: (id: string) => void;
  addTier: () => void;
  updateTier: (id: string, updates: Partial<Tier>) => void;
  deleteTier: (id: string) => void;
  returnItemsToPool: () => void;
  deleteAllItems: () => void;
  resetTiers: () => void;
  applyTemplate: (newTiers: Tier[]) => void;
  hydrateBoardState: (state: TierBoardState) => void;
}

export const useTierStore = create<TierState>()(
  temporal(
    persist(
      (set) => ({
        tiers: createDefaultTiers('modern'),
        items: [],
        itemSize: 'medium',
        imageFit: 'cover',
        boardBackground: THEME_DEFAULT_BOARD_BACKGROUND,
        theme: 'modern',

        setItemSize: (size) => set({ itemSize: size }),
        setImageFit: (fit) => set({ imageFit: fit }),
        setBoardBackground: (color) => set({ boardBackground: color as BoardBackground }),
        resetBoardBackground: () => set({ boardBackground: THEME_DEFAULT_BOARD_BACKGROUND }),
        setTheme: (theme) => set({ theme }),

        hydrateBoardState: (newState) => set({
          tiers: newState.tiers,
          items: newState.items,
          itemSize: newState.itemSize,
          imageFit: newState.imageFit,
          boardBackground: newState.boardBackground,
          theme: newState.theme,
        }),

        reorderTiers: (startIndex, endIndex) => set((state) => {
        const newTiers = Array.from(state.tiers);
        const [reorderedTier] = newTiers.splice(startIndex, 1);
        newTiers.splice(endIndex, 0, reorderedTier);
        return { tiers: newTiers };
      }),

      moveItem: (sourceTierId, destTierId, sourceIndex, destIndex) => set((state) => {
        const grouped = new Map<string | null, Item[]>();
        grouped.set(null, []);
        state.tiers.forEach(t => grouped.set(t.id, []));
        
        state.items.forEach(item => {
          if (!grouped.has(item.tierId)) grouped.set(item.tierId, []);
          grouped.get(item.tierId)!.push(item);
        });

        const sourceList = grouped.get(sourceTierId) || [];
        const destList = grouped.get(destTierId) || [];

        if (!sourceList[sourceIndex]) return state;

        const draggedItem = { ...sourceList[sourceIndex], tierId: destTierId };
        sourceList.splice(sourceIndex, 1);

        if (sourceTierId === destTierId) {
          sourceList.splice(destIndex, 0, draggedItem);
        } else {
          destList.splice(destIndex, 0, draggedItem);
        }

        const newItems: Item[] = [];
        grouped.forEach(list => newItems.push(...list));
        
        return { items: newItems };
      }),

      addItems: (newItems) => set((state) => ({ items: [...state.items, ...newItems] })),
      
      deleteItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
      
      addTier: () => set((state) => ({
        tiers: [...state.tiers, { id: `tier-${Date.now()}`, label: 'NEW', color: '#cccccc' }]
      })),
      
      updateTier: (id, updates) => set((state) => ({
        tiers: state.tiers.map(t => t.id === id ? { ...t, ...updates } : t)
      })),
      
      deleteTier: (id) => set((state) => ({
        tiers: state.tiers.filter(t => t.id !== id),
        items: state.items.map(item => item.tierId === id ? { ...item, tierId: null } : item)
      })),
      
      returnItemsToPool: () => set((state) => ({
        items: state.items.map(i => ({ ...i, tierId: null }))
      })),
      
      deleteAllItems: () => set({ items: [] }),
      
      resetTiers: () => set((state) => ({ tiers: createDefaultTiers(state.theme) })),

      applyTemplate: (newTiers) => set((state) => ({
        tiers: newTiers,
        // CRITICAL: Return all items to the pool so they don't get orphaned
        // when their current tierId no longer exists in the new template.
        items: state.items.map(i => ({ ...i, tierId: null }))
      })),
    }),
    {
      name: 'tier-list-storage',
    }
  ),
  {
    partialize: (state) => {
      const { tiers, items, boardBackground, theme } = state;
      return { tiers, items, boardBackground, theme };
    },
  }
)
);

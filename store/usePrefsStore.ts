import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BoardBackground, ImageFit, ItemSize, Theme } from '../types';
import { THEME_DEFAULT_BOARD_BACKGROUND } from '../constants/theme';

const PREFS_STORAGE_KEY = 'tier-list-prefs-storage';

interface PrefsState {
  theme: Theme;
  boardBackground: BoardBackground;
  itemSize: ItemSize;
  imageFit: ImageFit;
  setTheme: (theme: Theme) => void;
  setBoardBackground: (color: string) => void;
  resetBoardBackground: () => void;
  setItemSize: (size: ItemSize) => void;
  setImageFit: (fit: ImageFit) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      theme: 'modern',
      boardBackground: THEME_DEFAULT_BOARD_BACKGROUND,
      itemSize: 'medium',
      imageFit: 'cover',
      setTheme: (theme) => set({ theme }),
      setBoardBackground: (color) => set({ boardBackground: color as BoardBackground }),
      resetBoardBackground: () => set({ boardBackground: THEME_DEFAULT_BOARD_BACKGROUND }),
      setItemSize: (size) => set({ itemSize: size }),
      setImageFit: (fit) => set({ imageFit: fit }),
    }),
    {
      name: PREFS_STORAGE_KEY,
    }
  )
);

export { PREFS_STORAGE_KEY };

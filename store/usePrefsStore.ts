'use client';

import { useStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import type { BoardBackground, ImageFit, ItemSize, Theme } from '../types';
import { THEME_DEFAULT_BOARD_BACKGROUND } from '../constants/theme';

const PREFS_STORAGE_KEY = 'tier-list-prefs-storage';
const PREFS_STORE_GLOBAL_KEY = '__tier_list_prefs_store__';

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

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

const noop = () => {};
const fallbackPrefsState: PrefsState = {
  theme: 'modern',
  boardBackground: THEME_DEFAULT_BOARD_BACKGROUND,
  itemSize: 'medium',
  imageFit: 'cover',
  setTheme: noop as PrefsState['setTheme'],
  setBoardBackground: noop as PrefsState['setBoardBackground'],
  resetBoardBackground: noop,
  setItemSize: noop as PrefsState['setItemSize'],
  setImageFit: noop as PrefsState['setImageFit'],
};

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

function createPrefsStore() {
  return createStore<PrefsState>()(
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
        storage: createJSONStorage(getPersistStorage),
        skipHydration: true,
      }
    )
  );
}

type PrefsStoreApi = ReturnType<typeof createPrefsStore>;

function getPrefsStore(): PrefsStoreApi {
  if (typeof window !== 'undefined') {
    const existing = (window as unknown as Record<string, unknown>)[
      PREFS_STORE_GLOBAL_KEY
    ] as PrefsStoreApi | undefined;
    if (existing) {
      return existing;
    }

    const created = createPrefsStore();
    (window as unknown as Record<string, unknown>)[PREFS_STORE_GLOBAL_KEY] = created;
    return created;
  }

  return createPrefsStore();
}

export const prefsStore = getPrefsStore();

function getSafePrefsState(state: PrefsState | undefined): PrefsState {
  if (state) return state;
  const initial = prefsStore.getInitialState?.() as PrefsState | undefined;
  if (initial) return initial;
  const current = prefsStore.getState?.() as PrefsState | undefined;
  if (current) return current;
  return fallbackPrefsState;
}

export function usePrefsStore<T>(selector: (state: PrefsState) => T) {
  return useStore(prefsStore, (state) => selector(getSafePrefsState(state as PrefsState | undefined)));
}

export { PREFS_STORAGE_KEY };

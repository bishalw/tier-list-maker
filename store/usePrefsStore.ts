'use client';

import { useStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import type { BoardBackground, ImageFit, ItemSize, Theme } from '../types';
import { getPersistStorage } from './persistStorage';
import {
  DEFAULT_PREFS,
  isImageFit,
  isItemSize,
  isTheme,
  sanitizeBoardBackground,
  sanitizePrefs,
  type PrefsSnapshot,
} from './prefsInvariants';

const PREFS_STORAGE_KEY = 'tier-list-prefs-storage';
const PREFS_STORAGE_VERSION = 1;
const PREFS_STORE_GLOBAL_KEY = '__tier_list_prefs_store__';

interface PrefsState extends PrefsSnapshot {
  setTheme: (theme: Theme) => void;
  setBoardBackground: (color: string) => void;
  resetBoardBackground: () => void;
  setItemSize: (size: ItemSize) => void;
  setImageFit: (fit: ImageFit) => void;
  replacePrefs: (prefs: Partial<PrefsSnapshot>) => void;
}

const noop = () => {};
const fallbackPrefsState: PrefsState = {
  ...DEFAULT_PREFS,
  setTheme: noop as PrefsState['setTheme'],
  setBoardBackground: noop as PrefsState['setBoardBackground'],
  resetBoardBackground: noop,
  setItemSize: noop as PrefsState['setItemSize'],
  setImageFit: noop as PrefsState['setImageFit'],
  replacePrefs: noop as PrefsState['replacePrefs'],
};

function partializePrefsState(state: PrefsState): PrefsSnapshot {
  return {
    theme: state.theme,
    boardBackground: state.boardBackground,
    itemSize: state.itemSize,
    imageFit: state.imageFit,
  };
}

function createPrefsStore() {
  return createStore<PrefsState>()(
    persist(
      (set) => ({
        ...DEFAULT_PREFS,
        setTheme: (theme) => set(isTheme(theme) ? { theme } : {}),
        setBoardBackground: (color: string) =>
          set({ boardBackground: sanitizeBoardBackground(color) }),
        resetBoardBackground: () => set({ boardBackground: DEFAULT_PREFS.boardBackground }),
        setItemSize: (size) => set(isItemSize(size) ? { itemSize: size } : {}),
        setImageFit: (fit) => set(isImageFit(fit) ? { imageFit: fit } : {}),
        replacePrefs: (prefs) => set(sanitizePrefs({ ...DEFAULT_PREFS, ...prefs })),
      }),
      {
        name: PREFS_STORAGE_KEY,
        version: PREFS_STORAGE_VERSION,
        storage: createJSONStorage(getPersistStorage),
        skipHydration: true,
        partialize: partializePrefsState,
        migrate: (persistedState) => persistedState as PrefsSnapshot,
        merge: (persistedState, currentState) => ({
          ...currentState,
          ...sanitizePrefs(persistedState),
        }),
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

/** Returns preferences to their defaults, e.g. when leaving a shared list. */
export function resetPrefsStore() {
  prefsStore.setState({ ...DEFAULT_PREFS });
}

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

export { PREFS_STORAGE_KEY, PREFS_STORAGE_VERSION };
export type { PrefsState };

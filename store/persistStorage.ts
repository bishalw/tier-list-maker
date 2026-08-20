'use client';

/**
 * Shared localStorage access for the persisted stores.
 *
 * Two concerns are handled here that the stores should not have to repeat:
 *  - storage can be missing or throw outright (private browsing, blocked cookies)
 *  - writes can fail at any time once the origin quota is exhausted
 *
 * Writes can also be suspended globally. While the app is showing a tier list
 * loaded from the server, the local draft must not be overwritten, so the
 * stores keep reading from storage but stop writing to it.
 */

export interface KeyValueStorage {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
}

export const noopStorage: KeyValueStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

let writesEnabled = true;
let hasWarnedAboutQuota = false;

export function setPersistWritesEnabled(enabled: boolean) {
  writesEnabled = enabled;
}

export function arePersistWritesEnabled() {
  return writesEnabled;
}

function getBrowserStorage(): KeyValueStorage | null {
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

  return null;
}

export function isPersistStorageAvailable() {
  return getBrowserStorage() !== null;
}

/**
 * Resolved lazily on every call so that suspending writes, or storage becoming
 * available later in the page lifecycle, is picked up without recreating the
 * store.
 */
export function getPersistStorage(): KeyValueStorage {
  return {
    getItem: (name) => {
      const storage = getBrowserStorage();
      if (!storage) {
        return null;
      }

      try {
        return storage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      if (!writesEnabled) {
        return;
      }

      const storage = getBrowserStorage();
      if (!storage) {
        return;
      }

      try {
        storage.setItem(name, value);
      } catch (error) {
        // Most commonly QuotaExceededError from large image items. Dropping the
        // write keeps the in-memory board usable instead of crashing the store.
        if (!hasWarnedAboutQuota) {
          hasWarnedAboutQuota = true;
          console.warn('Unable to persist tier list state to localStorage.', error);
        }
      }
    },
    removeItem: (name) => {
      if (!writesEnabled) {
        return;
      }

      const storage = getBrowserStorage();
      if (!storage) {
        return;
      }

      try {
        storage.removeItem(name);
      } catch {
        // Ignore — removal is always best effort.
      }
    },
  };
}

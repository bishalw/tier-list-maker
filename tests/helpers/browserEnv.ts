/**
 * Installs a minimal browser environment before any store module is imported.
 *
 * Import this FIRST in a test file. The stores read `window.localStorage`, and
 * a rehydration test that runs without it silently exercises nothing.
 */

class MemoryStorage {
  private data = new Map<string, string>();

  getItem(key: string) {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.data.set(key, value);
  }

  removeItem(key: string) {
    this.data.delete(key);
  }

  clear() {
    this.data.clear();
  }

  get size() {
    return this.data.size;
  }
}

export const memoryStorage = new MemoryStorage();

Object.assign(globalThis, {
  localStorage: memoryStorage,
  window: { localStorage: memoryStorage },
});

/** Writes a zustand-persist envelope directly, as a previous session would have. */
export function seedPersistedState(key: string, state: unknown, version = 1) {
  memoryStorage.setItem(key, JSON.stringify({ state, version }));
}

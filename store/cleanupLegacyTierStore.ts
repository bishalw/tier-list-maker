'use client';

import { getPersistStorage } from './persistStorage';

const LEGACY_STORAGE_KEY = 'tier-list-storage';
const CLEANUP_SENTINEL_KEY = 'tier-list-store-split-cleaned';

/**
 * Removes the pre-split combined store entry, once.
 *
 * Runs through the shared storage helper so that blocked or unavailable
 * localStorage cannot throw here — this is called during mount, and an
 * exception used to leave the screen stuck on its loading state.
 */
export function cleanupLegacyTierStoreStorage() {
  const storage = getPersistStorage();

  if (storage.getItem(CLEANUP_SENTINEL_KEY)) {
    return;
  }

  storage.removeItem(LEGACY_STORAGE_KEY);
  storage.setItem(CLEANUP_SENTINEL_KEY, '1');
}

export { CLEANUP_SENTINEL_KEY, LEGACY_STORAGE_KEY };

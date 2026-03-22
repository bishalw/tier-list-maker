'use client';

const LEGACY_STORAGE_KEY = 'tier-list-storage';
const CLEANUP_SENTINEL_KEY = 'tier-list-store-split-cleaned';

export function cleanupLegacyTierStoreStorage() {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.localStorage.getItem(CLEANUP_SENTINEL_KEY)) {
    return;
  }

  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  window.localStorage.setItem(CLEANUP_SENTINEL_KEY, '1');
}

export { CLEANUP_SENTINEL_KEY, LEGACY_STORAGE_KEY };

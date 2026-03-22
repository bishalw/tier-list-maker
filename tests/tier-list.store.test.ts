import test from 'node:test';
import assert from 'node:assert/strict';
import { hydrateBoardState } from '../store/hydrateBoardState';
import { cleanupLegacyTierStoreStorage } from '../store/cleanupLegacyTierStore';
import { useBoardStore } from '../store/useBoardStore';
import { usePrefsStore } from '../store/usePrefsStore';

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
}

const localStorage = new MemoryStorage();

Object.assign(globalThis, {
  localStorage,
  window: { localStorage },
});

function resetStores() {
  const temporal = useBoardStore.temporal.getState();
  temporal.pause();
  useBoardStore.setState({
    tiers: [
      { id: 's', label: 'S', color: '#ff0000' },
      { id: 'a', label: 'A', color: '#ffaa00' },
    ],
    items: [],
  });
  usePrefsStore.setState({
    theme: 'modern',
    boardBackground: 'theme-default',
    itemSize: 'medium',
    imageFit: 'cover',
  });
  temporal.clear();
  temporal.resume();
}

test.beforeEach(() => {
  localStorage.clear();
  resetStores();
});

test('board store resetTiers(theme) uses the passed theme palette', () => {
  useBoardStore.getState().resetTiers('luxury');

  const tiers = useBoardStore.getState().tiers;
  assert.equal(tiers[0]?.color, '#d4af37');
  assert.equal(tiers.length, 5);
});

test('board store applyTemplate returns items to the pool', () => {
  useBoardStore.setState({
    items: [{ id: 'item-1', content: 'Mario', type: 'text', tierId: 's' }],
  });

  useBoardStore.getState().applyTemplate([{ id: 'x', label: 'X', color: '#111111' }]);

  assert.deepEqual(useBoardStore.getState().tiers, [{ id: 'x', label: 'X', color: '#111111' }]);
  assert.equal(useBoardStore.getState().items[0]?.tierId, null);
});

test('prefs changes are not tracked in board undo history', () => {
  usePrefsStore.getState().setTheme('brutalist');
  useBoardStore.getState().addItems([{ id: 'item-1', content: 'Mario', type: 'text', tierId: null }]);

  const temporal = useBoardStore.temporal.getState();
  assert.equal(temporal.pastStates.length, 1);

  temporal.undo();
  assert.equal(useBoardStore.getState().items.length, 0);
  assert.equal(usePrefsStore.getState().theme, 'brutalist');
});

test('hydrateBoardState replaces both stores and clears undo history', () => {
  useBoardStore.getState().addItems([{ id: 'item-1', content: 'Mario', type: 'text', tierId: null }]);
  assert.equal(useBoardStore.temporal.getState().pastStates.length, 1);

  hydrateBoardState({
    tiers: [{ id: 'z', label: 'Z', color: '#123456' }],
    items: [{ id: 'item-2', content: 'Luigi', type: 'text', tierId: 'z' }],
    theme: 'luxury',
    boardBackground: '#000000',
    itemSize: 'large',
    imageFit: 'contain',
  });

  assert.equal(useBoardStore.temporal.getState().pastStates.length, 0);
  assert.deepEqual(useBoardStore.getState().tiers, [{ id: 'z', label: 'Z', color: '#123456' }]);
  assert.equal(usePrefsStore.getState().theme, 'luxury');
  assert.equal(usePrefsStore.getState().imageFit, 'contain');
});

test('legacy tier store cleanup removes the old key once', () => {
  localStorage.setItem('tier-list-storage', 'legacy');

  cleanupLegacyTierStoreStorage();

  assert.equal(localStorage.getItem('tier-list-storage'), null);
  assert.equal(localStorage.getItem('tier-list-store-split-cleaned'), '1');

  localStorage.setItem('tier-list-storage', 'should-stay');
  cleanupLegacyTierStoreStorage();
  assert.equal(localStorage.getItem('tier-list-storage'), 'should-stay');
});

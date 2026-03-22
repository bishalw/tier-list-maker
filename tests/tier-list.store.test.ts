import test from 'node:test';
import assert from 'node:assert/strict';
import { hydrateBoardState } from '../store/hydrateBoardState';
import { cleanupLegacyTierStoreStorage } from '../store/cleanupLegacyTierStore';
import { boardStore } from '../store/useBoardStore';
import { prefsStore } from '../store/usePrefsStore';

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
  const temporal = boardStore.temporal.getState();
  temporal.pause();
  boardStore.setState({
    tiers: [
      { id: 's', label: 'S', color: '#ff0000' },
      { id: 'a', label: 'A', color: '#ffaa00' },
    ],
    items: [],
  });
  prefsStore.setState({
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

test('board store exposes a defined initial snapshot for React subscriptions', () => {
  const initialState = boardStore.getInitialState();

  assert.ok(initialState);
  assert.ok(Array.isArray(initialState.tiers));
  assert.ok(Array.isArray(initialState.items));
  assert.ok(boardStore.temporal.getState());
});

test('board store resetTiers(theme) uses the passed theme palette', () => {
  boardStore.getState().resetTiers('luxury');

  const tiers = boardStore.getState().tiers;
  assert.equal(tiers[0]?.color, '#d4af37');
  assert.equal(tiers.length, 5);
});

test('board store applyTemplate returns items to the pool', () => {
  boardStore.setState({
    items: [{ id: 'item-1', content: 'Mario', type: 'text', tierId: 's' }],
  });

  boardStore.getState().applyTemplate([{ id: 'x', label: 'X', color: '#111111' }]);

  assert.deepEqual(boardStore.getState().tiers, [{ id: 'x', label: 'X', color: '#111111' }]);
  assert.equal(boardStore.getState().items[0]?.tierId, null);
});

test('prefs changes are not tracked in board undo history', () => {
  prefsStore.getState().setTheme('brutalist');
  boardStore.getState().addItems([{ id: 'item-1', content: 'Mario', type: 'text', tierId: null }]);

  const temporal = boardStore.temporal.getState();
  assert.equal(temporal.pastStates.length, 1);

  temporal.undo();
  assert.equal(boardStore.getState().items.length, 0);
  assert.equal(prefsStore.getState().theme, 'brutalist');
});

test('undo removes individually added items one at a time', () => {
  boardStore.getState().addItem({ id: 'item-1', content: 'Mario', type: 'text', tierId: null });
  boardStore.getState().addItem({ id: 'item-2', content: 'Luigi', type: 'text', tierId: null });
  boardStore.getState().addItem({ id: 'item-3', content: 'Peach', type: 'text', tierId: null });

  const temporal = boardStore.temporal.getState();
  assert.equal(temporal.pastStates.length, 3);
  assert.equal(boardStore.getState().items.length, 3);

  temporal.undo();
  assert.deepEqual(
    boardStore.getState().items.map((item) => item.id),
    ['item-1', 'item-2']
  );

  temporal.undo();
  assert.deepEqual(
    boardStore.getState().items.map((item) => item.id),
    ['item-1']
  );

  temporal.undo();
  assert.equal(boardStore.getState().items.length, 0);
});

test('undo reverts item moves one drag at a time', () => {
  boardStore.setState({
    items: [
      { id: 'item-1', content: 'Mario', type: 'text', tierId: null },
      { id: 'item-2', content: 'Luigi', type: 'text', tierId: null },
      { id: 'item-3', content: 'Peach', type: 'text', tierId: null },
    ],
  });
  boardStore.temporal.getState().clear();

  boardStore.getState().moveItem(null, 's', 0, 0);
  boardStore.getState().moveItem(null, 'a', 0, 0);
  boardStore.getState().moveItem(null, 's', 0, 1);

  const temporal = boardStore.temporal.getState();
  assert.equal(temporal.pastStates.length, 3);

  temporal.undo();
  assert.deepEqual(
    boardStore.getState().items.map((item) => [item.id, item.tierId]),
    [
      ['item-3', null],
      ['item-1', 's'],
      ['item-2', 'a'],
    ]
  );

  temporal.undo();
  assert.deepEqual(
    boardStore.getState().items.map((item) => [item.id, item.tierId]),
    [
      ['item-2', null],
      ['item-3', null],
      ['item-1', 's'],
    ]
  );
});

test('hydrateBoardState replaces both stores and clears undo history', () => {
  boardStore.getState().addItems([{ id: 'item-1', content: 'Mario', type: 'text', tierId: null }]);
  assert.equal(boardStore.temporal.getState().pastStates.length, 1);

  hydrateBoardState({
    tiers: [{ id: 'z', label: 'Z', color: '#123456' }],
    items: [{ id: 'item-2', content: 'Luigi', type: 'text', tierId: 'z' }],
    theme: 'luxury',
    boardBackground: '#000000',
    itemSize: 'large',
    imageFit: 'contain',
  });

  assert.equal(boardStore.temporal.getState().pastStates.length, 0);
  assert.deepEqual(boardStore.getState().tiers, [{ id: 'z', label: 'Z', color: '#123456' }]);
  assert.equal(prefsStore.getState().theme, 'luxury');
  assert.equal(prefsStore.getState().imageFit, 'contain');
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

test('board store ignores malformed persisted board state', async () => {
  const boardStorageKey = 'tier-list-board-storage';
  const expectedState = boardStore.getState();

  localStorage.setItem(
    boardStorageKey,
    JSON.stringify({
      state: {
        tiers: 'broken',
        items: null,
      },
      version: 0,
    })
  );

  const { boardStore: freshBoardStore } = await import(
    `../store/useBoardStore.ts?malformed-persist=${Date.now()}`
  );

  const state = freshBoardStore.getState();
  assert.ok(Array.isArray(state.tiers));
  assert.ok(Array.isArray(state.items));
  assert.deepEqual(state.tiers, expectedState.tiers);
  assert.deepEqual(state.items, expectedState.items);
});

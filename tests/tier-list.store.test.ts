import './helpers/browserEnv';

import test from 'node:test';
import assert from 'node:assert/strict';
import { memoryStorage, seedPersistedState } from './helpers/browserEnv';
import { hydrateBoardState } from '../store/hydrateBoardState';
import { cleanupLegacyTierStoreStorage } from '../store/cleanupLegacyTierStore';
import { BOARD_STORAGE_KEY, boardStore, UNDO_HISTORY_LIMIT } from '../store/useBoardStore';
import { prefsStore } from '../store/usePrefsStore';
import { setPersistWritesEnabled } from '../store/persistStorage';
import { MAX_ITEMS, MAX_TIERS } from '../constants/board';
import { TIER_TEMPLATES } from '../constants/templates';

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
  memoryStorage.clear();
  setPersistWritesEnabled(true);
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

test('resetTiers returns items whose tier the new palette does not define', () => {
  boardStore.getState().applyTemplate(TIER_TEMPLATES.TEN_POINT.tiers);
  boardStore.getState().addItem({ id: 'item-1', content: 'Halo', type: 'text', tierId: null });
  boardStore.getState().assignItemToTier('item-1', '10');
  assert.equal(boardStore.getState().items[0]?.tierId, '10');

  boardStore.getState().resetTiers('modern');

  const { tiers, items } = boardStore.getState();
  const tierIds = new Set(tiers.map((tier) => tier.id));
  assert.ok(!tierIds.has('10'));
  // The item is back in the pool rather than orphaned and invisible.
  assert.equal(items[0]?.tierId, null);
});

test('board store applyTemplate returns items to the pool', () => {
  boardStore.setState({
    items: [{ id: 'item-1', content: 'Mario', type: 'text', tierId: 's' }],
  });

  boardStore.getState().applyTemplate([{ id: 'x', label: 'X', color: '#111111' }]);

  assert.deepEqual(boardStore.getState().tiers, [{ id: 'x', label: 'X', color: '#111111' }]);
  assert.equal(boardStore.getState().items[0]?.tierId, null);
});

test('applyTemplate drops duplicate tiers from the template', () => {
  boardStore.getState().applyTemplate([
    { id: 'x', label: 'X', color: '#111111' },
    { id: 'x', label: 'X duplicate', color: '#222222' },
  ]);

  assert.equal(boardStore.getState().tiers.length, 1);
});

test('deleteTier keeps the last tier so the board stays saveable', () => {
  boardStore.getState().deleteTier('a');
  assert.equal(boardStore.getState().tiers.length, 1);

  boardStore.getState().deleteTier('s');
  assert.equal(boardStore.getState().tiers.length, 1);
});

test('deleteTier returns that tier\'s items to the pool', () => {
  boardStore.setState({
    items: [{ id: 'item-1', content: 'Mario', type: 'text', tierId: 'a' }],
  });

  boardStore.getState().deleteTier('a');

  assert.equal(boardStore.getState().items[0]?.tierId, null);
});

test('addTier produces unique ids even when called in the same millisecond', () => {
  boardStore.getState().addTier();
  boardStore.getState().addTier();
  boardStore.getState().addTier();

  const ids = boardStore.getState().tiers.map((tier) => tier.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('addTier stops at the tier cap', () => {
  for (let index = 0; index < MAX_TIERS + 5; index += 1) {
    boardStore.getState().addTier();
  }

  assert.equal(boardStore.getState().tiers.length, MAX_TIERS);
});

test('updateTier cannot rewrite the tier id or store an empty label', () => {
  boardStore.setState({
    items: [{ id: 'item-1', content: 'Mario', type: 'text', tierId: 's' }],
  });

  boardStore.getState().updateTier('s', { id: 'renamed', label: '   ' } as never);

  const { tiers, items } = boardStore.getState();
  assert.equal(tiers[0]?.id, 's');
  assert.equal(tiers[0]?.label, 'NEW');
  assert.equal(items[0]?.tierId, 's');
});

test('addItem rejects malformed items and de-duplicates ids', () => {
  boardStore.getState().addItem({ id: 'item-1', content: 'Mario', type: 'text', tierId: null });
  boardStore.getState().addItem({ id: 'item-1', content: 'Luigi', type: 'text', tierId: null });
  boardStore.getState().addItem({ id: '', content: 'Broken', type: 'text', tierId: null });

  const ids = boardStore.getState().items.map((item) => item.id);
  assert.equal(ids.length, 2);
  assert.equal(new Set(ids).size, 2);
});

test('addItems stops at the item cap', () => {
  boardStore.getState().addItems(
    Array.from({ length: MAX_ITEMS + 20 }, (_, index) => ({
      id: `item-${index}`,
      content: `Item ${index}`,
      type: 'text' as const,
      tierId: null,
    }))
  );

  assert.equal(boardStore.getState().items.length, MAX_ITEMS);
});

test('assignItemToTier moves the item to the end of the target tier', () => {
  boardStore.setState({
    items: [
      { id: 'item-1', content: 'Mario', type: 'text', tierId: null },
      { id: 'item-2', content: 'Luigi', type: 'text', tierId: 's' },
      { id: 'item-3', content: 'Peach', type: 'text', tierId: 's' },
    ],
  });

  boardStore.getState().assignItemToTier('item-1', 's');

  assert.deepEqual(
    boardStore.getState().items.map((item) => item.id),
    ['item-2', 'item-3', 'item-1']
  );
});

test('assignItemToTier ignores tiers that do not exist', () => {
  boardStore.setState({
    items: [{ id: 'item-1', content: 'Mario', type: 'text', tierId: null }],
  });

  boardStore.getState().assignItemToTier('item-1', 'ghost');

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

test('undo history is bounded', () => {
  for (let index = 0; index < UNDO_HISTORY_LIMIT + 25; index += 1) {
    boardStore.getState().addItem({
      id: `item-${index}`,
      content: `Item ${index}`,
      type: 'text',
      tierId: null,
    });
  }

  assert.equal(boardStore.temporal.getState().pastStates.length, UNDO_HISTORY_LIMIT);
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

test('hydrateBoardState repairs a board that violates the invariants', () => {
  hydrateBoardState({
    tiers: [{ id: 'z', label: 'Z', color: '#123456' }],
    items: [{ id: 'item-2', content: 'Luigi', type: 'text', tierId: 'missing' }],
    theme: 'modern',
    boardBackground: 'theme-default',
    itemSize: 'medium',
    imageFit: 'cover',
  });

  assert.equal(boardStore.getState().items[0]?.tierId, null);
});

test('legacy tier store cleanup removes the old key once', () => {
  memoryStorage.setItem('tier-list-storage', 'legacy');

  cleanupLegacyTierStoreStorage();

  assert.equal(memoryStorage.getItem('tier-list-storage'), null);
  assert.equal(memoryStorage.getItem('tier-list-store-split-cleaned'), '1');

  memoryStorage.setItem('tier-list-storage', 'should-stay');
  cleanupLegacyTierStoreStorage();
  assert.equal(memoryStorage.getItem('tier-list-storage'), 'should-stay');
});

test('rehydrate repairs a persisted board that breaks the invariants', async () => {
  seedPersistedState(BOARD_STORAGE_KEY, {
    tiers: [
      { id: 'x', label: 'X', color: '#111111' },
      { id: 'x', label: 'X duplicate', color: '#222222' },
    ],
    items: [
      { id: 'item-1', content: 'Mario', type: 'text', tierId: 'gone' },
      { id: 'item-1', content: 'Mario duplicate', type: 'text', tierId: 'x' },
      { id: 'item-2', content: 'Luigi', type: 'text', tierId: 'x' },
      'not an item',
    ],
  });

  await boardStore.persist.rehydrate();

  const { tiers, items } = boardStore.getState();
  assert.deepEqual(
    tiers.map((tier) => tier.id),
    ['x']
  );
  assert.deepEqual(
    items.map((item) => [item.id, item.tierId]),
    [
      ['item-1', null],
      ['item-2', 'x'],
    ]
  );
});

test('rehydrate salvages the valid items instead of dropping the whole board', async () => {
  seedPersistedState(BOARD_STORAGE_KEY, {
    tiers: [{ id: 'x', label: 'X', color: '#111111' }],
    items: [
      { id: 'item-1', content: 'Mario', type: 'text', tierId: 'x' },
      { id: 'item-2', content: 'Broken', type: 'video', tierId: null },
    ],
  });

  await boardStore.persist.rehydrate();

  assert.deepEqual(
    boardStore.getState().items.map((item) => item.id),
    ['item-1']
  );
});

test('rehydrate falls back to a usable palette when the persisted tiers are unusable', async () => {
  seedPersistedState(BOARD_STORAGE_KEY, { tiers: [], items: [] });

  await boardStore.persist.rehydrate();

  assert.ok(boardStore.getState().tiers.length >= 1);
});

test('suspending persistence stops the board from overwriting storage', () => {
  boardStore.getState().addItem({ id: 'item-1', content: 'Mario', type: 'text', tierId: null });
  const savedDraft = memoryStorage.getItem(BOARD_STORAGE_KEY);
  assert.ok(savedDraft?.includes('Mario'));

  setPersistWritesEnabled(false);
  boardStore.getState().addItem({ id: 'item-2', content: 'Luigi', type: 'text', tierId: null });

  assert.equal(memoryStorage.getItem(BOARD_STORAGE_KEY), savedDraft);
});

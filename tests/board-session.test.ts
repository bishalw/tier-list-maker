import './helpers/browserEnv';

import test from 'node:test';
import assert from 'node:assert/strict';
import { memoryStorage } from './helpers/browserEnv';
import {
  enterRemoteBoardSession,
  getBoardSession,
  restoreDraftBoardSession,
} from '../store/boardSession';
import { BOARD_STORAGE_KEY, boardStore } from '../store/useBoardStore';
import { prefsStore } from '../store/usePrefsStore';
import { setPersistWritesEnabled } from '../store/persistStorage';
import type { TierBoardState } from '../types';

const SHARED_LIST: TierBoardState = {
  tiers: [{ id: 'z', label: 'Z', color: '#123456' }],
  items: [{ id: 'shared-1', content: 'Someone else', type: 'text', tierId: 'z' }],
  theme: 'luxury',
  boardBackground: '#000000',
  itemSize: 'large',
  imageFit: 'contain',
};

async function startFromCleanDraft() {
  await restoreDraftBoardSession();
  memoryStorage.clear();
  setPersistWritesEnabled(true);
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
  boardStore.temporal.getState().clear();
}

test.beforeEach(startFromCleanDraft);
test.after(startFromCleanDraft);

test('opening a shared list does not overwrite the persisted draft', async () => {
  boardStore.getState().addItem({ id: 'draft-1', content: 'My work', type: 'text', tierId: null });
  const persistedDraft = memoryStorage.getItem(BOARD_STORAGE_KEY);
  assert.ok(persistedDraft?.includes('My work'));

  enterRemoteBoardSession('list-1', SHARED_LIST);
  assert.deepEqual(getBoardSession(), { kind: 'remote', listId: 'list-1' });
  assert.equal(boardStore.getState().items[0]?.id, 'shared-1');

  // Editing the shared list must not reach the draft's storage entry either.
  boardStore.getState().addItem({ id: 'mine-1', content: 'My remix', type: 'text', tierId: null });

  assert.equal(memoryStorage.getItem(BOARD_STORAGE_KEY), persistedDraft);
});

test('leaving a shared list restores the visitor\'s own board', async () => {
  boardStore.getState().addItem({ id: 'draft-1', content: 'My work', type: 'text', tierId: null });
  prefsStore.getState().setTheme('brutalist');

  enterRemoteBoardSession('list-1', SHARED_LIST);
  assert.equal(prefsStore.getState().theme, 'luxury');

  await restoreDraftBoardSession();

  assert.deepEqual(getBoardSession(), { kind: 'draft' });
  assert.deepEqual(
    boardStore.getState().items.map((item) => item.id),
    ['draft-1']
  );
  assert.equal(prefsStore.getState().theme, 'brutalist');
});

test('leaving a shared list with no saved draft returns an empty board', async () => {
  enterRemoteBoardSession('list-1', SHARED_LIST);
  assert.equal(boardStore.getState().items.length, 1);

  await restoreDraftBoardSession();

  assert.equal(boardStore.getState().items.length, 0);
  assert.equal(prefsStore.getState().theme, 'modern');
});

test('starting a remix is not undoable back into the creator\'s rankings', () => {
  enterRemoteBoardSession('list-1', SHARED_LIST, { returnItemsToPool: true });

  assert.deepEqual(
    boardStore.getState().items.map((item) => item.tierId),
    [null],
    'the remix board starts empty'
  );

  // Emptying the tiers is part of loading a remix, not an edit the remixer
  // made. If it lands in the undo stack, one undo files the creator's own
  // ranking as the remixer's submission.
  assert.equal(boardStore.temporal.getState().pastStates.length, 0);

  boardStore.temporal.getState().undo();
  assert.deepEqual(
    boardStore.getState().items.map((item) => item.tierId),
    [null]
  );
});

test('undo during a shared-list session cannot reach the persisted draft', () => {
  boardStore.getState().addItem({ id: 'draft-1', content: 'My work', type: 'text', tierId: null });
  const persistedDraft = memoryStorage.getItem(BOARD_STORAGE_KEY);

  enterRemoteBoardSession('list-1', SHARED_LIST);
  boardStore.getState().addItem({ id: 'edit-1', content: 'Edit', type: 'text', tierId: null });
  boardStore.temporal.getState().undo();
  boardStore.temporal.getState().redo();

  assert.equal(memoryStorage.getItem(BOARD_STORAGE_KEY), persistedDraft);
});

test('redo cannot pull a previous board into a newly loaded list', () => {
  boardStore.getState().addItem({ id: 'draft-1', content: 'My work', type: 'text', tierId: null });
  boardStore.temporal.getState().undo();
  assert.equal(boardStore.temporal.getState().futureStates.length, 1);

  enterRemoteBoardSession('list-1', SHARED_LIST);

  assert.equal(boardStore.temporal.getState().futureStates.length, 0);
  boardStore.temporal.getState().redo();
  assert.deepEqual(
    boardStore.getState().items.map((item) => item.id),
    ['shared-1']
  );
});

test('a shared list is not undoable back into the visitor\'s board', () => {
  boardStore.getState().addItem({ id: 'draft-1', content: 'My work', type: 'text', tierId: null });

  enterRemoteBoardSession('list-1', SHARED_LIST);

  assert.equal(boardStore.temporal.getState().pastStates.length, 0);
});

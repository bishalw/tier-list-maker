import test from 'node:test';
import assert from 'node:assert/strict';
import { THEME_DEFAULT_BOARD_BACKGROUND } from '../constants/theme';
import {
  mapBoardStateToCreateInput,
  mapBoardStateToUpdateInput,
  mapSearchParamsToRouteState,
  mapTierListRowToRecord,
} from '../features/tier-list/mappers';
import type { TierListRow } from '../features/tier-list/types';
import type { TierBoardState } from '../types';

function buildRow(overrides: Partial<TierListRow> = {}): TierListRow {
  return {
    id: 'list-1',
    owner_id: 'user-1',
    title: 'My Tier List',
    description: '',
    is_public: true,
    tiers: [{ id: 's', label: 'S', color: '#ff0000' }],
    items: [{ id: 'item-1', content: 'Mario', type: 'text', tierId: null }],
    theme: 'modern',
    board_background: 'transparent',
    item_size: 'medium',
    image_fit: 'cover',
    remix_count: 2,
    view_count: 5,
    created_at: '2026-03-16T00:00:00Z',
    updated_at: '2026-03-16T00:00:00Z',
    ...overrides,
  };
}

const BOARD_STATE: TierBoardState = {
  tiers: [{ id: 's', label: 'S', color: '#ff0000' }],
  items: [{ id: 'item-1', content: 'Mario', type: 'text', tierId: 's' }],
  theme: 'modern',
  boardBackground: THEME_DEFAULT_BOARD_BACKGROUND,
  itemSize: 'medium',
  imageFit: 'cover',
};

test('mapSearchParamsToRouteState derives target list from list param', () => {
  const params = new URLSearchParams('?list=list-123&compare=remix-9');
  const routeState = mapSearchParamsToRouteState(params);

  assert.equal(routeState.listId, 'list-123');
  assert.equal(routeState.compareId, 'remix-9');
  assert.equal(routeState.targetListId, 'list-123');
});

test('mapSearchParamsToRouteState falls back to remixing target', () => {
  const params = new URLSearchParams('?remixing=list-555');
  const routeState = mapSearchParamsToRouteState(params);

  assert.equal(routeState.remixingId, 'list-555');
  assert.equal(routeState.targetListId, 'list-555');
});

test('mapSearchParamsToRouteState resolves unusable params to no selection', () => {
  const params = new URLSearchParams(`?list=${'x'.repeat(500)}`);
  const routeState = mapSearchParamsToRouteState(params);

  assert.deepEqual(routeState, {
    listId: null,
    remixingId: null,
    compareId: null,
    targetListId: null,
  });
});

test('mapTierListRowToRecord maps db shape to board state shape', () => {
  const record = mapTierListRowToRecord(buildRow());

  assert.equal(record.ownerId, 'user-1');
  assert.equal(record.boardState.boardBackground, THEME_DEFAULT_BOARD_BACKGROUND);
  assert.equal(record.remixCount, 2);
  assert.equal(record.viewCount, 5);
  assert.equal(record.isPublic, true);
});

test('mapTierListRowToRecord repairs a stored board that breaks the invariants', () => {
  const record = mapTierListRowToRecord(
    buildRow({
      items: [
        { id: 'item-1', content: 'Mario', type: 'text', tierId: 'deleted-tier' },
        { id: 'item-2', content: 'Luigi', type: 'text', tierId: 's' },
      ],
    })
  );

  assert.deepEqual(
    record.boardState.items.map((item) => [item.id, item.tierId]),
    [
      ['item-1', null],
      ['item-2', 's'],
    ]
  );
});

test('mapBoardStateToCreateInput applies the title and defaults', () => {
  const input = mapBoardStateToCreateInput(BOARD_STATE, { title: 'Best pizza' });

  assert.equal(input.title, 'Best pizza');
  assert.equal(input.description, '');
  assert.equal(input.isPublic, true);
});

test('mapBoardStateToUpdateInput carries the concurrency token', () => {
  const input = mapBoardStateToUpdateInput('list-1', BOARD_STATE, {
    title: 'Best pizza',
    expectedUpdatedAt: '2026-03-16T00:00:00Z',
  });

  assert.equal(input.id, 'list-1');
  assert.equal(input.expectedUpdatedAt, '2026-03-16T00:00:00Z');
});

test('save inputs repair an invalid board instead of failing validation', () => {
  const brokenBoard: TierBoardState = {
    ...BOARD_STATE,
    tiers: [],
    items: [{ id: 'item-1', content: 'Mario', type: 'text', tierId: 'gone' }],
  };

  const input = mapBoardStateToCreateInput(brokenBoard);

  assert.ok(input.boardState.tiers.length >= 1);
  assert.equal(input.boardState.items[0].tierId, null);
});

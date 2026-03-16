import test from 'node:test';
import assert from 'node:assert/strict';
import { THEME_DEFAULT_BOARD_BACKGROUND } from '../constants/theme';
import { mapSearchParamsToRouteState, mapTierListRowToRecord } from '../features/tier-list/mappers';

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

test('mapTierListRowToRecord maps db shape to board state shape', () => {
  const record = mapTierListRowToRecord({
    id: 'list-1',
    owner_id: 'user-1',
    title: 'My Tier List',
    description: '',
    tiers: [{ id: 's', label: 'S', color: '#ff0000' }],
    items: [{ id: 'item-1', content: 'Mario', type: 'text', tierId: null }],
    theme: 'modern',
    board_background: 'transparent',
    item_size: 'medium',
    image_fit: 'cover',
    remix_count: 2,
    created_at: '2026-03-16T00:00:00Z',
    updated_at: '2026-03-16T00:00:00Z',
  });

  assert.equal(record.ownerId, 'user-1');
  assert.equal(record.boardState.boardBackground, THEME_DEFAULT_BOARD_BACKGROUND);
  assert.equal(record.remixCount, 2);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { THEME_DEFAULT_BOARD_BACKGROUND } from '../constants/theme';
import { MAX_TEXT_ITEM_CONTENT_LENGTH, MAX_TIERS } from '../constants/board';
import {
  createTierListInputSchema,
  submitRemixInputSchema,
  tierBoardStateSchema,
  updateTierListInputSchema,
} from '../features/tier-list/schemas';

function boardState(overrides: Record<string, unknown> = {}) {
  return {
    tiers: [{ id: 's', label: 'S', color: '#fff000' }],
    items: [{ id: 'item-1', content: 'Mario', type: 'text', tierId: null }],
    theme: 'modern',
    boardBackground: THEME_DEFAULT_BOARD_BACKGROUND,
    itemSize: 'medium',
    imageFit: 'cover',
    ...overrides,
  };
}

test('tier board schema accepts valid board state', () => {
  const parsed = tierBoardStateSchema.parse(boardState());

  assert.equal(parsed.theme, 'modern');
  assert.equal(parsed.tiers.length, 1);
});

test('create tier list schema rejects invalid theme', () => {
  assert.throws(() => {
    createTierListInputSchema.parse({ boardState: boardState({ theme: 'space' }) });
  });
});

test('submit remix schema rejects malformed items', () => {
  assert.throws(() => {
    submitRemixInputSchema.parse({
      tierListId: 'list-1',
      items: [{ id: 'item-1', content: 'Mario', type: 'video', tierId: null }],
    });
  });
});

test('tier board schema rejects a board with no tiers', () => {
  assert.throws(() => tierBoardStateSchema.parse(boardState({ tiers: [] })));
});

test('tier board schema rejects an item assigned to an unknown tier', () => {
  assert.throws(() =>
    tierBoardStateSchema.parse(
      boardState({ items: [{ id: 'item-1', content: 'Mario', type: 'text', tierId: 'ghost' }] })
    )
  );
});

test('tier board schema rejects duplicate tier ids', () => {
  assert.throws(() =>
    tierBoardStateSchema.parse(
      boardState({
        tiers: [
          { id: 's', label: 'S', color: '#fff000' },
          { id: 's', label: 'S again', color: '#00ff00' },
        ],
      })
    )
  );
});

test('tier board schema rejects duplicate item ids', () => {
  assert.throws(() =>
    tierBoardStateSchema.parse(
      boardState({
        items: [
          { id: 'item-1', content: 'Mario', type: 'text', tierId: null },
          { id: 'item-1', content: 'Luigi', type: 'text', tierId: null },
        ],
      })
    )
  );
});

test('tier board schema rejects more tiers than the board allows', () => {
  const tiers = Array.from({ length: MAX_TIERS + 1 }, (_, index) => ({
    id: `t${index}`,
    label: `T${index}`,
    color: '#ffffff',
  }));

  assert.throws(() => tierBoardStateSchema.parse(boardState({ tiers, items: [] })));
});

test('tier board schema rejects oversized text content', () => {
  assert.throws(() =>
    tierBoardStateSchema.parse(
      boardState({
        items: [
          {
            id: 'item-1',
            content: 'x'.repeat(MAX_TEXT_ITEM_CONTENT_LENGTH + 1),
            type: 'text',
            tierId: null,
          },
        ],
      })
    )
  );
});

test('update input accepts an optional concurrency token', () => {
  const parsed = updateTierListInputSchema.parse({
    id: 'list-1',
    boardState: boardState(),
    expectedUpdatedAt: '2026-03-16T00:00:00Z',
  });

  assert.equal(parsed.expectedUpdatedAt, '2026-03-16T00:00:00Z');
});

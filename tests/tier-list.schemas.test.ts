import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTierListInputSchema,
  submitRemixInputSchema,
  tierBoardStateSchema,
} from '../features/tier-list/schemas';

test('tier board schema accepts valid board state', () => {
  const parsed = tierBoardStateSchema.parse({
    tiers: [{ id: 's', label: 'S', color: '#fff000' }],
    items: [{ id: 'item-1', content: 'Mario', type: 'text', tierId: null }],
    theme: 'modern',
    boardBackground: 'transparent',
    itemSize: 'medium',
    imageFit: 'cover',
  });

  assert.equal(parsed.theme, 'modern');
  assert.equal(parsed.tiers.length, 1);
});

test('create tier list schema rejects invalid theme', () => {
  assert.throws(() => {
    createTierListInputSchema.parse({
      boardState: {
        tiers: [{ id: 's', label: 'S', color: '#fff000' }],
        items: [],
        theme: 'space',
        boardBackground: 'transparent',
        itemSize: 'medium',
        imageFit: 'cover',
      },
    });
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

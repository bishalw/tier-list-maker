import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isReconciledBoardSnapshot,
  reconcileBoardSnapshot,
  sanitizeItem,
  sanitizeTier,
} from '../store/boardInvariants';
import {
  MAX_IMAGE_ITEM_CONTENT_LENGTH,
  MAX_ITEMS,
  MAX_TEXT_ITEM_CONTENT_LENGTH,
  MAX_TIERS,
} from '../constants/board';

const TIERS = [
  { id: 's', label: 'S', color: '#ff0000' },
  { id: 'a', label: 'A', color: '#ffaa00' },
];

test('reconcile leaves an already valid board untouched', () => {
  const items = [{ id: 'i1', content: 'Mario', type: 'text' as const, tierId: 's' }];
  const result = reconcileBoardSnapshot({ tiers: TIERS, items });

  assert.equal(result.changed, false);
  assert.equal(result.tiers, TIERS);
  assert.equal(result.items, items);
});

test('reconcile pools items pointing at a tier that no longer exists', () => {
  const result = reconcileBoardSnapshot({
    tiers: TIERS,
    items: [
      { id: 'i1', content: 'Mario', type: 'text', tierId: 'deleted-tier' },
      { id: 'i2', content: 'Luigi', type: 'text', tierId: 'a' },
    ],
  });

  assert.equal(result.changed, true);
  assert.equal(result.items[0].tierId, null);
  assert.equal(result.items[1].tierId, 'a');
});

test('reconcile drops duplicate tier and item ids', () => {
  const result = reconcileBoardSnapshot({
    tiers: [...TIERS, { id: 's', label: 'S again', color: '#00ff00' }],
    items: [
      { id: 'i1', content: 'Mario', type: 'text', tierId: 's' },
      { id: 'i1', content: 'Mario again', type: 'text', tierId: 'a' },
    ],
  });

  assert.equal(result.changed, true);
  assert.deepEqual(
    result.tiers.map((tier) => tier.id),
    ['s', 'a']
  );
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].content, 'Mario');
});

test('reconcile falls back to a usable palette when every tier is invalid', () => {
  const result = reconcileBoardSnapshot({ tiers: [], items: [] });

  assert.equal(result.changed, true);
  assert.ok(result.tiers.length >= 1);
});

test('reconcile uses the supplied fallback tiers when asked', () => {
  const result = reconcileBoardSnapshot({ tiers: 'nonsense', items: null }, { fallbackTiers: TIERS });

  assert.equal(result.changed, true);
  assert.deepEqual(
    result.tiers.map((tier) => tier.id),
    ['s', 'a']
  );
  assert.deepEqual(result.items, []);
});

test('reconcile salvages the good entries instead of discarding the board', () => {
  const result = reconcileBoardSnapshot({
    tiers: TIERS,
    items: [
      { id: 'i1', content: 'Mario', type: 'text', tierId: null },
      { id: 'i2', content: '', type: 'text', tierId: null },
      { id: 'i3', type: 'video', content: 'x', tierId: null },
      null,
      { id: 'i4', content: 'Peach', type: 'text', tierId: null },
    ],
  });

  assert.deepEqual(
    result.items.map((item) => item.id),
    ['i1', 'i4']
  );
});

test('reconcile enforces the tier and item caps', () => {
  const tiers = Array.from({ length: MAX_TIERS + 5 }, (_, index) => ({
    id: `t${index}`,
    label: `T${index}`,
    color: '#ffffff',
  }));
  const items = Array.from({ length: MAX_ITEMS + 10 }, (_, index) => ({
    id: `i${index}`,
    content: `Item ${index}`,
    type: 'text' as const,
    tierId: null,
  }));

  const result = reconcileBoardSnapshot({ tiers, items });

  assert.equal(result.tiers.length, MAX_TIERS);
  assert.equal(result.items.length, MAX_ITEMS);
});

test('sanitizeTier repairs blank labels and over-long values', () => {
  const repaired = sanitizeTier({ id: 't', label: '   ', color: 'x'.repeat(80) });

  assert.equal(repaired?.label, 'NEW');
  assert.equal(repaired?.color.length, 32);
  assert.equal(sanitizeTier({ label: 'S', color: '#fff' }), null);
});

test('sanitizeItem truncates long text but drops oversized images', () => {
  const longText = sanitizeItem({
    id: 'i',
    content: 'x'.repeat(MAX_TEXT_ITEM_CONTENT_LENGTH + 50),
    type: 'text',
    tierId: null,
  });
  assert.equal(longText?.content.length, MAX_TEXT_ITEM_CONTENT_LENGTH);

  const hugeImage = sanitizeItem({
    id: 'i',
    content: 'x'.repeat(MAX_IMAGE_ITEM_CONTENT_LENGTH + 1),
    type: 'image',
    tierId: null,
  });
  assert.equal(hugeImage, null);
});

test('isReconciledBoardSnapshot reports on the invariants', () => {
  assert.equal(isReconciledBoardSnapshot({ tiers: TIERS, items: [] }), true);
  assert.equal(
    isReconciledBoardSnapshot({
      tiers: TIERS,
      items: [{ id: 'i1', content: 'Mario', type: 'text', tierId: 'ghost' }],
    }),
    false
  );
});

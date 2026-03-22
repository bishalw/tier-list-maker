import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCommunityConsensus } from '../features/tier-list/services/communityConsensus';
import { deriveIsViewer, deriveIsReadOnly } from '../features/tier-list/services/ownership';

test('deriveIsViewer returns false when remixing', () => {
  assert.equal(
    deriveIsViewer({
      targetListId: 'list-1',
      remixingId: 'list-1',
      ownerId: 'owner-1',
      currentUserId: 'other-user',
    }),
    false
  );
});

test('deriveIsViewer returns true when non-owner views shared list', () => {
  assert.equal(
    deriveIsViewer({
      targetListId: 'list-1',
      remixingId: null,
      ownerId: 'owner-1',
      currentUserId: 'other-user',
    }),
    true
  );
});

test('deriveIsReadOnly returns true for community viewMode', () => {
  assert.equal(deriveIsReadOnly('community'), true);
});

test('deriveIsReadOnly returns false for yours viewMode', () => {
  assert.equal(deriveIsReadOnly('yours'), false);
});

test('buildCommunityConsensus assigns averaged tier placements', () => {
  const tiers = [
    { id: 's', label: 'S', color: '#ff0000' },
    { id: 'a', label: 'A', color: '#ffaa00' },
  ];
  const items = [
    { id: 'item-1', content: 'Mario', type: 'text' as const, tierId: null },
    { id: 'item-2', content: 'Luigi', type: 'text' as const, tierId: null },
  ];

  const consensus = buildCommunityConsensus(items, tiers, [
    [
      { ...items[0], tierId: 's' },
      { ...items[1], tierId: 'a' },
    ],
    [
      { ...items[0], tierId: 'a' },
      { ...items[1], tierId: 'a' },
    ],
  ]);

  assert.equal(consensus.find((item) => item.id === 'item-1')?.tierId, 'a');
  assert.equal(consensus.find((item) => item.id === 'item-2')?.tierId, 'a');
});

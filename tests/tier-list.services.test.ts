import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveIsReadOnly, deriveIsViewer } from '../features/tier-list/services/ownership';
import { buildCommunityConsensus } from '../features/tier-list/services/communityConsensus';
import type { Item, Tier } from '../types';

const TIERS: Tier[] = [
  { id: 's', label: 'S', color: '#ff0000' },
  { id: 'a', label: 'A', color: '#ffaa00' },
  { id: 'b', label: 'B', color: '#ffff00' },
];

function readOnly(overrides: Partial<Parameters<typeof deriveIsReadOnly>[0]> = {}) {
  return deriveIsReadOnly({
    viewMode: 'creator',
    isViewer: false,
    hasStartedEditing: false,
    isOwnershipPending: false,
    ...overrides,
  });
}

test('deriveIsViewer returns false when remixing', () => {
  assert.equal(
    deriveIsViewer({
      targetListId: 'list-1',
      remixingId: 'list-1',
      ownerId: 'user-1',
      currentUserId: 'user-2',
    }),
    false
  );
});

test('deriveIsViewer returns true when non-owner views shared list', () => {
  assert.equal(
    deriveIsViewer({
      targetListId: 'list-1',
      remixingId: null,
      ownerId: 'user-1',
      currentUserId: 'user-2',
    }),
    true
  );
});

test('deriveIsReadOnly returns true for community and compare view modes', () => {
  assert.equal(readOnly({ viewMode: 'community' }), true);
  assert.equal(readOnly({ viewMode: 'compare' }), true);
});

test('deriveIsReadOnly returns false for the yours view mode', () => {
  assert.equal(readOnly({ viewMode: 'yours', isViewer: true, hasStartedEditing: true }), false);
});

test('deriveIsReadOnly locks the board while ownership is still resolving', () => {
  assert.equal(readOnly({ isOwnershipPending: true }), true);
  assert.equal(readOnly({ viewMode: 'yours', isOwnershipPending: true }), true);
});

test('deriveIsReadOnly locks the creator view once a viewer has their own copy', () => {
  assert.equal(readOnly({ viewMode: 'creator', isViewer: true, hasStartedEditing: true }), true);
  assert.equal(readOnly({ viewMode: 'creator', isViewer: true, hasStartedEditing: false }), false);
});

test('buildCommunityConsensus assigns averaged tier placements', () => {
  const items: Item[] = [{ id: 'i1', content: 'Mario', type: 'text', tierId: null }];
  const consensus = buildCommunityConsensus(items, TIERS, [
    [{ id: 'i1', content: 'Mario', type: 'text', tierId: 's' }],
    [{ id: 'i1', content: 'Mario', type: 'text', tierId: 'b' }],
  ]);

  assert.equal(consensus[0].tierId, 'a');
});

test('buildCommunityConsensus keeps items nobody has ranked', () => {
  const items: Item[] = [
    { id: 'i1', content: 'Mario', type: 'text', tierId: 's' },
    { id: 'i2', content: 'Luigi', type: 'text', tierId: 'a' },
  ];

  const consensus = buildCommunityConsensus(items, TIERS, [
    [{ id: 'i1', content: 'Mario', type: 'text', tierId: 's' }],
  ]);

  assert.deepEqual(
    consensus.map((item) => [item.id, item.tierId]),
    [
      ['i1', 's'],
      // No community signal, so it sits in the pool rather than disappearing.
      ['i2', null],
    ]
  );
});

test('buildCommunityConsensus ignores items the creator no longer has', () => {
  const items: Item[] = [{ id: 'i1', content: 'Mario', type: 'text', tierId: 's' }];

  const consensus = buildCommunityConsensus(items, TIERS, [
    [
      { id: 'i1', content: 'Mario', type: 'text', tierId: 's' },
      { id: 'deleted', content: 'Removed item', type: 'text', tierId: 's' },
    ],
  ]);

  assert.deepEqual(
    consensus.map((item) => item.id),
    ['i1']
  );
});

test('buildCommunityConsensus counts each item once per remix', () => {
  const items: Item[] = [{ id: 'i1', content: 'Mario', type: 'text', tierId: null }];

  const consensus = buildCommunityConsensus(items, TIERS, [
    [
      { id: 'i1', content: 'Mario', type: 'text', tierId: 's' },
      { id: 'i1', content: 'Mario', type: 'text', tierId: 'b' },
    ],
  ]);

  assert.equal(consensus[0].tierId, 's');
});

test('buildCommunityConsensus pools items the community mostly leaves unranked', () => {
  const items: Item[] = [{ id: 'i1', content: 'Mario', type: 'text', tierId: 's' }];

  const consensus = buildCommunityConsensus(items, TIERS, [
    [{ id: 'i1', content: 'Mario', type: 'text', tierId: null }],
    [{ id: 'i1', content: 'Mario', type: 'text', tierId: null }],
  ]);

  assert.equal(consensus[0].tierId, null);
});

test('buildCommunityConsensus returns the creator board when there are no remixes', () => {
  const items: Item[] = [{ id: 'i1', content: 'Mario', type: 'text', tierId: 's' }];

  assert.equal(buildCommunityConsensus(items, TIERS, []), items);
});

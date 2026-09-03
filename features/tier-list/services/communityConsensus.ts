import type { Item, Tier } from '../../../types';

/**
 * Averages every submitted remix into a single community ranking.
 *
 * The creator's item list is authoritative for *which* items exist; the remixes
 * only decide *where* they go. Without that reconciliation the consensus board
 * silently dropped items nobody had ranked yet, and resurrected items the
 * creator had since deleted (they still exist inside old remixes).
 *
 * Scoring is by tier index, lowest is best. An item left in a remix's unranked
 * pool scores one step below the last tier, so leaving something out counts as
 * a weak vote rather than no vote at all.
 */
export function buildCommunityConsensus(
  items: Item[],
  tiers: Tier[],
  remixItemsList: Item[][]
): Item[] {
  if (remixItemsList.length === 0 || tiers.length === 0) {
    return items;
  }

  const tierIndexById = new Map(tiers.map((tier, index) => [tier.id, index]));
  const knownItemIds = new Set(items.map((item) => item.id));
  const unrankedScore = tiers.length;

  const tallies = new Map<string, { totalScore: number; votes: number }>();

  remixItemsList.forEach((remixItems) => {
    // One vote per item per remix, even if a malformed remix repeats an item.
    const countedInThisRemix = new Set<string>();

    remixItems.forEach((item) => {
      if (!knownItemIds.has(item.id) || countedInThisRemix.has(item.id)) {
        return;
      }

      countedInThisRemix.add(item.id);

      const tierIndex = item.tierId !== null ? tierIndexById.get(item.tierId) : undefined;
      const score = tierIndex ?? unrankedScore;
      const tally = tallies.get(item.id) ?? { totalScore: 0, votes: 0 };

      tally.totalScore += score;
      tally.votes += 1;
      tallies.set(item.id, tally);
    });
  });

  return items.map((item) => {
    const tally = tallies.get(item.id);

    // Nobody has ranked this item yet, so the community has no opinion on it.
    // It stays visible in the pool rather than disappearing from the board.
    if (!tally || tally.votes === 0) {
      return item.tierId === null ? item : { ...item, tierId: null };
    }

    const averageScore = tally.totalScore / tally.votes;

    if (averageScore >= tiers.length - 0.5) {
      return item.tierId === null ? item : { ...item, tierId: null };
    }

    const closestIndex = Math.min(tiers.length - 1, Math.max(0, Math.round(averageScore)));
    const tierId = tiers[closestIndex].id;

    return item.tierId === tierId ? item : { ...item, tierId };
  });
}

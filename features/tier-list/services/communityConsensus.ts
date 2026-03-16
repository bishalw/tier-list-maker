import type { Item, Tier } from '../../../types';

export function buildCommunityConsensus(items: Item[], tiers: Tier[], remixItemsList: Item[][]) {
  if (remixItemsList.length === 0) {
    return items;
  }

  const itemScores: Record<string, { totalScore: number; count: number; item: Item }> = {};
  const tierIndexMap = new Map(tiers.map((tier, index) => [tier.id, index]));
  const unrankedScore = tiers.length;

  remixItemsList.forEach((remixItems) => {
    remixItems.forEach((item) => {
      if (!itemScores[item.id]) {
        itemScores[item.id] = { totalScore: 0, count: 0, item };
      }

      let score = unrankedScore;
      if (item.tierId && tierIndexMap.has(item.tierId)) {
        score = tierIndexMap.get(item.tierId) ?? unrankedScore;
      }

      itemScores[item.id].totalScore += score;
      itemScores[item.id].count += 1;
    });
  });

  return Object.values(itemScores).map(({ totalScore, count, item }) => {
    const averageScore = totalScore / count;
    let closestTierId: string | null = null;

    if (averageScore < tiers.length - 0.5) {
      const closestIndex = Math.round(averageScore);
      if (closestIndex >= 0 && closestIndex < tiers.length) {
        closestTierId = tiers[closestIndex].id;
      }
    }

    return {
      ...item,
      tierId: closestTierId,
    };
  });
}

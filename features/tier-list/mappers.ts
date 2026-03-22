import type { ReadonlyURLSearchParams } from 'next/navigation';
import type { TierBoardState } from '../../types';
import { normalizeBoardBackground } from '../../constants/theme';
import {
  createTierListInputSchema,
  submitRemixInputSchema,
  tierBoardStateSchema,
  tierListRouteSchema,
  updateTierListInputSchema,
} from './schemas';
import type {
  RemixRecord,
  RemixRow,
  TierListRecord,
  TierListRouteState,
  TierListRow,
} from './types';

export function mapTierListRowToRecord(row: TierListRow): TierListRecord {
  const boardState: TierBoardState = tierBoardStateSchema.parse({
    tiers: row.tiers,
    items: row.items,
    theme: row.theme,
    boardBackground: normalizeBoardBackground(row.board_background),
    itemSize: row.item_size,
    imageFit: row.image_fit,
  });

  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    remixCount: row.remix_count,
    viewCount: row.view_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    boardState,
  };
}

export function mapRemixRowToRecord(row: RemixRow): RemixRecord {
  return {
    id: row.id,
    tierListId: row.tier_list_id,
    userId: row.user_id,
    items: submitRemixInputSchema.shape.items.parse(row.items),
    createdAt: row.created_at,
  };
}

export function mapSearchParamsToRouteState(
  searchParams: URLSearchParams | ReadonlyURLSearchParams
): TierListRouteState {
  const parsed = tierListRouteSchema.parse({
    listId: searchParams.get('list'),
    remixingId: searchParams.get('remixing'),
    compareId: searchParams.get('compare'),
  });

  return {
    ...parsed,
    targetListId: parsed.listId ?? parsed.remixingId,
  };
}

export function mapBoardStateToCreateInput(boardState: TierBoardState, title?: string) {
  return createTierListInputSchema.parse({
    ...(title != null && { title }),
    boardState,
  });
}

export function mapBoardStateToUpdateInput(id: string, boardState: TierBoardState, title?: string) {
  return updateTierListInputSchema.parse({
    id,
    ...(title != null && { title }),
    boardState,
  });
}

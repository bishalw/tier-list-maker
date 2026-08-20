import type { ReadonlyURLSearchParams } from 'next/navigation';
import type { TierBoardState } from '../../types';
import { normalizeBoardBackground } from '../../constants/theme';
import { reconcileBoardSnapshot } from '../../store/boardInvariants';
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

const EMPTY_ROUTE_STATE: TierListRouteState = {
  listId: null,
  remixingId: null,
  compareId: null,
  targetListId: null,
};

export function mapTierListRowToRecord(row: TierListRow): TierListRecord {
  // Rows written before the invariants existed can contain items pointing at
  // tiers that were deleted. Repair them on the way in rather than refusing to
  // load the list at all.
  const reconciled = reconcileBoardSnapshot({ tiers: row.tiers, items: row.items });

  const boardState: TierBoardState = tierBoardStateSchema.parse({
    tiers: reconciled.tiers,
    items: reconciled.items,
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
    isPublic: row.is_public ?? true,
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

/**
 * Route parameters are attacker-controlled, so an unusable value resolves to
 * "no list selected" instead of throwing during render.
 */
export function mapSearchParamsToRouteState(
  searchParams: URLSearchParams | ReadonlyURLSearchParams
): TierListRouteState {
  const parsed = tierListRouteSchema.safeParse({
    listId: searchParams.get('list'),
    remixingId: searchParams.get('remixing'),
    compareId: searchParams.get('compare'),
  });

  if (!parsed.success) {
    return EMPTY_ROUTE_STATE;
  }

  return {
    ...parsed.data,
    targetListId: parsed.data.listId ?? parsed.data.remixingId,
  };
}

/**
 * Reconciles before validating so a board that drifted out of the invariants
 * is repaired and saved, instead of failing at the database boundary with an
 * error the user has no way to act on.
 */
function toValidBoardState(boardState: TierBoardState): TierBoardState {
  const reconciled = reconcileBoardSnapshot(boardState);

  return {
    ...boardState,
    tiers: reconciled.tiers,
    items: reconciled.items,
  };
}

export function mapBoardStateToCreateInput(
  boardState: TierBoardState,
  options: { title?: string; description?: string; isPublic?: boolean } = {}
) {
  return createTierListInputSchema.parse({
    ...(options.title != null && { title: options.title }),
    ...(options.description != null && { description: options.description }),
    ...(options.isPublic != null && { isPublic: options.isPublic }),
    boardState: toValidBoardState(boardState),
  });
}

export function mapBoardStateToUpdateInput(
  id: string,
  boardState: TierBoardState,
  options: { title?: string; description?: string; isPublic?: boolean; expectedUpdatedAt?: string } = {}
) {
  return updateTierListInputSchema.parse({
    id,
    ...(options.title != null && { title: options.title }),
    ...(options.description != null && { description: options.description }),
    ...(options.isPublic != null && { isPublic: options.isPublic }),
    ...(options.expectedUpdatedAt != null && { expectedUpdatedAt: options.expectedUpdatedAt }),
    boardState: toValidBoardState(boardState),
  });
}

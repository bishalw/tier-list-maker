import type { Item, Tier, TierBoardState } from '../../types';

export interface TierListRow {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  tiers: Tier[];
  items: Item[];
  theme: TierBoardState['theme'];
  board_background: string;
  item_size: TierBoardState['itemSize'];
  image_fit: TierBoardState['imageFit'];
  remix_count: number;
  created_at: string;
  updated_at: string;
}

export interface RemixRow {
  id: string;
  tier_list_id: string;
  user_id: string;
  items: Item[];
  created_at: string;
}

export interface TierListRouteState {
  listId: string | null;
  remixingId: string | null;
  compareId: string | null;
  targetListId: string | null;
}

export interface TierListRecord {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  remixCount: number;
  createdAt: string;
  updatedAt: string;
  boardState: TierBoardState;
}

export interface RemixRecord {
  id: string;
  tierListId: string;
  userId: string;
  items: Item[];
  createdAt: string;
}

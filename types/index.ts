export type ItemType = 'image' | 'text';
export type ItemSize = 'small' | 'medium' | 'large';
export type ImageFit = 'cover' | 'contain';
export type Theme = 'modern' | 'brutalist' | 'luxury';

export interface Item {
  id: string;
  content: string;
  type: ItemType;
  tierId: string | null;
}

export interface Tier {
  id: string;
  label: string;
  color: string;
}

export interface TierBoardState {
  tiers: Tier[];
  items: Item[];
  itemSize: ItemSize;
  imageFit: ImageFit;
  boardBackground: string;
  theme: Theme;
}

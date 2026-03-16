import { z } from 'zod';
import { THEME_DEFAULT_BOARD_BACKGROUND } from '../../constants/theme';

export const themeSchema = z.enum(['modern', 'brutalist', 'luxury']);
export const itemTypeSchema = z.enum(['image', 'text']);
export const itemSizeSchema = z.enum(['small', 'medium', 'large']);
export const imageFitSchema = z.enum(['cover', 'contain']);

export const tierSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(32),
  color: z.string().min(1).max(32),
});

export const itemSchema = z.object({
  id: z.string().min(1),
  content: z.string().min(1),
  type: itemTypeSchema,
  tierId: z.string().nullable(),
});

export const tierBoardStateSchema = z.object({
  tiers: z.array(tierSchema).min(1),
  items: z.array(itemSchema),
  theme: themeSchema,
  boardBackground: z.union([z.literal(THEME_DEFAULT_BOARD_BACKGROUND), z.string().min(1)]),
  itemSize: itemSizeSchema,
  imageFit: imageFitSchema,
});

export const tierListRouteSchema = z.object({
  listId: z.string().min(1).nullable(),
  remixingId: z.string().min(1).nullable(),
  compareId: z.string().min(1).nullable(),
});

export const createTierListInputSchema = z.object({
  title: z.string().trim().min(1).max(100).default('My Tier List'),
  description: z.string().trim().max(1000).default(''),
  boardState: tierBoardStateSchema,
});

export const updateTierListInputSchema = z.object({
  id: z.string().min(1),
  boardState: tierBoardStateSchema,
});

export const submitRemixInputSchema = z.object({
  tierListId: z.string().min(1),
  items: z.array(itemSchema),
});

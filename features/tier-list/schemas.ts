import { z } from 'zod';
import { THEME_DEFAULT_BOARD_BACKGROUND } from '../../constants/theme';
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_IMAGE_ITEM_CONTENT_LENGTH,
  MAX_ITEMS,
  MAX_TEXT_ITEM_CONTENT_LENGTH,
  MAX_TIERS,
  MAX_TIER_COLOR_LENGTH,
  MAX_TIER_LABEL_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_TIERS,
} from '../../constants/board';

/** Row ids are opaque to the app; the database rejects anything malformed. */
const idSchema = z.string().min(1).max(64);

export const themeSchema = z.enum(['modern', 'brutalist', 'luxury']);
export const itemTypeSchema = z.enum(['image', 'text']);
export const itemSizeSchema = z.enum(['small', 'medium', 'large']);
export const imageFitSchema = z.enum(['cover', 'contain']);

export const tierSchema = z.object({
  id: idSchema,
  label: z.string().min(1).max(MAX_TIER_LABEL_LENGTH),
  color: z.string().min(1).max(MAX_TIER_COLOR_LENGTH),
});

export const itemSchema = z
  .object({
    id: idSchema,
    content: z.string().min(1),
    type: itemTypeSchema,
    tierId: z.string().nullable(),
  })
  .refine(
    (item) =>
      item.content.length <=
      (item.type === 'image' ? MAX_IMAGE_ITEM_CONTENT_LENGTH : MAX_TEXT_ITEM_CONTENT_LENGTH),
    { message: 'Item content exceeds the maximum length for its type', path: ['content'] }
  );

function collectDuplicates(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
      return;
    }

    seen.add(value);
  });

  return [...duplicates];
}

export const tierBoardStateSchema = z
  .object({
    tiers: z.array(tierSchema).min(MIN_TIERS).max(MAX_TIERS),
    items: z.array(itemSchema).max(MAX_ITEMS),
    theme: themeSchema,
    boardBackground: z.union([z.literal(THEME_DEFAULT_BOARD_BACKGROUND), z.string().min(1).max(64)]),
    itemSize: itemSizeSchema,
    imageFit: imageFitSchema,
  })
  // The board invariants are enforced here as well as in the store, so a board
  // that violates one can never reach the database.
  .superRefine((boardState, ctx) => {
    const duplicateTierIds = collectDuplicates(boardState.tiers.map((tier) => tier.id));
    if (duplicateTierIds.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['tiers'],
        message: `Duplicate tier ids: ${duplicateTierIds.join(', ')}`,
      });
    }

    const duplicateItemIds = collectDuplicates(boardState.items.map((item) => item.id));
    if (duplicateItemIds.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['items'],
        message: `Duplicate item ids: ${duplicateItemIds.join(', ')}`,
      });
    }

    const tierIds = new Set(boardState.tiers.map((tier) => tier.id));
    boardState.items.forEach((item, index) => {
      if (item.tierId !== null && !tierIds.has(item.tierId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['items', index, 'tierId'],
          message: `Item is assigned to unknown tier "${item.tierId}"`,
        });
      }
    });
  });

export const tierListRouteSchema = z.object({
  listId: idSchema.nullable(),
  remixingId: idSchema.nullable(),
  compareId: idSchema.nullable(),
});

export const createTierListInputSchema = z.object({
  title: z.string().trim().min(1).max(MAX_TITLE_LENGTH).default('My Tier List'),
  description: z.string().trim().max(MAX_DESCRIPTION_LENGTH).default(''),
  isPublic: z.boolean().default(true),
  boardState: tierBoardStateSchema,
});

export const updateTierListInputSchema = z.object({
  id: idSchema,
  title: z.string().trim().min(1).max(MAX_TITLE_LENGTH).optional(),
  description: z.string().trim().max(MAX_DESCRIPTION_LENGTH).optional(),
  isPublic: z.boolean().optional(),
  /**
   * Last `updated_at` the client saw. When supplied, the update only applies if
   * the row has not changed since, so two tabs cannot silently overwrite one
   * another.
   */
  expectedUpdatedAt: z.string().min(1).max(64).optional(),
  boardState: tierBoardStateSchema,
});

export const renameTierListInputSchema = z.object({
  id: idSchema,
  title: z.string().trim().min(1).max(MAX_TITLE_LENGTH),
});

export const deleteTierListInputSchema = z.object({
  id: idSchema,
});

export const submitRemixInputSchema = z.object({
  tierListId: idSchema,
  items: z.array(itemSchema).max(MAX_ITEMS),
});

export const recordViewInputSchema = z.object({
  tierListId: idSchema,
});

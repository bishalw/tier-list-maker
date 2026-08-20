import type { Item, Tier } from '../types';
import { createDefaultTiers } from '../constants/theme';
import {
  MAX_IMAGE_ITEM_CONTENT_LENGTH,
  MAX_ITEMS,
  MAX_TEXT_ITEM_CONTENT_LENGTH,
  MAX_TIERS,
  MAX_TIER_COLOR_LENGTH,
  MAX_TIER_LABEL_LENGTH,
} from '../constants/board';

/**
 * Board invariants.
 *
 * The store guards these on every mutation it owns; this module is the guard
 * for everything that arrives from outside the store — persisted localStorage
 * payloads and boards loaded from the database.
 *
 * The invariants are:
 *  1. at least one tier, at most MAX_TIERS
 *  2. tier ids are unique
 *  3. tier labels and colors are non-empty and within the persisted length caps
 *  4. item ids are unique
 *  5. every `item.tierId` is either null or references an existing tier
 *  6. item content is non-empty and within the persisted length caps
 *
 * Invariant 5 is the important one: an item pointing at a tier that no longer
 * exists is invisible in the UI but still saved to the database.
 */

export interface BoardSnapshot {
  tiers: Tier[];
  items: Item[];
}

export interface ReconciledBoardSnapshot extends BoardSnapshot {
  /** False when the input already satisfied every invariant. */
  changed: boolean;
}

const DEFAULT_TIER_LABEL = 'NEW';
const DEFAULT_TIER_COLOR = '#cccccc';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function clampContentLength(type: Item['type']) {
  return type === 'image' ? MAX_IMAGE_ITEM_CONTENT_LENGTH : MAX_TEXT_ITEM_CONTENT_LENGTH;
}

/**
 * Returns the input reference untouched when it is already a valid tier, a
 * repaired copy when it can be salvaged, or null when it cannot.
 */
export function sanitizeTier(value: unknown): Tier | null {
  if (!isRecord(value)) {
    return null;
  }

  const { id, label, color } = value;

  if (typeof id !== 'string' || id.length === 0) {
    return null;
  }

  const safeLabel =
    typeof label === 'string' && label.trim().length > 0
      ? label.trim().slice(0, MAX_TIER_LABEL_LENGTH)
      : DEFAULT_TIER_LABEL;
  const safeColor =
    typeof color === 'string' && color.trim().length > 0
      ? color.trim().slice(0, MAX_TIER_COLOR_LENGTH)
      : DEFAULT_TIER_COLOR;

  if (label === safeLabel && color === safeColor) {
    return value as unknown as Tier;
  }

  return { id, label: safeLabel, color: safeColor };
}

/**
 * Returns the input reference untouched when it is already a valid item, a
 * repaired copy when it can be salvaged, or null when it cannot. Oversized
 * images are dropped rather than truncated — a clipped data URL renders as a
 * broken image and would still occupy the whole payload budget.
 */
export function sanitizeItem(value: unknown): Item | null {
  if (!isRecord(value)) {
    return null;
  }

  const { id, content, type, tierId } = value;

  if (typeof id !== 'string' || id.length === 0) {
    return null;
  }

  if (type !== 'image' && type !== 'text') {
    return null;
  }

  if (typeof content !== 'string' || content.length === 0) {
    return null;
  }

  if (tierId !== null && typeof tierId !== 'string') {
    return null;
  }

  const maxLength = clampContentLength(type);
  if (content.length > maxLength) {
    if (type === 'image') {
      return null;
    }

    return { id, content: content.slice(0, maxLength), type, tierId };
  }

  return value as unknown as Item;
}

export function reconcileBoardSnapshot(
  snapshot: { tiers: unknown; items: unknown },
  options: { fallbackTiers?: Tier[] } = {}
): ReconciledBoardSnapshot {
  const rawTiers = Array.isArray(snapshot.tiers) ? snapshot.tiers : [];
  const rawItems = Array.isArray(snapshot.items) ? snapshot.items : [];

  let changed = !Array.isArray(snapshot.tiers) || !Array.isArray(snapshot.items);

  const tiers: Tier[] = [];
  const tierIds = new Set<string>();

  for (const rawTier of rawTiers) {
    if (tiers.length >= MAX_TIERS) {
      changed = true;
      break;
    }

    const tier = sanitizeTier(rawTier);
    if (!tier) {
      changed = true;
      continue;
    }

    if (tierIds.has(tier.id)) {
      changed = true;
      continue;
    }

    if (tier !== rawTier) {
      changed = true;
    }

    tierIds.add(tier.id);
    tiers.push(tier);
  }

  if (tiers.length === 0) {
    changed = true;
    const fallbackTiers = options.fallbackTiers ?? createDefaultTiers('modern');
    fallbackTiers.forEach((tier) => {
      tierIds.add(tier.id);
      tiers.push({ ...tier });
    });
  }

  const items: Item[] = [];
  const itemIds = new Set<string>();

  for (const rawItem of rawItems) {
    if (items.length >= MAX_ITEMS) {
      changed = true;
      break;
    }

    const item = sanitizeItem(rawItem);
    if (!item) {
      changed = true;
      continue;
    }

    if (itemIds.has(item.id)) {
      changed = true;
      continue;
    }

    itemIds.add(item.id);

    if (item.tierId !== null && !tierIds.has(item.tierId)) {
      changed = true;
      items.push({ ...item, tierId: null });
      continue;
    }

    if (item !== rawItem) {
      changed = true;
    }

    items.push(item);
  }

  if (!changed) {
    return { tiers: rawTiers as Tier[], items: rawItems as Item[], changed: false };
  }

  return { tiers, items, changed: true };
}

/** True when every board invariant already holds. */
export function isReconciledBoardSnapshot(snapshot: { tiers: unknown; items: unknown }) {
  return !reconcileBoardSnapshot(snapshot).changed;
}

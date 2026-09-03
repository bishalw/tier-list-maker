import type { BoardBackground, ImageFit, ItemSize, Theme } from '../types';
import { THEME_DEFAULT_BOARD_BACKGROUND, THEME_DEFINITIONS } from '../constants/theme';

/**
 * Preference invariants.
 *
 * `theme` is used to index `THEME_DEFINITIONS`, so an unknown value read back
 * from localStorage throws while rendering. Everything persisted here is
 * therefore narrowed back to a known value on the way in.
 */

export interface PrefsSnapshot {
  theme: Theme;
  boardBackground: BoardBackground;
  itemSize: ItemSize;
  imageFit: ImageFit;
}

const ITEM_SIZES: ItemSize[] = ['small', 'medium', 'large'];
const IMAGE_FITS: ImageFit[] = ['cover', 'contain'];

const COLOR_PATTERN =
  /^(#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(?:rgb|hsl)a?\([0-9.,%\s/-]+\))$/i;

export const DEFAULT_PREFS: PrefsSnapshot = {
  theme: 'modern',
  boardBackground: THEME_DEFAULT_BOARD_BACKGROUND,
  itemSize: 'medium',
  imageFit: 'cover',
};

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(THEME_DEFINITIONS, value);
}

export function isItemSize(value: unknown): value is ItemSize {
  return typeof value === 'string' && ITEM_SIZES.includes(value as ItemSize);
}

export function isImageFit(value: unknown): value is ImageFit {
  return typeof value === 'string' && IMAGE_FITS.includes(value as ImageFit);
}

/**
 * Board backgrounds end up in an inline `background-color`, so only the theme
 * sentinel and recognisable CSS colors are accepted.
 */
export function isBoardBackground(value: unknown): value is BoardBackground {
  if (typeof value !== 'string') {
    return false;
  }

  if (value === THEME_DEFAULT_BOARD_BACKGROUND || value === 'transparent') {
    return true;
  }

  return COLOR_PATTERN.test(value.trim());
}

export function sanitizeBoardBackground(value: unknown): BoardBackground {
  return isBoardBackground(value) ? (value as string).trim() : DEFAULT_PREFS.boardBackground;
}

export function sanitizePrefs(value: unknown): PrefsSnapshot {
  if (typeof value !== 'object' || value === null) {
    return { ...DEFAULT_PREFS };
  }

  const candidate = value as Partial<PrefsSnapshot>;

  return {
    theme: isTheme(candidate.theme) ? candidate.theme : DEFAULT_PREFS.theme,
    boardBackground: sanitizeBoardBackground(candidate.boardBackground),
    itemSize: isItemSize(candidate.itemSize) ? candidate.itemSize : DEFAULT_PREFS.itemSize,
    imageFit: isImageFit(candidate.imageFit) ? candidate.imageFit : DEFAULT_PREFS.imageFit,
  };
}

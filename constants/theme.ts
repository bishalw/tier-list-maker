import type { BoardBackground, Theme, Tier } from '../types';

export const THEME_DEFAULT_BOARD_BACKGROUND = 'theme-default' as const;

type ThemeDefinition = {
  defaultBoardBackground: string;
  defaultTiers: Tier[];
};

const baseTierIds = ['s', 'a', 'b', 'c', 'd'] as const;
const baseTierLabels = ['S', 'A', 'B', 'C', 'D'] as const;

function buildTiers(colors: string[]): Tier[] {
  return colors.map((color, index) => ({
    id: baseTierIds[index],
    label: baseTierLabels[index],
    color,
  }));
}

export const THEME_DEFINITIONS: Record<Theme, ThemeDefinition> = {
  modern: {
    defaultBoardBackground: '#111827',
    defaultTiers: buildTiers(['#fb7185', '#fb923c', '#facc15', '#4ade80', '#60a5fa']),
  },
  brutalist: {
    defaultBoardBackground: '#ffffff',
    defaultTiers: buildTiers(['#ff5c5c', '#ff9f1c', '#ffe066', '#2ec4b6', '#3a86ff']),
  },
  luxury: {
    defaultBoardBackground: '#111111',
    defaultTiers: buildTiers(['#d4af37', '#c08457', '#8b5e34', '#4b5563', '#1f2937']),
  },
};

export function createDefaultTiers(theme: Theme): Tier[] {
  return THEME_DEFINITIONS[theme].defaultTiers.map((tier) => ({ ...tier }));
}

export function getThemeDefaultBoardBackground(theme: Theme) {
  return THEME_DEFINITIONS[theme].defaultBoardBackground;
}

export function isThemeDefaultBoardBackground(value: string | null | undefined): value is typeof THEME_DEFAULT_BOARD_BACKGROUND {
  return !value || value === 'transparent' || value === THEME_DEFAULT_BOARD_BACKGROUND;
}

export function normalizeBoardBackground(value: string | null | undefined): BoardBackground {
  return isThemeDefaultBoardBackground(value) ? THEME_DEFAULT_BOARD_BACKGROUND : String(value);
}

export function getEffectiveBoardBackground(theme: Theme, boardBackground: BoardBackground) {
  return isThemeDefaultBoardBackground(boardBackground)
    ? getThemeDefaultBoardBackground(theme)
    : boardBackground;
}

export function getBoardBackgroundLabel(theme: Theme, boardBackground: BoardBackground) {
  return isThemeDefaultBoardBackground(boardBackground)
    ? `Theme Default (${getThemeDefaultBoardBackground(theme)})`
    : boardBackground;
}

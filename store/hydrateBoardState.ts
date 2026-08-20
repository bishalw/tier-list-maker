'use client';

import type { TierBoardState } from '../types';
import { boardStore } from './useBoardStore';
import { prefsStore } from './usePrefsStore';

/**
 * Replaces the in-memory board with an externally supplied state.
 *
 * Both stores are written inside a single paused temporal window so the load
 * never lands in the undo stack, and so subscribers cannot observe a board and
 * preferences that belong to different tier lists.
 */
export function hydrateBoardState(boardState: TierBoardState) {
  const temporalState = boardStore.temporal.getState();
  temporalState.pause();

  try {
    boardStore.getState().replaceBoard({
      tiers: boardState.tiers,
      items: boardState.items,
    });
    prefsStore.getState().replacePrefs({
      theme: boardState.theme,
      boardBackground: boardState.boardBackground,
      itemSize: boardState.itemSize,
      imageFit: boardState.imageFit,
    });
  } finally {
    temporalState.clear();
    temporalState.resume();
  }
}

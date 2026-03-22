'use client';

import type { TierBoardState } from '../types';
import { boardStore } from './useBoardStore';
import { prefsStore } from './usePrefsStore';

export function hydrateBoardState(boardState: TierBoardState) {
  const temporalState = boardStore.temporal.getState();
  temporalState.pause();

  boardStore.setState(
    {
      tiers: boardState.tiers,
      items: boardState.items,
    },
    false
  );
  prefsStore.setState({
    theme: boardState.theme,
    boardBackground: boardState.boardBackground,
    itemSize: boardState.itemSize,
    imageFit: boardState.imageFit,
  });

  temporalState.clear();
  temporalState.resume();
}

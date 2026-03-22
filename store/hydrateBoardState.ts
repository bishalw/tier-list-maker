import type { TierBoardState } from '../types';
import { useBoardStore } from './useBoardStore';
import { usePrefsStore } from './usePrefsStore';

export function hydrateBoardState(boardState: TierBoardState) {
  const temporalState = useBoardStore.temporal.getState();
  temporalState.pause();

  useBoardStore.setState(
    {
      tiers: boardState.tiers,
      items: boardState.items,
    },
    false
  );
  usePrefsStore.setState({
    theme: boardState.theme,
    boardBackground: boardState.boardBackground,
    itemSize: boardState.itemSize,
    imageFit: boardState.imageFit,
  });

  temporalState.clear();
  temporalState.resume();
}

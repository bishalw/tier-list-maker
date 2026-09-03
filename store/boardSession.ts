'use client';

import type { TierBoardState } from '../types';
import { setPersistWritesEnabled } from './persistStorage';
import { hydrateBoardState } from './hydrateBoardState';
import { boardStore, resetBoardStore } from './useBoardStore';
import { prefsStore, resetPrefsStore } from './usePrefsStore';

/**
 * Separates the two boards the app works with.
 *
 * `draft` is the visitor's own work-in-progress board, and it is the only one
 * that owns the persisted localStorage entry. `remote` is a tier list loaded
 * from the database — opening one used to overwrite the draft in place (and
 * clear its undo history), permanently destroying unsaved work.
 *
 * While a remote list is on screen, persistence is suspended: the stores keep
 * reading from storage, but nothing is written back, so the draft survives
 * untouched and can be restored when the visitor navigates away.
 */
export type BoardSession = { kind: 'draft' } | { kind: 'remote'; listId: string };

const BOARD_SESSION_GLOBAL_KEY = '__tier_list_board_session__';

function readSession(): BoardSession {
  if (typeof window === 'undefined') {
    return { kind: 'draft' };
  }

  const container = window as unknown as Record<string, unknown>;
  return (container[BOARD_SESSION_GLOBAL_KEY] as BoardSession | undefined) ?? { kind: 'draft' };
}

function writeSession(session: BoardSession) {
  if (typeof window === 'undefined') {
    return;
  }

  (window as unknown as Record<string, unknown>)[BOARD_SESSION_GLOBAL_KEY] = session;
}

export function getBoardSession(): BoardSession {
  return readSession();
}

/**
 * Loads a database-backed tier list without touching the persisted draft.
 *
 * `returnItemsToPool` empties the tiers as part of the load, for starting a
 * remix. It has to happen inside the same hydration rather than as a follow-up
 * action, or the emptying is recorded as a user edit and a single undo restores
 * the creator's rankings onto the remixer's board.
 */
export function enterRemoteBoardSession(
  listId: string,
  boardState: TierBoardState,
  options: { returnItemsToPool?: boolean } = {}
) {
  setPersistWritesEnabled(false);
  writeSession({ kind: 'remote', listId });

  hydrateBoardState(
    options.returnItemsToPool
      ? {
          ...boardState,
          items: boardState.items.map((item) =>
            item.tierId === null ? item : { ...item, tierId: null }
          ),
        }
      : boardState
  );
}

/**
 * Restores the visitor's own board after leaving a shared list. Resolves once
 * the persisted draft (if any) has been read back.
 */
export async function restoreDraftBoardSession() {
  if (readSession().kind === 'draft') {
    return;
  }

  writeSession({ kind: 'draft' });

  const temporalState = boardStore.temporal.getState();
  temporalState.pause();

  try {
    // Clear the remote list first: `rehydrate` merges over the current state, so
    // without this a visitor with no saved draft would keep looking at the
    // shared board.
    resetBoardStore();
    resetPrefsStore();
    setPersistWritesEnabled(true);

    await Promise.all([boardStore.persist?.rehydrate?.(), prefsStore.persist?.rehydrate?.()]);
  } finally {
    temporalState.clear();
    temporalState.resume();
  }
}

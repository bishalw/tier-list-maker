import type { ViewMode } from '../types';

export function deriveIsViewer(params: {
  targetListId: string | null;
  remixingId: string | null;
  ownerId: string | null;
  currentUserId: string | null;
}) {
  if (!params.targetListId || params.remixingId) {
    return false;
  }

  if (!params.ownerId) {
    return false;
  }

  return params.currentUserId !== params.ownerId;
}

/**
 * Single source of truth for whether the board accepts edits.
 *
 * This used to be split between `deriveIsReadOnly(viewMode)` and an extra
 * condition inlined in the screen hook, so the two could disagree. It also now
 * covers the load window: until the list and the signed-in user have both
 * resolved, nobody knows whose board is on screen, and editing it would be
 * overwritten by the hydration that follows.
 */
export function deriveIsReadOnly(params: {
  viewMode: ViewMode;
  isViewer: boolean;
  hasStartedEditing: boolean;
  isOwnershipPending: boolean;
}) {
  if (params.isOwnershipPending) {
    return true;
  }

  if (params.viewMode === 'community' || params.viewMode === 'compare') {
    return true;
  }

  // A viewer who has started their own version can still flip back to the
  // creator's original, which must not be editable.
  return params.viewMode === 'creator' && params.isViewer && params.hasStartedEditing;
}

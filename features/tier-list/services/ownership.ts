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

export function deriveIsReadOnly(viewMode: ViewMode) {
  return viewMode === 'community' || viewMode === 'compare';
}

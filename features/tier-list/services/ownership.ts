export function deriveIsReadOnly(params: {
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

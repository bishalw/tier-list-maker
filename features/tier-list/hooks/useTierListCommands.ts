'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useStore } from 'zustand';
import { getBrowserSupabaseClient } from '../../../lib/supabase/client';
import { getEffectiveBoardBackground } from '../../../constants/theme';
import {
  buildInternalNext,
  consumeAuthIntent,
  readAuthIntent,
  saveAuthIntent,
  type AuthIntentType,
} from '../../auth/authIntent';
import { createTierListAction, submitRemixAction, updateTierListAction } from '../actions';
import { ACTION_FAILURE_MESSAGES, isActionFailure } from '../results';
import { mapBoardStateToCreateInput, mapBoardStateToUpdateInput } from '../mappers';
import { boardStore, useBoardStore } from '../../../store/useBoardStore';
import { prefsStore, usePrefsStore } from '../../../store/usePrefsStore';

interface Params {
  listId: string | null;
  remixingId: string | null;
  isReadOnly: boolean;
  title: string;
  /** `updated_at` of the loaded list, used to detect concurrent edits. */
  listUpdatedAt: string | null;
  onAuthSuccess: () => Promise<void>;
}

export function useTierListCommands({
  listId,
  remixingId,
  isReadOnly,
  title,
  listUpdatedAt,
  onAuthSuccess,
}: Params) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSubmittingRemix, setIsSubmittingRemix] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [commandError, setCommandError] = useState<string | null>(null);
  const [savedUpdatedAt, setSavedUpdatedAt] = useState<string | null>(listUpdatedAt);
  const [pendingAuthIntentType, setPendingAuthIntentType] = useState<AuthIntentType | null>(null);
  const [hasResumedAuthIntent, setHasResumedAuthIntent] = useState(false);

  const theme = usePrefsStore((state) => state.theme);
  const boardBackground = usePrefsStore((state) => state.boardBackground);

  useEffect(() => {
    setSavedUpdatedAt(listUpdatedAt);
  }, [listUpdatedAt]);

  const buildBoardState = useCallback(() => {
    const boardState = boardStore.getState();
    const prefsState = prefsStore.getState();

    return {
      tiers: boardState.tiers,
      items: boardState.items,
      itemSize: prefsState.itemSize,
      imageFit: prefsState.imageFit,
      boardBackground: prefsState.boardBackground,
      theme: prefsState.theme,
    };
  }, []);

  const buildNextPath = useCallback(
    () => buildInternalNext(pathname, searchParams),
    [pathname, searchParams]
  );

  const getAuthenticatedUser = useCallback(async () => {
    const supabase = getBrowserSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    return user;
  }, []);

  const openAuthGate = useCallback(
    (type: AuthIntentType) => {
      saveAuthIntent({
        type,
        next: buildNextPath(),
        listId,
        remixingId,
      });
      setPendingAuthIntentType(type);
      setShowAuthModal(true);
    },
    [buildNextPath, listId, remixingId]
  );

  const handleExport = async () => {
    const element = document.getElementById('tier-list-container');
    if (!element) return;

    setIsExporting(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const bgColor = getEffectiveBoardBackground(theme, boardBackground);

      const canvas = await html2canvas(element, {
        useCORS: true,
        backgroundColor: bgColor,
        scale: 2,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'my-tier-list.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Export failed', error);
    } finally {
      setIsExporting(false);
    }
  };

  const performShare = useCallback(async () => {
    setIsSharing(true);
    setCommandError(null);

    try {
      const boardState = buildBoardState();

      // Viewing someone else's list forks it into a new list rather than
      // attempting an update that the owner check would reject.
      const result =
        !listId || isReadOnly
          ? await createTierListAction(mapBoardStateToCreateInput(boardState, { title }))
          : await updateTierListAction(
              mapBoardStateToUpdateInput(listId, boardState, {
                title,
                ...(savedUpdatedAt != null && { expectedUpdatedAt: savedUpdatedAt }),
              })
            );

      if (isActionFailure(result)) {
        setCommandError(result.message);
        return;
      }

      setSavedUpdatedAt(result.data.updatedAt);
      setShareUrl(`${window.location.origin}/create?list=${result.data.id}`);
    } catch (error) {
      console.error('Error sharing list:', error);
      setCommandError(ACTION_FAILURE_MESSAGES.unavailable);
    } finally {
      setIsSharing(false);
    }
  }, [buildBoardState, isReadOnly, listId, savedUpdatedAt, title]);

  const handleShare = async () => {
    try {
      const user = await getAuthenticatedUser();
      if (!user) {
        openAuthGate('share');
        return;
      }

      await performShare();
    } catch (error) {
      console.error('Error sharing list:', error);
      setCommandError(ACTION_FAILURE_MESSAGES.unavailable);
    }
  };

  const handleCopy = () => {
    void navigator.clipboard?.writeText(shareUrl).catch(() => {
      setCommandError('Could not copy the link. Copy it from the address bar instead.');
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemix = () => {
    if (!listId) return;

    boardStore.getState().returnItemsToPool();
    router.push(`/create?remixing=${listId}`);
  };

  const performSubmitRemix = useCallback(async () => {
    if (!remixingId) return;

    setIsSubmittingRemix(true);
    setCommandError(null);

    try {
      const boardState = buildBoardState();
      const result = await submitRemixAction({
        tierListId: remixingId,
        items: boardState.items,
      });

      if (isActionFailure(result)) {
        setCommandError(result.message);
        return;
      }

      router.push(`/create?list=${remixingId}&compare=${result.data.remixId}`);
    } catch (error) {
      console.error('Error submitting remix:', error);
      setCommandError(ACTION_FAILURE_MESSAGES.unavailable);
    } finally {
      setIsSubmittingRemix(false);
    }
  }, [buildBoardState, remixingId, router]);

  const handleSubmitRemix = async () => {
    if (!remixingId) return;

    try {
      const user = await getAuthenticatedUser();
      if (!user) {
        openAuthGate('submit-remix');
        return;
      }

      await performSubmitRemix();
    } catch (error) {
      console.error('Error submitting remix:', error);
      setCommandError(ACTION_FAILURE_MESSAGES.unavailable);
    }
  };

  const resumeIntent = useCallback(
    async (intentType: AuthIntentType) => {
      if (intentType === 'share') {
        await performShare();
        return;
      }

      await performSubmitRemix();
    },
    [performShare, performSubmitRemix]
  );

  const handleAuthSuccess = async () => {
    await onAuthSuccess();
    const intent = consumeAuthIntent();
    setPendingAuthIntentType(null);
    setShowAuthModal(false);

    if (intent) {
      await resumeIntent(intent.type);
    }
  };

  useEffect(() => {
    if (searchParams.get('auth') !== 'complete' || hasResumedAuthIntent) {
      return;
    }

    const intent = readAuthIntent();
    if (!intent) {
      setHasResumedAuthIntent(true);
      return;
    }

    setHasResumedAuthIntent(true);
    void (async () => {
      try {
        await onAuthSuccess();
        const consumedIntent = consumeAuthIntent();
        if (consumedIntent) {
          await resumeIntent(consumedIntent.type);
        }
      } catch (error) {
        console.error('Error resuming auth intent:', error);
      }
    })();
  }, [hasResumedAuthIntent, onAuthSuccess, resumeIntent, searchParams]);

  const pendingIntent = useMemo(() => {
    if (pendingAuthIntentType) {
      return pendingAuthIntentType;
    }

    return readAuthIntent()?.type ?? null;
  }, [pendingAuthIntentType]);

  const undo = useStore(boardStore.temporal, (state) => state.undo);
  const redo = useStore(boardStore.temporal, (state) => state.redo);
  const pastStates = useStore(boardStore.temporal, (state) => state.pastStates);
  const futureStates = useStore(boardStore.temporal, (state) => state.futureStates);

  return {
    authNextPath: buildNextPath(),
    canUndo: pastStates.length > 0,
    commandError,
    clearCommandError: () => setCommandError(null),
    canRedo: futureStates.length > 0,
    copied,
    isExporting,
    isSharing,
    isSubmittingRemix,
    pendingAuthIntentType: pendingIntent,
    shareUrl,
    showAuthModal,
    handleAuthSuccess,
    handleCopy,
    handleExport,
    handleRemix,
    handleShare,
    handleSubmitRemix,
    setShowAuthModal,
    redo,
    undo,
  };
}

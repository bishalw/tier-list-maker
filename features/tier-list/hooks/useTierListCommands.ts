'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from 'zustand';
import { useTierStore } from '../../../store/useTierStore';
import { createTierListAction, submitRemixAction, updateTierListAction } from '../actions';
import { mapBoardStateToCreateInput, mapBoardStateToUpdateInput } from '../mappers';
import { ensureAnonymousSession } from '../../../lib/supabase/auth';

interface Params {
  listId: string | null;
  remixingId: string | null;
  isReadOnly: boolean;
}

export function useTierListCommands({ listId, remixingId, isReadOnly }: Params) {
  const router = useRouter();

  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSubmittingRemix, setIsSubmittingRemix] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const tiers = useTierStore((state) => state.tiers);
  const items = useTierStore((state) => state.items);
  const itemSize = useTierStore((state) => state.itemSize);
  const imageFit = useTierStore((state) => state.imageFit);
  const boardBackground = useTierStore((state) => state.boardBackground);
  const theme = useTierStore((state) => state.theme);

  const buildBoardState = () => ({
    tiers,
    items,
    itemSize,
    imageFit,
    boardBackground,
    theme,
  });

  const handleExport = async () => {
    const element = document.getElementById('tier-list-container');
    if (!element) return;

    setIsExporting(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const bgColor =
        boardBackground !== 'transparent' && boardBackground
          ? boardBackground
          : getComputedStyle(document.documentElement).getPropertyValue('--theme-bg').trim() ||
            '#111827';

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

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await ensureAnonymousSession();

      const boardState = buildBoardState();
      const result =
        !listId || isReadOnly
          ? await createTierListAction(mapBoardStateToCreateInput(boardState))
          : await updateTierListAction(mapBoardStateToUpdateInput(listId, boardState));

      const url = `${window.location.origin}/?list=${result.id}`;
      setShareUrl(url);
    } catch (error) {
      console.error('Error sharing list:', error);
      alert('Failed to share list. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemix = () => {
    if (!listId) return;

    useTierStore.getState().returnItemsToPool();
    router.push(`/?remixing=${listId}`);
  };

  const handleSubmitRemix = async () => {
    if (!remixingId) return;

    setIsSubmittingRemix(true);
    try {
      await ensureAnonymousSession();
      const result = await submitRemixAction({
        tierListId: remixingId,
        items,
      });

      alert('Remix submitted successfully! You can now view the community consensus.');
      router.push(`/?list=${remixingId}&compare=${result.remixId}`);
    } catch (error) {
      console.error('Error submitting remix:', error);
      alert('Failed to submit remix. Please try again.');
    } finally {
      setIsSubmittingRemix(false);
    }
  };

  const undo = useStore(useTierStore.temporal, (state) => state.undo);
  const redo = useStore(useTierStore.temporal, (state) => state.redo);
  const pastStates = useStore(useTierStore.temporal, (state) => state.pastStates);
  const futureStates = useStore(useTierStore.temporal, (state) => state.futureStates);

  return {
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
    copied,
    isExporting,
    isSharing,
    isSubmittingRemix,
    shareUrl,
    handleCopy,
    handleExport,
    handleRemix,
    handleShare,
    handleSubmitRemix,
    redo,
    undo,
  };
}

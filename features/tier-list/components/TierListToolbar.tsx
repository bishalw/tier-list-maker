'use client';

import { useBoardStore } from '../../../store/useBoardStore';
import { usePrefsStore } from '../../../store/usePrefsStore';
import { Toolbar } from '../../../components/Toolbar';
import {
  getBoardBackgroundLabel,
  getEffectiveBoardBackground,
} from '../../../constants/theme';
import { useTierListCommands } from '../hooks/useTierListCommands';
import { RemixAuthModal } from './RemixAuthModal';
import { useRouter } from 'next/navigation';

interface Props {
  isReadOnly: boolean;
  isViewer: boolean;
  listId: string | null;
  onAuthSuccess: () => Promise<void>;
  remixingId: string | null;
}

export function TierListToolbar({ isReadOnly, isViewer, listId, onAuthSuccess, remixingId }: Props) {
  const router = useRouter();
  const commands = useTierListCommands({ isReadOnly, listId, onAuthSuccess, remixingId });

  const returnItemsToPool = useBoardStore((state) => state.returnItemsToPool);
  const deleteAllItems = useBoardStore((state) => state.deleteAllItems);
  const resetTiers = useBoardStore((state) => state.resetTiers);
  const applyTemplate = useBoardStore((state) => state.applyTemplate);
  const itemSize = usePrefsStore((state) => state.itemSize);
  const imageFit = usePrefsStore((state) => state.imageFit);
  const boardBackground = usePrefsStore((state) => state.boardBackground);
  const resetBoardBackground = usePrefsStore((state) => state.resetBoardBackground);
  const setItemSize = usePrefsStore((state) => state.setItemSize);
  const setImageFit = usePrefsStore((state) => state.setImageFit);
  const setBoardBackground = usePrefsStore((state) => state.setBoardBackground);
  const theme = usePrefsStore((state) => state.theme);
  const setTheme = usePrefsStore((state) => state.setTheme);
  const effectiveBoardBackground = getEffectiveBoardBackground(theme, boardBackground);
  const boardBackgroundLabel = getBoardBackgroundLabel(theme, boardBackground);

  return (
    <>
      <Toolbar
        boardBackground={boardBackground}
        boardBackgroundLabel={boardBackgroundLabel}
        canRedo={commands.canRedo}
        canUndo={commands.canUndo}
        copied={commands.copied}
        effectiveBoardBackground={effectiveBoardBackground}
        imageFit={imageFit}
        isExporting={commands.isExporting}
        isReadOnly={isReadOnly}
        isSharing={commands.isSharing}
        isSubmittingRemix={commands.isSubmittingRemix}
        itemSize={itemSize}
        remixingId={remixingId}
        shareUrl={commands.shareUrl}
        theme={theme}
        onApplyTemplate={applyTemplate}
        onBoardBackgroundChange={setBoardBackground}
        onBoardBackgroundReset={resetBoardBackground}
        onCopy={commands.handleCopy}
        onDeleteAllItems={deleteAllItems}
        onExport={commands.handleExport}
        onImageFitChange={setImageFit}
        onItemSizeChange={setItemSize}
        onRedo={commands.redo}
        onRemix={commands.handleRemix}
        onResetTiers={() => resetTiers(theme)}
        onReturnItemsToPool={returnItemsToPool}
        onShare={commands.handleShare}
        onSubmitRemix={commands.handleSubmitRemix}
        onThemeChange={setTheme}
        onUndo={commands.undo}
        onProfileClick={() => router.push('/profile')}
      />

      <RemixAuthModal
        isOpen={commands.showAuthModal}
        nextPath={commands.authNextPath}
        onClose={() => commands.setShowAuthModal(false)}
        onAuthSuccess={commands.handleAuthSuccess}
        pendingAction={commands.pendingAuthIntentType}
      />
    </>
  );
}

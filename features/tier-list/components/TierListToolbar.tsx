'use client';

import { useTierStore } from '../../../store/useTierStore';
import { Toolbar } from '../../../components/Toolbar';
import {
  getBoardBackgroundLabel,
  getEffectiveBoardBackground,
} from '../../../constants/theme';
import { useTierListCommands } from '../hooks/useTierListCommands';

interface Props {
  isReadOnly: boolean;
  listId: string | null;
  remixingId: string | null;
}

export function TierListToolbar({ isReadOnly, listId, remixingId }: Props) {
  const commands = useTierListCommands({ isReadOnly, listId, remixingId });

  const returnItemsToPool = useTierStore((state) => state.returnItemsToPool);
  const deleteAllItems = useTierStore((state) => state.deleteAllItems);
  const resetTiers = useTierStore((state) => state.resetTiers);
  const applyTemplate = useTierStore((state) => state.applyTemplate);
  const itemSize = useTierStore((state) => state.itemSize);
  const imageFit = useTierStore((state) => state.imageFit);
  const boardBackground = useTierStore((state) => state.boardBackground);
  const resetBoardBackground = useTierStore((state) => state.resetBoardBackground);
  const setItemSize = useTierStore((state) => state.setItemSize);
  const setImageFit = useTierStore((state) => state.setImageFit);
  const setBoardBackground = useTierStore((state) => state.setBoardBackground);
  const theme = useTierStore((state) => state.theme);
  const setTheme = useTierStore((state) => state.setTheme);
  const effectiveBoardBackground = getEffectiveBoardBackground(theme, boardBackground);
  const boardBackgroundLabel = getBoardBackgroundLabel(theme, boardBackground);

  return (
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
      onResetTiers={resetTiers}
      onReturnItemsToPool={returnItemsToPool}
      onShare={commands.handleShare}
      onSubmitRemix={commands.handleSubmitRemix}
      onThemeChange={setTheme}
      onUndo={commands.undo}
    />
  );
}

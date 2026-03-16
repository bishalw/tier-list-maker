'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import {
  Download,
  RotateCcw,
  Trash,
  Undo,
  Redo,
  LayoutTemplate,
  Settings,
  Maximize,
  Minimize,
  Image as ImageIcon,
  Share2,
  Copy,
  Check,
  Edit3,
  Send,
} from 'lucide-react';
import {
  Button as RACButton,
  MenuTrigger,
  Popover,
  Menu,
  MenuItem,
  Header,
  Separator,
  Dialog,
  DialogTrigger,
  Modal,
  ModalOverlay,
} from 'react-aria-components';
import { TIER_TEMPLATES } from '../constants/templates';
import type { ImageFit, ItemSize, Theme, Tier } from '../types';

const HexColorPicker = dynamic(
  () => import('react-colorful').then((module) => module.HexColorPicker),
  { ssr: false },
);

const SETTINGS_SECTIONS = {
  theme: [
    { value: 'modern', label: 'Modern Dark' },
    { value: 'brutalist', label: 'Neo-Brutalist' },
    { value: 'luxury', label: 'Pure Luxury' },
  ] as const,
  itemSize: [
    { value: 'small', label: 'Small', icon: Minimize },
    { value: 'medium', label: 'Medium', icon: ImageIcon },
    { value: 'large', label: 'Large', icon: Maximize },
  ] as const,
  imageFit: [
    { value: 'cover', label: 'Crop to Fill' },
    { value: 'contain', label: 'Fit Inside' },
  ] as const,
};

interface Props {
  boardBackground: string;
  boardBackgroundLabel: string;
  effectiveBoardBackground: string;
  canRedo: boolean;
  canUndo: boolean;
  copied: boolean;
  imageFit: ImageFit;
  isExporting: boolean;
  isReadOnly?: boolean;
  isSharing: boolean;
  isSubmittingRemix: boolean;
  itemSize: ItemSize;
  remixingId?: string | null;
  shareUrl: string;
  theme: Theme;
  onApplyTemplate: (tiers: Tier[]) => void;
  onBoardBackgroundChange: (color: string) => void;
  onBoardBackgroundReset: () => void;
  onCopy: () => void;
  onDeleteAllItems: () => void;
  onExport: () => void;
  onImageFitChange: (fit: ImageFit) => void;
  onItemSizeChange: (size: ItemSize) => void;
  onRedo: () => void;
  onRemix: () => void;
  onResetTiers: () => void;
  onReturnItemsToPool: () => void;
  onShare: () => void;
  onSubmitRemix: () => void;
  onThemeChange: (theme: Theme) => void;
  onUndo: () => void;
}

export const Toolbar = ({
  boardBackground,
  boardBackgroundLabel,
  effectiveBoardBackground,
  canRedo,
  canUndo,
  copied,
  imageFit,
  isExporting,
  isReadOnly,
  isSharing,
  isSubmittingRemix,
  itemSize,
  remixingId,
  shareUrl,
  theme,
  onApplyTemplate,
  onBoardBackgroundChange,
  onBoardBackgroundReset,
  onCopy,
  onDeleteAllItems,
  onExport,
  onImageFitChange,
  onItemSizeChange,
  onRedo,
  onRemix,
  onResetTiers,
  onReturnItemsToPool,
  onShare,
  onSubmitRemix,
  onThemeChange,
  onUndo,
}: Props) => {
  const renderSettingsButton = (isActive: boolean, label: string, onPress: () => void) => (
    <button
      type="button"
      onClick={onPress}
      className={`flex items-center justify-between gap-3 px-3 py-2 rounded-item border transition-colors text-left ${
        isActive
          ? 'border-accent bg-accent-soft text-text-main'
          : 'border-border-main bg-bg-main text-text-muted hover:bg-surface-hover hover:text-text-main'
      }`}
    >
      <span>{label}</span>
      {isActive && <div className="w-2 h-2 rounded-full bg-accent" />}
    </button>
  );

  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-main">
          Tier List Maker
        </h1>
        <p className="text-text-muted mt-1">
          Rank your favorite items, characters, or anything else.
        </p>
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto flex-wrap md:flex-nowrap">
        {!isReadOnly && (
          <div className="flex items-center bg-surface rounded-panel p-1 shadow-panel">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2 text-text-muted hover:text-text-main hover:bg-surface-hover disabled:opacity-30 disabled:hover:bg-transparent rounded-item transition-colors"
              title="Undo"
            >
              <Undo size={18} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-2 text-text-muted hover:text-text-main hover:bg-surface-hover disabled:opacity-30 disabled:hover:bg-transparent rounded-item transition-colors"
              title="Redo"
            >
              <Redo size={18} />
            </button>
          </div>
        )}

        {!isReadOnly && (
          <DialogTrigger>
            <RACButton className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover text-text-main px-4 py-2.5 rounded-panel font-medium transition-all shadow-panel outline-none focus-visible:ring-2 focus-visible:ring-focus-ring">
              <Settings size={18} />
              Settings
            </RACButton>
            <Popover className="bg-surface border border-border-main rounded-panel shadow-panel w-[min(92vw,22rem)] max-h-[min(80vh,42rem)] overflow-auto data-[entering]:animate-in data-[entering]:fade-in data-[exiting]:animate-out data-[exiting]:fade-out">
              <Dialog className="outline-none p-4 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                    Settings
                  </h2>
                  <p className="text-sm text-text-muted">
                    Customize how your tier list board looks and behaves.
                  </p>
                </div>

                <section className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Theme
                  </h3>
                  <div className="grid gap-2">
                    {SETTINGS_SECTIONS.theme.map((option) => (
                      <React.Fragment key={option.value}>
                        {renderSettingsButton(theme === option.value, option.label, () =>
                          onThemeChange(option.value)
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </section>

                <section className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Item Size
                  </h3>
                  <div className="grid gap-2">
                    {SETTINGS_SECTIONS.itemSize.map((option) => {
                      const Icon = option.icon;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => onItemSizeChange(option.value)}
                          className={`flex items-center justify-between gap-3 px-3 py-2 rounded-item border transition-colors text-left ${
                            itemSize === option.value
                              ? 'border-accent bg-accent-soft text-text-main'
                              : 'border-border-main bg-bg-main text-text-muted hover:bg-surface-hover hover:text-text-main'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon size={16} />
                            {option.label}
                          </span>
                          {itemSize === option.value && (
                            <div className="w-2 h-2 rounded-full bg-accent" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Image Fit
                  </h3>
                  <div className="grid gap-2">
                    {SETTINGS_SECTIONS.imageFit.map((option) => (
                      <React.Fragment key={option.value}>
                        {renderSettingsButton(imageFit === option.value, option.label, () =>
                          onImageFitChange(option.value)
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </section>

                <section className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Board Background
                    </h3>
                    <span className="text-xs text-text-muted">{boardBackgroundLabel}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onBoardBackgroundReset}
                    className="self-start text-sm text-accent hover:text-accent-hover transition-colors"
                  >
                    Reset to theme default
                  </button>
                  <div className="px-1 pb-1">
                    <HexColorPicker
                      color={effectiveBoardBackground}
                      onChange={onBoardBackgroundChange}
                      className="!w-full !h-32"
                    />
                  </div>
                </section>
              </Dialog>
            </Popover>
          </DialogTrigger>
        )}

        {!isReadOnly && (
          <MenuTrigger>
            <RACButton className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover text-text-main px-4 py-2.5 rounded-panel font-medium transition-all shadow-panel outline-none focus-visible:ring-2 focus-visible:ring-focus-ring">
              <LayoutTemplate size={18} />
              Templates
            </RACButton>
            <Popover className="bg-surface border border-border-main rounded-panel shadow-panel min-w-[240px] data-[entering]:animate-in data-[entering]:fade-in data-[exiting]:animate-out data-[exiting]:fade-out">
              <Menu className="p-1.5 outline-none flex flex-col gap-1">
                <Header className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Choose a Template
                </Header>
                {Object.entries(TIER_TEMPLATES).map(([key, template]) => (
                  <MenuItem
                    key={key}
                    onAction={() => onApplyTemplate(template.tiers)}
                    className="flex flex-col items-start gap-0.5 px-3 py-2 rounded-item cursor-pointer hover:bg-surface-hover outline-none focus:bg-surface-hover text-text-main"
                  >
                    <span className="font-medium">{template.name}</span>
                    <span className="text-xs text-text-muted">{template.description}</span>
                  </MenuItem>
                ))}
              </Menu>
            </Popover>
          </MenuTrigger>
        )}

        {!isReadOnly && (
          <MenuTrigger>
            <RACButton className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover text-text-main px-4 py-2.5 rounded-panel font-medium transition-all shadow-panel outline-none focus-visible:ring-2 focus-visible:ring-focus-ring">
              <RotateCcw size={18} />
              Reset...
            </RACButton>
            <Popover className="bg-surface border border-border-main rounded-panel shadow-panel min-w-[220px] data-[entering]:animate-in data-[entering]:fade-in data-[exiting]:animate-out data-[exiting]:fade-out">
              <Menu className="p-1.5 outline-none flex flex-col gap-1">
                <MenuItem
                  onAction={onReturnItemsToPool}
                  className="flex items-center gap-2 px-3 py-2 rounded-item cursor-pointer hover:bg-surface-hover outline-none focus:bg-surface-hover text-text-main"
                >
                  <Undo size={16} /> Return items to pool
                </MenuItem>
                <MenuItem
                  onAction={onDeleteAllItems}
                  className="flex items-center gap-2 px-3 py-2 rounded-item cursor-pointer hover:bg-danger-soft text-danger outline-none focus:bg-danger-soft"
                >
                  <Trash size={16} /> Delete all items
                </MenuItem>
                <Separator className="h-px bg-border-main my-1 mx-2" />
                <MenuItem
                  onAction={onResetTiers}
                  className="flex items-center gap-2 px-3 py-2 rounded-item cursor-pointer hover:bg-surface-hover outline-none focus:bg-surface-hover text-text-main"
                >
                  <RotateCcw size={16} /> Reset tiers to default
                </MenuItem>
              </Menu>
            </Popover>
          </MenuTrigger>
        )}

        {!isReadOnly && !remixingId && (
          <DialogTrigger>
            <RACButton
              onPress={onShare}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-accent-foreground px-5 py-2.5 rounded-panel font-medium transition-all shadow-panel"
            >
              <Share2 size={18} />
              {isSharing ? 'Saving...' : 'Share'}
            </RACButton>
            <ModalOverlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm flex items-center justify-center p-4 data-[entering]:animate-in data-[entering]:fade-in data-[exiting]:animate-out data-[exiting]:fade-out">
              <Modal className="bg-surface border border-border-main rounded-panel shadow-panel w-full max-w-md p-6 data-[entering]:animate-in data-[entering]:zoom-in-95 data-[exiting]:animate-out data-[exiting]:zoom-out-95 outline-none">
                <Dialog className="outline-none">
                  {({ close }) => (
                    <div className="flex flex-col gap-4">
                      <h2 className="text-xl font-bold text-text-main">Share your Tier List</h2>
                      <p className="text-text-muted text-sm">
                        Anyone with this link can view your tier list and submit their own remix.
                      </p>

                      {shareUrl ? (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="text"
                            value={shareUrl}
                            readOnly
                            className="flex-1 bg-bg-main border border-border-main rounded-item px-3 py-2 text-sm text-text-main focus:outline-none"
                          />
                          <button
                            onClick={onCopy}
                            className="bg-surface-hover hover:bg-border-main text-text-main p-2 rounded-item transition-colors"
                          >
                            {copied ? (
                              <Check size={18} className="text-success" />
                            ) : (
                              <Copy size={18} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="h-10 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}

                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={close}
                          className="px-4 py-2 bg-surface-hover hover:bg-border-main text-text-main rounded-item font-medium transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </Dialog>
              </Modal>
            </ModalOverlay>
          </DialogTrigger>
        )}

        {isReadOnly && (
          <button
            onClick={onRemix}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-accent-foreground px-5 py-2.5 rounded-panel font-medium transition-all shadow-panel"
          >
            <Edit3 size={18} />
            Remix this List
          </button>
        )}

        {remixingId && !isReadOnly && (
          <button
            onClick={onSubmitRemix}
            disabled={isSubmittingRemix}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-success hover:brightness-110 text-success-foreground px-5 py-2.5 rounded-panel font-medium transition-all shadow-panel disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Send size={18} />
            {isSubmittingRemix ? 'Submitting...' : 'Submit Remix'}
          </button>
        )}

        <button
          onClick={onExport}
          disabled={isExporting}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover border border-border-main text-text-main px-5 py-2.5 rounded-panel font-medium transition-all shadow-panel disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Download size={18} />
          {isExporting ? 'Exporting...' : 'Export Image'}
        </button>
      </div>
    </header>
  );
};

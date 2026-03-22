'use client';

import React from 'react';
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';
import { Inbox } from 'lucide-react';
import type { Tier } from '../../../types';

interface TierAssignSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tiers: Tier[];
  currentTierId: string | null;
  onSelect: (tierId: string | null) => void;
}

export function TierAssignSheet({ isOpen, onClose, tiers, currentTierId, onSelect }: TierAssignSheetProps) {
  const handleSelect = (tierId: string | null) => {
    onSelect(tierId);
    onClose();
  };

  return (
    <ModalOverlay
      isOpen={isOpen}
      isDismissable
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end coarse:items-end fine:items-center justify-center data-[entering]:animate-in data-[entering]:fade-in data-[exiting]:animate-out data-[exiting]:fade-out"
    >
      <Modal className="w-full coarse:max-w-none coarse:max-h-[85vh] coarse:rounded-t-panel coarse:rounded-b-none coarse:border-b-0 coarse:pb-[env(safe-area-inset-bottom)] fine:max-w-sm fine:rounded-panel bg-surface border border-border-main shadow-panel p-4 outline-none data-[entering]:animate-in data-[entering]:slide-in-from-bottom data-[exiting]:animate-out data-[exiting]:slide-out-to-bottom fine:data-[entering]:zoom-in-95 fine:data-[exiting]:zoom-out-95">
        <Dialog className="outline-none flex flex-col overflow-hidden">
          <Heading slot="title" className="text-lg font-bold text-text-main mb-3 shrink-0">
            Move to Tier
          </Heading>

          <div className="flex flex-col gap-1 overflow-y-auto min-h-0">
            {tiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => handleSelect(tier.id)}
                disabled={tier.id === currentTierId}
                className={`flex items-center gap-3 px-3 py-2 rounded-item transition-colors text-left ${
                  tier.id === currentTierId
                    ? 'bg-surface-hover text-text-muted cursor-default'
                    : 'hover:bg-surface-hover text-text-main active:bg-surface-hover'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-md flex-shrink-0 border border-border-main"
                  style={{ backgroundColor: tier.color }}
                />
                <span className="font-bold text-sm uppercase tracking-wide">{tier.label}</span>
                {tier.id === currentTierId && (
                  <span className="ml-auto text-xs text-text-muted font-medium shrink-0">Current</span>
                )}
              </button>
            ))}

            <div className="border-t border-border-main my-1" />

            <button
              onClick={() => handleSelect(null)}
              disabled={currentTierId === null}
              className={`flex items-center gap-3 px-3 py-2 rounded-item transition-colors text-left ${
                currentTierId === null
                  ? 'bg-surface-hover text-text-muted cursor-default'
                  : 'hover:bg-surface-hover text-text-main active:bg-surface-hover'
              }`}
            >
              <div className="w-8 h-8 rounded-md flex-shrink-0 border border-border-main bg-surface flex items-center justify-center">
                <Inbox size={16} className="text-text-muted" />
              </div>
              <span className="font-bold text-sm uppercase tracking-wide">Unranked</span>
              {currentTierId === null && (
                <span className="ml-auto text-xs text-text-muted font-medium shrink-0">Current</span>
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-3 py-2.5 rounded-item border border-border-main bg-surface-hover text-sm font-medium text-text-muted hover:brightness-110 transition-colors"
          >
            Cancel
          </button>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

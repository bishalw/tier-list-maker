'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import {
  Button as RACButton,
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
} from 'react-aria-components';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  title: string;
}

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, isDeleting, title }: ConfirmDeleteModalProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 data-[entering]:animate-in data-[entering]:fade-in data-[exiting]:animate-out data-[exiting]:fade-out"
    >
      <Modal className="bg-surface border border-border-main rounded-panel shadow-panel max-w-md w-full p-6 data-[entering]:animate-in data-[entering]:zoom-in-95 data-[exiting]:animate-out data-[exiting]:zoom-out-95 outline-none">
        <Dialog className="outline-none">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
              <Trash2 size={20} className="text-danger" />
            </div>
            <Heading slot="title" className="text-lg font-bold text-text-main">
              Delete Tier List
            </Heading>
          </div>

          <p className="text-text-muted mb-6">
            Are you sure you want to delete <strong className="text-text-main">&ldquo;{title}&rdquo;</strong>? This cannot be undone. All remixes will also be deleted.
          </p>

          <div className="flex items-center justify-end gap-3">
            <RACButton
              onPress={onClose}
              isDisabled={isDeleting}
              className="px-4 py-2 rounded-item text-sm font-medium text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              Cancel
            </RACButton>
            <RACButton
              onPress={onConfirm}
              isDisabled={isDeleting}
              className="px-4 py-2 rounded-item text-sm font-bold bg-danger hover:bg-danger/80 text-danger-foreground transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-danger"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </RACButton>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

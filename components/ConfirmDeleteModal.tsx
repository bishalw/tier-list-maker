'use client';

import React, { useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  title: string;
}

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, isDeleting, title }: ConfirmDeleteModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && cancelRef.current) {
      cancelRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border-main rounded-panel shadow-panel max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
            <Trash2 size={20} className="text-danger" />
          </div>
          <h2 className="text-lg font-bold text-text-main">Delete Tier List</h2>
        </div>

        <p className="text-text-muted mb-6">
          Are you sure you want to delete <strong className="text-text-main">&ldquo;{title}&rdquo;</strong>? This cannot be undone. All remixes will also be deleted.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-item text-sm font-medium text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-item text-sm font-bold bg-danger hover:bg-danger/80 text-danger-foreground transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

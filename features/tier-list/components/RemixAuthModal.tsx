'use client';

import React, { useState } from 'react';
import { Dialog, Modal, ModalOverlay } from 'react-aria-components';
import { X, Bookmark } from 'lucide-react';
import { LoginForm } from '../../auth/components/LoginForm';
import { SignUpForm } from '../../auth/components/SignUpForm';
import type { AuthIntentType } from '../../auth/authIntent';

interface Props {
  isOpen: boolean;
  nextPath: string;
  onClose: () => void;
  onAuthSuccess: () => void;
  pendingAction: AuthIntentType | null;
}

const ACTION_COPY: Record<AuthIntentType, { title: string; subtitle: string }> = {
  share: {
    title: 'Sign in to share this tier list',
    subtitle: 'Your draft stays on this page. Sign in to save it and generate a share link.',
  },
  'submit-remix': {
    title: 'Your ranking is ready',
    subtitle: 'Create an account to submit it and see how you compare.',
  },
};

export function RemixAuthModal({ isOpen, nextPath, onClose, onAuthSuccess, pendingAction }: Props) {
  const [activeTab, setActiveTab] = useState<'signup' | 'login'>('signup');

  if (!isOpen) return null;

  const content = pendingAction ? ACTION_COPY[pendingAction] : ACTION_COPY['submit-remix'];

  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm flex items-end sm:items-center justify-center p-4 data-[entering]:animate-in data-[entering]:fade-in data-[exiting]:animate-out data-[exiting]:fade-out"
    >
      <Modal className="bg-surface border border-border-main rounded-panel shadow-panel w-full max-w-md data-[entering]:animate-in data-[entering]:zoom-in-95 data-[exiting]:animate-out data-[exiting]:zoom-out-95 outline-none">
        <Dialog className="outline-none">
          {({ close }) => (
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-item">
                    <Bookmark size={18} className="text-accent" />
                  </div>
                  <div>
                    <h2 className="text-text-main font-bold text-base">{content.title}</h2>
                    <p className="text-text-muted text-sm mt-0.5">{content.subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => { close(); onClose(); }}
                  className="text-text-muted hover:text-text-main transition-colors p-1 rounded-item hover:bg-surface-hover"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Tab switcher */}
              <div className="bg-bg-main border border-border-main p-1 rounded-full flex items-center mb-5">
                <button
                  onClick={() => setActiveTab('signup')}
                  className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                    activeTab === 'signup'
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                    activeTab === 'login'
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  Log In
                </button>
              </div>

              {activeTab === 'signup' ? (
                <SignUpForm bare next={nextPath} onSuccess={onAuthSuccess} />
              ) : (
                <LoginForm bare next={nextPath} onSuccess={onAuthSuccess} />
              )}
            </div>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

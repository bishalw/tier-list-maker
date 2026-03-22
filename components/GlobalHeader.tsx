'use client';

import React from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

export function GlobalHeader() {
  const { user, isLoading } = useAuth();

  return (
    <nav className="border-b border-border-main bg-surface sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-accent rounded-item flex items-center justify-center text-accent-foreground font-black italic shadow-[var(--theme-accent-glow)] group-hover:scale-105 transition-all duration-300">
            T
          </div>
          <span className="text-lg font-black text-text-main tracking-tighter uppercase italic leading-none">
            TierList<span className="text-accent">Maker</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/create"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-item bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground transition-all font-bold text-[10px] uppercase tracking-[0.2em] border border-accent/20"
          >
            Create
          </Link>
          <div className="hidden md:block w-px h-4 bg-border-main mx-1" />
          <Link
            href="/profile"
            className="flex items-center gap-2 px-3 py-1.5 rounded-item hover:bg-surface-hover text-text-muted hover:text-text-main transition-all font-bold text-[10px] uppercase tracking-[0.2em]"
          >
            {user ? (
              <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-[9px] font-black">
                {(user.user_metadata?.full_name ?? user.email ?? 'U').charAt(0).toUpperCase()}
              </div>
            ) : (
              <User size={14} />
            )}
            <span className="hidden sm:inline">Profile</span>
          </Link>
          {!isLoading && !user && (
            <>
              <div className="w-px h-4 bg-border-main mx-1" />
              <Link
                href="/login"
                className="bg-accent hover:bg-accent-hover text-accent-foreground px-4 py-1.5 rounded-item font-black text-[10px] uppercase tracking-[0.2em] shadow-panel hover:shadow-[var(--theme-accent-glow)] transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

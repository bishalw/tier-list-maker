'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Eye, Copy, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileTierListCardProps {
  title: string;
  views?: number;
  remixes: number;
  thumbnailUrl?: string;
  onClick?: () => void;
  onRename?: (newTitle: string) => void;
  onDelete?: () => void;
}

export function ProfileTierListCard({ title, views, remixes, thumbnailUrl, onClick, onRename, onDelete }: ProfileTierListCardProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== title && onRename) {
      onRename(trimmed);
    } else {
      setDraft(title);
    }
    setIsRenaming(false);
  };

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative flex flex-col w-full h-full text-left bg-surface/40 hover:bg-surface border border-white/[0.05] hover:border-accent/50 rounded-panel overflow-hidden transition-colors duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] group"
    >
      <button
        onClick={onClick}
        className="flex flex-col w-full h-full text-left focus:outline-none focus:ring-2 focus:ring-focus-ring"
      >
        <div className="w-full aspect-video bg-bg-main relative flex-shrink-0 overflow-hidden">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/5 to-accent/20">
              <div className="flex flex-col items-center gap-2 opacity-20 group-hover:opacity-40 transition-opacity">
                <div className="w-16 h-1.5 bg-accent rounded-full" />
                <div className="w-10 h-1.5 bg-accent rounded-full" />
                <div className="w-14 h-1.5 bg-accent rounded-full" />
              </div>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-grow w-full bg-gradient-to-b from-transparent to-bg-main/20">
          {isRenaming ? null : (
            <h3 className="text-text-main font-bold text-lg line-clamp-2 mb-4 group-hover:text-accent transition-colors leading-tight">
              {title}
            </h3>
          )}

          <div className="mt-auto flex items-center gap-4 text-text-muted text-xs font-black uppercase tracking-widest">
            {views !== undefined && (
              <div className="flex items-center gap-1.5">
                <Eye size={14} className="text-accent" />
                <span>{views.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Copy size={14} className="text-warning" />
              <span>{remixes.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </button>

      {isRenaming && (
        <div className="absolute bottom-14 left-0 right-0 px-5">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 100))}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') {
                setDraft(title);
                setIsRenaming(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-text-main font-bold text-lg bg-surface border border-accent rounded-item px-2 py-1 outline-none"
            maxLength={100}
          />
        </div>
      )}

      {!isRenaming && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          {onRename && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDraft(title);
                setIsRenaming(true);
              }}
              className="p-1.5 rounded-item bg-surface/80 border border-border-main text-text-muted hover:text-accent transition-all"
              title="Rename"
            >
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-item bg-surface/80 border border-border-main text-text-muted hover:text-danger transition-all"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

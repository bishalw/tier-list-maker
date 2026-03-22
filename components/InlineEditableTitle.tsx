'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil } from 'lucide-react';

interface InlineEditableTitleProps {
  value: string;
  onChange: (value: string) => void;
  isReadOnly?: boolean;
}

export function InlineEditableTitle({ value, onChange, isReadOnly }: InlineEditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commit = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onChange(trimmed);
    } else {
      setDraft(value);
    }
    setIsEditing(false);
  }, [draft, value, onChange]);

  if (isReadOnly || !isEditing) {
    return (
      <button
        onClick={() => !isReadOnly && setIsEditing(true)}
        className={`group flex items-center gap-2 text-2xl md:text-3xl font-black text-text-main italic uppercase tracking-tighter text-left w-full ${
          isReadOnly ? 'cursor-default' : 'cursor-text hover:text-accent transition-colors'
        }`}
        disabled={isReadOnly}
        title={isReadOnly ? value : 'Click to edit title'}
      >
        <span className="truncate pr-1">{value}</span>
        {!isReadOnly && (
          <Pencil size={16} className="shrink-0 opacity-0 group-hover:opacity-60 transition-opacity text-text-muted" />
        )}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value.slice(0, 100))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') {
          setDraft(value);
          setIsEditing(false);
        }
      }}
      className="text-2xl md:text-3xl font-black text-text-main italic uppercase tracking-tighter bg-transparent border-b-2 border-accent outline-none w-full"
      maxLength={100}
    />
  );
}

import React from 'react';

interface ProfileHeaderProps {
  displayName: string;
  avatarUrl?: string;
  stats: {
    totalLists: number;
    totalRemixes: number;
  };
  onSignOut?: () => void;
}

export function ProfileHeader({ displayName, avatarUrl, stats, onSignOut }: ProfileHeaderProps) {
  return (
    <div className="bg-surface border border-border-main rounded-panel p-8 mb-8 shadow-panel">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-4xl md:text-5xl font-black border-4 border-border-main shadow-panel overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <h1 className="text-4xl font-black text-text-main italic uppercase tracking-tighter">
              {displayName}
            </h1>
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="px-4 py-1.5 rounded-item border border-border-main text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors text-xs font-bold uppercase tracking-widest"
              >
                Sign Out
              </button>
            )}
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8">
            <div className="flex flex-col">
              <span className="text-2xl font-black text-text-main">{stats.totalLists}</span>
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Lists</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-text-main">{stats.totalRemixes}</span>
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Remixes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';

interface ProfileHeaderProps {
  username: string;
  avatarUrl?: string;
  stats: {
    totalLists: number;
    totalRemixes: number;
    totalViews: number;
  };
}

export function ProfileHeader({ username, avatarUrl, stats }: ProfileHeaderProps) {
  return (
    <div className="bg-surface border border-border-main rounded-panel p-8 mb-8 shadow-panel">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-4xl md:text-5xl font-black border-4 border-border-main shadow-panel overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
            ) : (
              username.charAt(0).toUpperCase()
            )}
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl font-black text-text-main italic uppercase tracking-tighter mb-4">
            {username}
          </h1>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8">
            <div className="flex flex-col">
              <span className="text-2xl font-black text-text-main">{stats.totalLists}</span>
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Lists</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-text-main">{stats.totalRemixes}</span>
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Remixes</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-text-main">{stats.totalViews.toLocaleString()}</span>
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Views</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

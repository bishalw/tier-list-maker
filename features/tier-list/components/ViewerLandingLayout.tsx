'use client';

import React, { useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Users, User, Sparkles } from 'lucide-react';
import { TierRow } from '../../../components/TierRow';
import type { Item, Tier, Theme } from '../../../types';

interface Props {
  tiers: Tier[];
  creatorItems: Item[];
  communityItems: Item[] | null;
  isLoadingCommunity: boolean;
  remixCount: number;
  boardBackground: string;
  theme: Theme;
  onStartEditing: () => void;
}

function groupItemsByTier(items: Item[], tiers: Tier[]) {
  const grouped = new Map<string | null, Item[]>();
  grouped.set(null, []);
  tiers.forEach((t) => grouped.set(t.id, []));
  items.forEach((item) => {
    if (!grouped.has(item.tierId)) grouped.set(item.tierId, []);
    grouped.get(item.tierId)?.push(item);
  });
  return grouped;
}

interface ReadOnlyBoardProps {
  tiers: Tier[];
  items: Item[];
  boardBackground: string;
  droppablePrefix: string;
}

function ReadOnlyBoard({ tiers, items, boardBackground, droppablePrefix }: ReadOnlyBoardProps) {
  const grouped = groupItemsByTier(items, tiers);

  return (
    <Droppable
      droppableId={`${droppablePrefix}-tiers`}
      type={`${droppablePrefix}-tier`}
      direction="vertical"
      isDropDisabled
    >
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="rounded-panel overflow-hidden border border-border-main shadow-panel"
          style={{ backgroundColor: boardBackground }}
        >
          {tiers.map((tier, index) => (
            <TierRow
              key={tier.id}
              index={index}
              isReadOnly
              items={grouped.get(tier.id) || []}
              tier={tier}
              tiers={tiers}
            />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}

export function ViewerLandingLayout({
  tiers,
  creatorItems,
  communityItems,
  isLoadingCommunity,
  remixCount,
  boardBackground,
  onStartEditing,
}: Props) {
  const [mobileTab, setMobileTab] = useState<'creator' | 'community'>('creator');
  const showCommunity = remixCount >= 3;

  return (
    // Single DragDropContext wrapping both read-only boards — no actual dragging possible
    <DragDropContext onDragEnd={() => {}}>
      {/* Mobile tab toggle */}
      {showCommunity && (
        <div className="xl:hidden mb-4 flex items-center justify-center">
          <div className="bg-surface border border-border-main p-1 rounded-full flex items-center shadow-sm">
            <button
              onClick={() => setMobileTab('creator')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                mobileTab === 'creator'
                  ? 'bg-accent text-accent-foreground shadow-md'
                  : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
              }`}
            >
              <User size={15} />
              Creator&apos;s Ranking
            </button>
            <button
              onClick={() => setMobileTab('community')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                mobileTab === 'community'
                  ? 'bg-accent text-accent-foreground shadow-md'
                  : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
              }`}
            >
              <Users size={15} />
              Community ({remixCount})
            </button>
          </div>
        </div>
      )}

      {/* Desktop: two columns. Mobile: single column based on tab */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Creator column */}
        <div className={`flex-1 w-full min-w-0 ${showCommunity && mobileTab !== 'creator' ? 'hidden xl:block' : ''}`}>
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-text-muted">
            <User size={15} />
            <span>Creator&apos;s Ranking</span>
          </div>
          <ReadOnlyBoard
            tiers={tiers}
            items={creatorItems}
            boardBackground={boardBackground}
            droppablePrefix="creator"
          />
        </div>

        {/* Community column */}
        <div className={`flex-1 w-full min-w-0 ${showCommunity && mobileTab !== 'community' ? 'hidden xl:block' : ''} ${!showCommunity ? 'hidden xl:block' : ''}`}>
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-text-muted">
            <Users size={15} />
            <span>
              {showCommunity ? `Community Consensus (${remixCount} remixes)` : 'Community'}
            </span>
          </div>

          {isLoadingCommunity ? (
            <div className="rounded-panel border border-border-main shadow-panel flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : showCommunity && communityItems ? (
            <ReadOnlyBoard
              tiers={tiers}
              items={communityItems}
              boardBackground={boardBackground}
              droppablePrefix="community"
            />
          ) : (
            <div
              className="rounded-panel border border-border-main shadow-panel flex flex-col items-center justify-center py-20 gap-3 text-center px-6"
              style={{ backgroundColor: boardBackground }}
            >
              <Sparkles size={32} className="text-accent opacity-60" />
              <p className="text-text-main font-medium">Be the first to remix this</p>
              <p className="text-text-muted text-sm">
                Once {3 - remixCount} more {3 - remixCount === 1 ? 'person remixes' : 'people remix'} this list, the community consensus will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={onStartEditing}
          className="flex items-center gap-2 px-8 py-3 bg-accent text-accent-foreground rounded-full font-semibold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all"
        >
          <Sparkles size={16} />
          Make your own ranking
        </button>
      </div>
    </DragDropContext>
  );
}

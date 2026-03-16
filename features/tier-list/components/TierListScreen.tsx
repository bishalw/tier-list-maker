'use client';

import React from 'react';
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd';
import { Plus, User, Users } from 'lucide-react';
import { TierListToolbar } from './TierListToolbar';
import { useTierListScreen } from '../hooks/useTierListScreen';
import { TierRow } from '../../../components/TierRow';
import { UnrankedPool } from '../../../components/UnrankedPool';
import { EditTierModal } from '../../../components/EditTierModal';

export function TierListScreen() {
  const {
    addTier,
    boardBackground,
    effectiveIsReadOnly,
    groupedItems,
    isLoadingCommunity,
    isLoadingShared,
    isMounted,
    items,
    moveItem,
    remixCount,
    reorderTiers,
    routeState,
    setViewMode,
    tiers,
    viewMode,
  } = useTierListScreen();
  const [editingTierId, setEditingTierId] = React.useState<string | null>(null);

  const handleDragEnd = (result: DropResult) => {
    if (effectiveIsReadOnly) return;

    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    if (type === 'tier') {
      reorderTiers(source.index, destination.index);
      return;
    }

    const sourceTierId = source.droppableId === 'unranked-pool' ? null : source.droppableId;
    const destinationTierId =
      destination.droppableId === 'unranked-pool' ? null : destination.droppableId;

    moveItem(sourceTierId, destinationTierId, source.index, destination.index);
  };

  if (isLoadingShared) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center text-text-main">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Loading Tier List...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main text-text-main font-sans selection:bg-blue-500/30 pb-20 transition-colors duration-300">
      <div className="sticky top-0 z-40 bg-bg-main/80 backdrop-blur-xl border-b border-border-main shadow-sm transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-4">
          <TierListToolbar
            isReadOnly={effectiveIsReadOnly}
            listId={routeState.targetListId}
            remixingId={routeState.remixingId}
          />
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        {effectiveIsReadOnly && !routeState.remixingId && (
          <div className="mb-6 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-3 rounded-panel flex items-center justify-between">
            <p>
              You are viewing a shared tier list in <strong>Read-Only</strong> mode.
            </p>
          </div>
        )}

        {routeState.remixingId && (
          <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-panel flex items-center justify-between">
            <p>
              You are remixing a tier list. Drag items to your preferred tiers and click{' '}
              <strong>Submit Remix</strong> when done.
            </p>
          </div>
        )}

        {viewMode === 'compare' && (
          <div className="mb-6 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-4 py-3 rounded-panel flex items-center justify-between">
            <p>
              You are viewing <strong>Your Remix</strong>. The arrows indicate how your ranking
              differs from the original creator&apos;s list.
            </p>
          </div>
        )}

        {(remixCount > 0 || routeState.compareId) && !routeState.remixingId && (
          <div className="mb-6 flex items-center justify-center">
            <div className="bg-surface border border-border-main p-1 rounded-full flex items-center shadow-sm">
              <button
                onClick={() => setViewMode('creator')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  viewMode === 'creator'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
                }`}
              >
                <User size={16} />
                Creator&apos;s List
              </button>

              {routeState.compareId && (
                <button
                  onClick={() => setViewMode('compare')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    viewMode === 'compare'
                      ? 'bg-green-500 text-white shadow-md'
                      : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
                  }`}
                >
                  <User size={16} />
                  Your Remix
                </button>
              )}

              <button
                onClick={() => setViewMode('community')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  viewMode === 'community'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
                }`}
              >
                <Users size={16} />
                Community Consensus ({remixCount})
              </button>
            </div>
          </div>
        )}

        {isLoadingCommunity && viewMode === 'community' && (
          <div className="flex justify-center my-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-col xl:flex-row gap-8 items-start">
            <div className="flex-1 w-full min-w-0">
              <div
                className="rounded-panel overflow-hidden border border-border-main shadow-panel transition-all duration-300"
                style={{ backgroundColor: boardBackground }}
              >
                <Droppable
                  droppableId="tiers"
                  type="tier"
                  direction="vertical"
                  isDropDisabled={effectiveIsReadOnly}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex flex-col"
                      id="tier-list-container"
                      style={{ backgroundColor: boardBackground }}
                    >
                      {tiers.map((tier, index) => (
                        <TierRow
                          key={tier.id}
                          index={index}
                          isReadOnly={effectiveIsReadOnly}
                          items={groupedItems.get(tier.id) || []}
                          onEdit={effectiveIsReadOnly ? undefined : setEditingTierId}
                          originalItems={viewMode === 'compare' ? items : undefined}
                          tier={tier}
                          tiers={tiers}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {!effectiveIsReadOnly && (
                  <button
                    onClick={addTier}
                    className="w-full py-4 flex items-center justify-center gap-2 text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors font-medium border-t border-border-main/50"
                  >
                    <Plus size={18} /> Add a Tier
                  </button>
                )}
              </div>
            </div>

            <div className="w-full xl:w-[400px] shrink-0 xl:sticky xl:top-[120px] xl:max-h-[calc(100vh-140px)] flex flex-col">
              <UnrankedPool
                isReadOnly={effectiveIsReadOnly}
                items={groupedItems.get(null) || []}
                originalItems={viewMode === 'compare' ? items : undefined}
                tiers={tiers}
              />
            </div>
          </div>
        </DragDropContext>
      </div>

      <EditTierModal editingTierId={editingTierId} onClose={() => setEditingTierId(null)} />
    </div>
  );
}

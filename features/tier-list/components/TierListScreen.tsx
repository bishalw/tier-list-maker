'use client';

import React from 'react';
import { DragDropContext, Droppable, type DropResult, type DragStart } from '@hello-pangea/dnd';
import { Plus, User, Users } from 'lucide-react';
import { InlineEditableTitle } from '../../../components/InlineEditableTitle';
import { TierListToolbar } from './TierListToolbar';
import { ViewerLandingLayout } from './ViewerLandingLayout';
import { useTierListScreen } from '../hooks/useTierListScreen';
import { getEffectiveBoardBackground } from '../../../constants/theme';
import { TierRow } from '../../../components/TierRow';
import { UnrankedPool } from '../../../components/UnrankedPool';
import { EditTierModal } from '../../../components/EditTierModal';

export function TierListScreen() {
  const {
    addTier,
    boardBackground,
    communityItems,
    effectiveIsReadOnly,
    groupedItems,
    handleStartEditing,
    hasSharedListContext,
    hasStartedEditing,
    isLoadingCommunity,
    isLoadingShared,
    isMounted,
    isViewer,
    items,
    originalItems,
    remixCount,
    reorderTiers,
    routeState,
    refreshCurrentUser,
    setTitle,
    setViewMode,
    title,
    tiers,
    theme,
    viewMode,
    moveItem,
  } = useTierListScreen();
  const [editingTierId, setEditingTierId] = React.useState<string | null>(null);
  const [activeDragId, setActiveDragId] = React.useState<string | null>(null);
  const effectiveBoardBackground = getEffectiveBoardBackground(theme, boardBackground);

  const showLandingLayout = isViewer && !hasStartedEditing && hasSharedListContext;

  const handleDragStart = (start: DragStart) => {
    setActiveDragId(start.draggableId);
    document.body.style.cursor = 'grabbing';
  };

  const handleDragEnd = (result: DropResult) => {
    setActiveDragId(null);
    document.body.style.cursor = '';

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
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p>Loading Tier List...</p>
        </div>
      </div>
    );
  }

  // Diff items: when viewing "yours" as a viewer, show diff against original
  // When viewing "compare", show diff against the store items (creator's)
  const diffOriginalItems =
    viewMode === 'compare'
      ? items
      : viewMode === 'yours' && isViewer
        ? (originalItems ?? undefined)
        : undefined;

  return (
    <div className="min-h-screen bg-bg-main text-text-main font-sans selection:bg-accent/30 pb-20 transition-colors duration-300">
      <div className="sticky top-0 z-40 bg-bg-main/80 backdrop-blur-xl border-b border-border-main shadow-sm transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="mb-2">
            <InlineEditableTitle
              value={title}
              onChange={setTitle}
              isReadOnly={effectiveIsReadOnly || (isViewer && !hasStartedEditing)}
            />
          </div>
          <TierListToolbar
            isReadOnly={effectiveIsReadOnly || (isViewer && !hasStartedEditing)}
            isViewer={isViewer}
            listId={routeState.targetListId}
            onAuthSuccess={refreshCurrentUser}
            remixingId={routeState.remixingId}
            title={title}
          />
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        {/* Viewer context header */}
        {isViewer && !hasStartedEditing && (
          <div className="mb-4 flex items-center gap-2 text-sm text-text-muted">
            <User size={14} />
            <span>Viewing someone&apos;s list</span>
            <span className="text-text-muted/50">·</span>
            <button
              onClick={handleStartEditing}
              className="text-accent hover:text-accent/80 transition-colors font-medium"
            >
              Make it yours
            </button>
          </div>
        )}

        {routeState.remixingId && (
          <div className="mb-6 bg-success-soft border border-success text-success-foreground px-4 py-3 rounded-panel flex items-center justify-between">
            <p>
              You are remixing a tier list. Drag items to your preferred tiers and click{' '}
              <strong>Submit Remix</strong> when done.
            </p>
          </div>
        )}

        {viewMode === 'compare' && (
          <div className="mb-6 bg-warning-soft border border-warning text-warning-foreground px-4 py-3 rounded-panel flex items-center justify-between">
            <p>
              You are viewing <strong>Your Remix</strong>. The arrows indicate how your ranking
              differs from the original creator&apos;s list.
            </p>
          </div>
        )}

        {/* Landing layout: side-by-side creator + community before user starts editing */}
        {showLandingLayout ? (
          <ViewerLandingLayout
            tiers={tiers}
            creatorItems={items}
            communityItems={communityItems}
            isLoadingCommunity={isLoadingCommunity}
            remixCount={remixCount}
            boardBackground={effectiveBoardBackground}
            theme={theme}
            onStartEditing={handleStartEditing}
          />
        ) : (
          <>
            {/* Pill toggle — viewer who has started editing */}
            {isViewer && hasStartedEditing && (
              <div className="mb-6 flex items-center justify-center">
                <div className="bg-surface border border-border-main p-1 rounded-full flex items-center shadow-sm">
                  <button
                    onClick={() => setViewMode('yours')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      viewMode === 'yours'
                        ? 'bg-accent text-accent-foreground shadow-md'
                        : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
                    }`}
                  >
                    <User size={16} />
                    Yours
                  </button>

                  <button
                    onClick={() => setViewMode('creator')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      viewMode === 'creator'
                        ? 'bg-accent text-accent-foreground shadow-md'
                        : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
                    }`}
                  >
                    <User size={16} />
                    Original
                  </button>

                  {remixCount >= 3 && (
                    <button
                      onClick={() => setViewMode('community')}
                      className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${
                        viewMode === 'community'
                          ? 'bg-accent text-accent-foreground shadow-md'
                          : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
                      }`}
                    >
                      <Users size={16} />
                      Community ({remixCount})
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Pill toggle — existing compare / community flow (non-viewer) */}
            {!isViewer && (remixCount > 0 || routeState.compareId) && !routeState.remixingId && (
              <div className="mb-6 flex items-center justify-center">
                <div className="bg-surface border border-border-main p-1 rounded-full flex items-center shadow-sm">
                  <button
                    onClick={() => setViewMode('creator')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      viewMode === 'creator'
                        ? 'bg-accent text-accent-foreground shadow-md'
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
                          ? 'bg-success text-success-foreground shadow-md'
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
                        ? 'bg-accent text-accent-foreground shadow-md'
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
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="flex flex-col xl:flex-row gap-8 items-start">
                <div className="flex-1 w-full min-w-0">
                  <div
                    className="rounded-panel overflow-hidden border border-border-main shadow-panel transition-all duration-300"
                    style={{ backgroundColor: effectiveBoardBackground }}
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
                          style={{ backgroundColor: effectiveBoardBackground }}
                        >
                          {tiers.map((tier, index) => (
                            <TierRow
                              key={tier.id}
                              index={index}
                              isReadOnly={effectiveIsReadOnly}
                              items={groupedItems.get(tier.id) || []}
                              onEdit={effectiveIsReadOnly ? undefined : setEditingTierId}
                              originalItems={diffOriginalItems}
                              tier={tier}
                              tiers={tiers}
                              activeDragId={activeDragId}
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
                    originalItems={diffOriginalItems}
                    tiers={tiers}
                    activeDragId={activeDragId}
                  />
                </div>
              </div>
            </DragDropContext>
          </>
        )}
      </div>

      <EditTierModal editingTierId={editingTierId} onClose={() => setEditingTierId(null)} />
    </div>
  );
}

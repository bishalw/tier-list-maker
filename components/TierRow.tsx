import React, { memo } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Settings, GripVertical } from 'lucide-react';
import { Tier, Item } from '../types';
import { DraggableItem } from './DraggableItem';

interface Props {
  tier: Tier;
  index: number;
  items: Item[];
  onEdit?: (id: string) => void;
  isReadOnly?: boolean;
  originalItems?: Item[];
  tiers?: Tier[];
}

export const TierRow = memo(({ tier, index, items, onEdit, isReadOnly, originalItems, tiers }: Props) => {
  return (
    <Draggable draggableId={tier.id} index={index} isDragDisabled={isReadOnly}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex border-b border-border-main min-h-[100px] group/row bg-transparent transition-colors duration-300 ${snapshot.isDragging ? 'z-50 shadow-panel ring-2 ring-focus-ring bg-surface' : ''}`}
        >
          {/* Tier Label (Drag Handle) */}
          <div
            {...provided.dragHandleProps}
            className={`w-24 md:w-32 flex-shrink-0 flex flex-col items-center justify-center relative group/label border-r border-border-main ${isReadOnly ? '' : 'cursor-grab active:cursor-grabbing'}`}
            style={{ backgroundColor: tier.color }}
          >
            <span className="text-gray-900 font-black text-xl md:text-3xl text-center break-words w-full px-2 drop-shadow-sm pointer-events-none">
              {tier.label}
            </span>

            {/* Tier Controls (visible on hover) */}
            {!isReadOnly && onEdit && (
              <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover/label:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(tier.id);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="p-1.5 bg-overlay hover:brightness-110 rounded-md text-accent-foreground backdrop-blur-sm transition-colors cursor-pointer"
                  title="Settings"
                >
                  <Settings size={14} />
                </button>
              </div>
            )}

            {/* Grip Icon */}
            {!isReadOnly && (
              <div className="absolute left-1 opacity-0 group-hover/label:opacity-100 transition-opacity text-text-muted/60 pointer-events-none">
                <GripVertical size={18} />
              </div>
            )}
          </div>

          {/* Tier Items Dropzone */}
          <Droppable droppableId={tier.id} direction="horizontal" type="item" isDropDisabled={isReadOnly}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-1 flex flex-wrap content-start gap-3 p-3 transition-colors ${
                  snapshot.isDraggingOver ? 'bg-border-main/10' : ''
                }`}
              >
                {items.map((item, idx) => (
                  <DraggableItem 
                    key={item.id} 
                    item={item} 
                    index={idx} 
                    isReadOnly={isReadOnly} 
                    originalItem={originalItems?.find(i => i.id === item.id)}
                    tiers={tiers}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  );
});

TierRow.displayName = 'TierRow';

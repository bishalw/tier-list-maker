import React, { memo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { X, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Item, Tier } from '../types';
import { useBoardStore } from '../store/useBoardStore';
import { usePrefsStore } from '../store/usePrefsStore';

interface Props {
  item: Item;
  index: number;
  isReadOnly?: boolean;
  originalItem?: Item;
  tiers?: Tier[];
  activeDragId?: string | null;
  onTap?: (itemId: string) => void;
}

export const DraggableItem = memo(({ item, index, isReadOnly, originalItem, tiers, activeDragId, onTap }: Props) => {
  const deleteItem = useBoardStore(state => state.deleteItem);
  const itemSize = usePrefsStore(state => state.itemSize);
  const imageFit = usePrefsStore(state => state.imageFit);

  const sizeClasses = {
    small: 'w-16 h-16 md:w-20 md:h-20',
    medium: 'w-20 h-20 md:w-24 md:h-24',
    large: 'w-24 h-24 md:w-32 md:h-32',
  };

  // Calculate rank difference for compare mode
  let rankDiff = 0;
  let showDiff = false;
  
  if (originalItem && tiers && originalItem.tierId !== null) {
    showDiff = true;
    const originalRank = tiers.findIndex(t => t.id === originalItem.tierId);
    const currentRank = item.tierId ? tiers.findIndex(t => t.id === item.tierId) : tiers.length;
    
    // If either rank is -1 (tier not found, e.g., deleted tier), treat as unranked
    const safeOriginalRank = originalRank === -1 ? tiers.length : originalRank;
    const safeCurrentRank = currentRank === -1 ? tiers.length : currentRank;
    
    rankDiff = safeOriginalRank - safeCurrentRank;
  }

  const isDimmed = activeDragId != null && activeDragId !== item.id;

  return (
    <Draggable draggableId={item.id} index={index} isDragDisabled={isReadOnly}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style}
          onClick={() => onTap?.(item.id)}
          className={`relative group ${isReadOnly ? '' : 'cursor-grab active:cursor-grabbing'} rounded-item overflow-hidden bg-surface-hover border flex items-center justify-center transition-[box-shadow,border-color,background-color,opacity] duration-150 ${
            snapshot.isDragging ? 'border-drag-highlight ring-2 ring-drag-highlight shadow-floating z-50 animate-glow-pulse' : 'border-border-main hover:ring-2 hover:ring-focus-ring'
          } ${
            isDimmed ? 'opacity-40' : ''
          } ${
            item.type === 'image' ? sizeClasses[itemSize] : 'px-4 py-2 min-w-[80px] min-h-[40px]'
          }`}
        >
          {item.type === 'image' ? (
            <img 
              src={item.content} 
              alt="Tier item" 
              className={`w-full h-full pointer-events-none ${imageFit === 'contain' ? 'object-contain bg-surface' : 'object-cover'}`} 
            />
          ) : (
            <span className="text-text-main font-medium text-center break-words max-w-full pointer-events-none px-2">{item.content}</span>
          )}

          {showDiff && rankDiff !== 0 && (
            <div className={`absolute bottom-1 right-1 rounded-full p-0.5 flex items-center justify-center shadow-sm backdrop-blur-md ${
              rankDiff > 0 ? 'bg-success text-success-foreground' : 
              rankDiff < 0 ? 'bg-danger text-danger-foreground' : 
              'bg-warning text-warning-foreground'
            }`}>
              {rankDiff > 0 ? <ArrowUp size={14} strokeWidth={3} /> : 
               rankDiff < 0 ? <ArrowDown size={14} strokeWidth={3} /> : 
               <Minus size={14} strokeWidth={3} />}
            </div>
          )}

          {!isReadOnly && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteItem(item.id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute top-1 right-1 bg-danger text-danger-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}
    </Draggable>
  );
});

DraggableItem.displayName = 'DraggableItem';

import React, { memo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { X, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Item, Tier } from '../types';
import { useTierStore } from '../store/useTierStore';

interface Props {
  item: Item;
  index: number;
  isReadOnly?: boolean;
  originalItem?: Item;
  tiers?: Tier[];
}

export const DraggableItem = memo(({ item, index, isReadOnly, originalItem, tiers }: Props) => {
  const deleteItem = useTierStore(state => state.deleteItem);
  const itemSize = useTierStore(state => state.itemSize);
  const imageFit = useTierStore(state => state.imageFit);

  const sizeClasses = {
    small: 'w-16 h-16 md:w-20 md:h-20',
    medium: 'w-20 h-20 md:w-24 md:h-24',
    large: 'w-24 h-24 md:w-32 md:h-32',
  };

  // Calculate rank difference for compare mode
  let rankDiff = 0;
  let showDiff = false;
  
  if (originalItem && tiers) {
    showDiff = true;
    const originalRank = originalItem.tierId ? tiers.findIndex(t => t.id === originalItem.tierId) : tiers.length;
    const currentRank = item.tierId ? tiers.findIndex(t => t.id === item.tierId) : tiers.length;
    
    // If either rank is -1 (tier not found, e.g., deleted tier), treat as unranked
    const safeOriginalRank = originalRank === -1 ? tiers.length : originalRank;
    const safeCurrentRank = currentRank === -1 ? tiers.length : currentRank;
    
    rankDiff = safeOriginalRank - safeCurrentRank;
  }

  return (
    <Draggable draggableId={item.id} index={index} isDragDisabled={isReadOnly}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`relative group ${isReadOnly ? '' : 'cursor-grab active:cursor-grabbing'} rounded-item overflow-hidden bg-surface-hover border flex items-center justify-center transition-shadow ${
            snapshot.isDragging ? 'border-blue-500 shadow-floating z-50 scale-105 rotate-2' : 'border-border-main hover:ring-2 hover:ring-blue-500'
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

          {showDiff && (
            <div className={`absolute bottom-1 right-1 rounded-full p-0.5 flex items-center justify-center shadow-sm backdrop-blur-md ${
              rankDiff > 0 ? 'bg-green-500/80 text-white' : 
              rankDiff < 0 ? 'bg-red-500/80 text-white' : 
              'bg-gray-500/80 text-white'
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
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
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

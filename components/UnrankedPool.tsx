import React, { memo, useState, useRef, useMemo } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Image as ImageIcon, Plus, Search } from 'lucide-react';
import { Tier, Item } from '../types';
import { DraggableItem } from './DraggableItem';
import { useBoardStore } from '../store/useBoardStore';

interface Props {
  items: Item[];
  isReadOnly?: boolean;
  originalItems?: Item[];
  tiers?: Tier[];
  activeDragId?: string | null;
}

export const UnrankedPool = memo(({ items, isReadOnly, originalItems, tiers, activeDragId }: Props) => {
  const [textInput, setTextInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addItems = useBoardStore(state => state.addItems);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => {
      if (item.type === 'text') {
        return item.content.toLowerCase().includes(query);
      }
      return false; // Hide images when searching text
    });
  }, [items, searchQuery]);

  const handleAddTextItem = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isReadOnly) return;

    const newContents = textInput
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const newItems: Item[] = newContents.map((content, idx) => ({
      id: `item-${Date.now()}-${idx}-${Math.random()}`,
      content,
      type: 'text',
      tierId: null,
    }));

    addItems(newItems);
    setTextInput('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newItem: Item = {
            id: `item-${Date.now()}-${Math.random()}`,
            content: event.target.result as string,
            type: 'image',
            tierId: null,
          };
          addItems([newItem]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
            Unranked Pool
            <span className="bg-surface text-text-muted text-xs py-1 px-2 rounded-full font-medium">
              {items.length}
            </span>
          </h2>
          
          <div className="relative flex-1 max-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="bg-surface border border-border-main rounded-item pl-9 pr-3 py-1.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring w-full transition-all"
            />
          </div>
        </div>

        {/* Add Item Controls */}
        {!isReadOnly && (
          <div className="flex flex-col gap-3">
            <form onSubmit={handleAddTextItem} className="flex items-start gap-2 w-full">
              <div className="relative flex-1">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddTextItem(e);
                    }
                  }}
                  placeholder="Paste list (comma or newline separated)..."
                  className="bg-surface border border-border-main rounded-item px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring w-full min-h-[40px] max-h-[150px] resize-y"
                  rows={1}
                />
              </div>
              <button
                type="submit"
                disabled={!textInput.trim()}
                className="bg-surface hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed text-text-main p-2 rounded-item transition-colors h-[40px] flex-shrink-0 border border-border-main"
              >
                <Plus size={18} />
              </button>
            </form>

            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover border border-border-main text-text-main px-4 py-2 rounded-item text-sm font-medium transition-colors h-10 w-full"
            >
              <ImageIcon size={16} />
              <span>Add Images</span>
            </button>
          </div>
        )}
      </div>

      {/* Pool Dropzone */}
      <Droppable droppableId="unranked-pool" direction="horizontal" type="item" isDropDisabled={isReadOnly}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-[200px] overflow-y-auto bg-surface/50 border-2 border-dashed rounded-panel p-4 flex flex-wrap content-start gap-3 transition-all duration-200 ${
              snapshot.isDraggingOver ? 'border-drag-highlight bg-drag-ghost shadow-inner' : 'border-border-main'
            }`}
          >
            {items.length === 0 && !snapshot.isDraggingOver ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-text-muted py-12 pointer-events-none">
                <ImageIcon size={48} className="mb-4 opacity-20" />
                <p>{isReadOnly ? 'No unranked items.' : 'Drag and drop items here, or add new ones above.'}</p>
              </div>
            ) : filteredItems.length === 0 && searchQuery ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-text-muted py-12 pointer-events-none">
                <Search size={32} className="mb-4 opacity-20" />
                <p>No items match &quot;{searchQuery}&quot;</p>
              </div>
            ) : (
              filteredItems.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <DraggableItem 
                    item={item} 
                    index={idx} 
                    isReadOnly={isReadOnly} 
                    originalItem={originalItems?.find(i => i.id === item.id)}
                    tiers={tiers}
                    activeDragId={activeDragId}
                  />
                </React.Fragment>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
});

UnrankedPool.displayName = 'UnrankedPool';

import React, { memo, useState, useRef, useMemo } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Image as ImageIcon, Plus, Search } from 'lucide-react';
import {
  Button as RACButton,
  Input,
  Label,
  SearchField,
  TextArea,
  TextField,
} from 'react-aria-components';
import { Tier, Item } from '../types';
import { DraggableItem } from './DraggableItem';
import { useBoardStore } from '../store/useBoardStore';
import { createItemId } from '../lib/ids';
import {
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_ITEMS,
  MAX_TEXT_ITEM_CONTENT_LENGTH,
} from '../constants/board';

interface Props {
  items: Item[];
  isReadOnly?: boolean;
  originalItems?: Item[];
  tiers?: Tier[];
  activeDragId?: string | null;
  onItemTap?: (itemId: string) => void;
}

export const UnrankedPool = memo(({ items, isReadOnly, originalItems, tiers, activeDragId, onItemTap }: Props) => {
  const [textInput, setTextInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addItems = useBoardStore(state => state.addItems);
  const totalItemCount = useBoardStore(state => state.items.length);
  const remainingCapacity = Math.max(0, MAX_ITEMS - totalItemCount);

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

    setAddError(null);

    const newContents = textInput
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s.slice(0, MAX_TEXT_ITEM_CONTENT_LENGTH));

    if (remainingCapacity === 0) {
      setAddError(`This board already holds the maximum of ${MAX_ITEMS} items.`);
      return;
    }

    const accepted = newContents.slice(0, remainingCapacity);
    const newItems: Item[] = accepted.map((content) => ({
      id: createItemId(),
      content,
      type: 'text',
      tierId: null,
    }));

    // One store update for the whole paste, so undo treats it as a single step.
    addItems(newItems);

    if (accepted.length < newContents.length) {
      setAddError(`Only ${accepted.length} of ${newContents.length} items fit — the board is full.`);
    }

    setTextInput('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const files = e.target.files;
    if (!files) return;

    setAddError(null);

    const selected = Array.from(files);

    // Images are stored inline as data URLs, so an unbounded upload would blow
    // the localStorage quota and the size of every save.
    const tooLarge = selected.filter((file) => file.size > MAX_IMAGE_UPLOAD_BYTES);
    const notImages = selected.filter((file) => !file.type.startsWith('image/'));
    const accepted = selected
      .filter((file) => file.size <= MAX_IMAGE_UPLOAD_BYTES && file.type.startsWith('image/'))
      .slice(0, remainingCapacity);

    const rejectionMessages: string[] = [];
    if (notImages.length > 0) {
      rejectionMessages.push(`${notImages.length} file(s) were not images`);
    }
    if (tooLarge.length > 0) {
      const limitMb = Math.round(MAX_IMAGE_UPLOAD_BYTES / 100_000) / 10;
      rejectionMessages.push(`${tooLarge.length} file(s) were larger than ${limitMb}MB`);
    }
    if (accepted.length < selected.length - notImages.length - tooLarge.length) {
      rejectionMessages.push('the board is full');
    }
    if (rejectionMessages.length > 0) {
      setAddError(`Skipped: ${rejectionMessages.join(', ')}.`);
    }

    Promise.all(
      accepted.map(
        (file) =>
          new Promise<Item | null>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              const content = event.target?.result;
              resolve(
                typeof content === 'string'
                  ? { id: createItemId(), content, type: 'image', tierId: null }
                  : null
              );
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          })
      )
    )
      .then((results) => {
        const newItems = results.filter((item): item is Item => item !== null);
        if (newItems.length > 0) {
          addItems(newItems);
        }
        if (newItems.length < accepted.length) {
          setAddError('Some images could not be read.');
        }
      })
      .catch(() => setAddError('Some images could not be read.'));

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
          
          <SearchField
            aria-label="Search unranked items"
            value={searchQuery}
            onChange={setSearchQuery}
            className="relative flex-1 max-w-[200px]"
          >
            <Search
              size={14}
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <Input
              placeholder="Search..."
              className="bg-surface border border-border-main rounded-item pl-9 pr-3 py-1.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring w-full transition-all"
            />
          </SearchField>
        </div>

        {/* Add Item Controls */}
        {!isReadOnly && (
          <div className="flex flex-col gap-3">
            <form onSubmit={handleAddTextItem} className="flex items-start gap-2 w-full">
              <TextField className="relative flex-1">
                <Label className="sr-only">Add unranked items</Label>
                <TextArea
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
              </TextField>
              <RACButton
                type="submit"
                aria-label="Add items"
                isDisabled={!textInput.trim()}
                className="bg-surface hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed text-text-main p-2 rounded-item transition-colors h-[40px] flex-shrink-0 border border-border-main outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                <Plus size={18} />
              </RACButton>
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

            {addError && (
              <p role="alert" className="text-xs text-danger">
                {addError}
              </p>
            )}
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
                    onTap={onItemTap}
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

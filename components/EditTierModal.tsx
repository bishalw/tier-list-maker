import React from 'react';
import { Modal, ModalOverlay, Dialog, Heading, Button as RACButton, TextField, Label, Input } from 'react-aria-components';
import { Trash2 } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { useTierStore } from '../store/useTierStore';

interface Props {
  editingTierId: string | null;
  onClose: () => void;
}

export const EditTierModal = ({ editingTierId, onClose }: Props) => {
  const tiers = useTierStore(state => state.tiers);
  const updateTier = useTierStore(state => state.updateTier);
  const deleteTier = useTierStore(state => state.deleteTier);

  const editingTier = tiers.find((t) => t.id === editingTierId);

  return (
    <ModalOverlay
      isOpen={!!editingTierId}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm flex items-center justify-center p-4 data-[entering]:animate-in data-[entering]:fade-in data-[exiting]:animate-out data-[exiting]:fade-out"
    >
      <Modal className="bg-surface rounded-panel p-6 w-full max-w-sm border border-border-main shadow-panel data-[entering]:animate-in data-[entering]:zoom-in-95 data-[exiting]:animate-out data-[exiting]:zoom-out-95 outline-none">
        <Dialog className="outline-none">
          {({ close }) => (
            <>
              <Heading slot="title" className="text-xl font-bold text-text-main mb-6">Edit Tier</Heading>
              {editingTier && (
                <div className="space-y-5">
                  <TextField 
                    value={editingTier.label} 
                    onChange={(val) => updateTier(editingTier.id, { label: val })}
                    className="flex flex-col gap-1.5"
                  >
                    <Label className="text-sm font-medium text-text-muted">Label</Label>
                    <Input className="w-full bg-bg-main border border-border-main rounded-item px-4 py-2.5 text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring" />
                  </TextField>
                  
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-medium text-text-muted">Color</label>
                    <div className="flex justify-center">
                      <HexColorPicker 
                        color={editingTier.color} 
                        onChange={(color) => updateTier(editingTier.id, { color })} 
                        className="!w-full"
                      />
                    </div>
                    <TextField 
                      value={editingTier.color} 
                      onChange={(val) => updateTier(editingTier.id, { color: val })}
                      className="flex-1"
                    >
                      <Input 
                        aria-label="Tier Color Hex"
                        className="w-full bg-bg-main border border-border-main rounded-item px-4 py-2.5 text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring uppercase" 
                      />
                    </TextField>
                  </div>

                  <div className="flex justify-between pt-6 mt-2 border-t border-border-main">
                    <RACButton
                      onPress={() => {
                        deleteTier(editingTier.id);
                        close();
                      }}
                      className="text-danger hover:brightness-110 flex items-center gap-1.5 px-3 py-2 rounded-item hover:bg-danger-soft transition-colors font-medium outline-none focus-visible:ring-2 focus-visible:ring-danger"
                    >
                      <Trash2 size={16} /> Delete
                    </RACButton>
                    <RACButton
                      onPress={close}
                      className="bg-accent hover:bg-accent-hover text-accent-foreground px-5 py-2 rounded-item transition-colors font-medium outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                    >
                      Done
                    </RACButton>
                  </div>
                </div>
              )}
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};

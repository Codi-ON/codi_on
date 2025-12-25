
import React from 'react';
import { Modal, Button, Input } from '../../../app/DesignSystem';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Add Closet Item"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Save to Closet</Button>
        </>
      }
    >
      <div className="space-y-5">
         <div className="w-full h-48 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <span className="text-3xl mb-2">📸</span>
            <span className="text-sm font-bold text-navy-800">Click to upload photo</span>
            <span className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</span>
         </div>
         <Input label="Item Name" placeholder="e.g. Blue Striped Shirt" />
         <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
               <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20">
                  <option>Tops</option>
                  <option>Bottoms</option>
                  <option>Outerwear</option>
                  <option>Shoes</option>
               </select>
            </div>
            <div>
               <label className="block text-sm font-semibold text-slate-700 mb-1.5">Season</label>
               <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20">
                  <option>All Seasons</option>
                  <option>Spring</option>
                  <option>Summer</option>
                  <option>Autumn</option>
                  <option>Winter</option>
               </select>
            </div>
         </div>
         <Input label="Primary Color" placeholder="e.g. Navy Blue" />
      </div>
    </Modal>
  );
};

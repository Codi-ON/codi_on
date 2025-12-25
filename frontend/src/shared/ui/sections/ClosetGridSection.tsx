
import React from 'react';
import { ClosetItem } from '../types';
import { Badge, cn } from '../components';
import { Heart } from 'lucide-react';

export const ClosetGridSection: React.FC<{ items: ClosetItem[] }> = ({ items }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {items.map(item => (
        <div key={item.id} className="group cursor-pointer">
          <div className="aspect-[3/4] rounded-3xl bg-slate-100 border border-slate-200 overflow-hidden relative mb-3 shadow-sm hover:shadow-xl transition-all duration-500">
            <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-[#F97316] shadow-xl transition-colors">
                <Heart size={20} fill={item.favoriteCount > 10 ? 'currentColor' : 'none'} className={item.favoriteCount > 10 ? 'text-[#F97316]' : ''} />
              </button>
            </div>
            <div className="absolute bottom-4 left-4">
              <Badge variant="navy">{item.category}</Badge>
            </div>
          </div>
          <div className="px-1">
            <h4 className="font-black text-[#0F172A] text-sm truncate">{item.name}</h4>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-slate-400 font-bold">{item.color} · {item.season}</span>
              <span className="text-[10px] text-slate-300 font-black tracking-widest uppercase">Used {item.favoriteCount}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

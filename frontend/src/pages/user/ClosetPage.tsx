
import React, { useState } from 'react';
import { SectionHeader, Card, Input, Button, Badge, cn } from '../../app/DesignSystem';
import { MOCK_CLOSET } from '../../shared/ui/mock/data';
import { AddItemModal } from '../../shared/ui/modals/AddItemModal';
import { Search, Filter, Plus, Heart, Grid, List, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

const ClosetPage: React.FC = () => {
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [filter, setFilter] = useState('전체');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="space-y-10">
      <SectionHeader 
        title="나의 컬렉션" 
        subtitle="보유하신 의류 아이템을 카테고리별로 관리하고 스타일링 데이터를 확인하세요."
        action={
          <Button variant="secondary" size="lg" icon={Plus} onClick={() => setAddModalOpen(true)}>
            새 아이템 등록
          </Button>
        }
      />

      {/* Catalog Toolbar */}
      <Card className="p-2 bg-white/60 backdrop-blur-xl sticky top-20 z-20 border-slate-200 shadow-xl shadow-navy-900/5">
        <div className="flex flex-col lg:flex-row gap-4">
           <div className="flex-1 relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="브랜드, 소재, 색상으로 검색..." 
                className="w-full pl-14 pr-6 py-4 bg-transparent border-none outline-none text-sm font-bold placeholder:text-slate-400"
              />
           </div>
           <div className="h-px lg:h-12 w-full lg:w-px bg-slate-100"></div>
           <div className="flex items-center gap-2 px-2">
              <Button variant="ghost" size="sm" icon={SlidersHorizontal}>상세 필터</Button>
              <Button variant="ghost" size="sm" icon={ArrowUpDown}>정렬순</Button>
              <div className="flex bg-slate-100 p-1.5 rounded-xl ml-2">
                 <button 
                  onClick={() => setViewMode('grid')}
                  className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-white text-orange-500 shadow-sm" : "text-slate-400 hover:text-navy-900")}
                 >
                   <Grid size={18} />
                 </button>
                 <button 
                  onClick={() => setViewMode('list')}
                  className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white text-orange-500 shadow-sm" : "text-slate-400 hover:text-navy-900")}
                 >
                   <List size={18} />
                 </button>
              </div>
           </div>
        </div>
        <div className="flex gap-2 mt-2 px-3 pb-3 overflow-x-auto no-scrollbar border-t border-slate-50 pt-3">
           {['전체', '상의', '하의', '아우터', '신발', '액세서리', '즐겨찾기'].map(cat => (
             <button 
               key={cat} 
               onClick={() => setFilter(cat)}
               className={cn(
                 "px-6 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap border-2",
                 filter === cat ? "bg-navy-900 text-white border-navy-900 shadow-lg shadow-navy-900/20" : "bg-white text-slate-400 border-transparent hover:border-slate-100"
               )}
             >
               {cat}
             </button>
           ))}
        </div>
      </Card>

      {/* Grid View */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {MOCK_CLOSET.map(item => (
          <div key={item.id} className="group cursor-pointer">
            <div className="aspect-[3/4] rounded-[40px] bg-white border border-slate-200 overflow-hidden relative mb-4 shadow-sm group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-500">
              <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                 <button className="w-12 h-12 bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl flex items-center justify-center text-red-500 hover:bg-white active:scale-90">
                    <Heart size={20} fill={item.favoriteCount > 10 ? 'currentColor' : 'none'} />
                 </button>
              </div>
              <div className="absolute bottom-6 left-6">
                 <Badge variant="navy">{item.category}</Badge>
              </div>
            </div>
            <div className="px-2">
               <div className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-1">{item.brand || 'No Brand'}</div>
               <h4 className="font-black text-navy-900 text-lg truncate mb-1">{item.name}</h4>
               <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-bold uppercase">{item.color} · {item.season}</span>
                  <div className="flex items-center gap-1">
                     <span className="text-[10px] font-black text-slate-800">POP {item.favoriteCount}</span>
                  </div>
               </div>
            </div>
          </div>
        ))}
        {/* Placeholder for empty state / Add item */}
        <button 
          onClick={() => setAddModalOpen(true)}
          className="aspect-[3/4] rounded-[40px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 hover:text-orange-500 hover:border-orange-500/20 hover:bg-orange-50/50 transition-all group"
        >
           <Plus size={48} className="mb-4 group-hover:rotate-90 transition-transform duration-500" />
           <span className="font-black text-sm uppercase tracking-widest">Add Item</span>
        </button>
      </div>

      <AddItemModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} />
    </div>
  );
};

export default ClosetPage;

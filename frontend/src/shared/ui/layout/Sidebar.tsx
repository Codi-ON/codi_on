
import React from 'react';
import { cn } from '../../../app/DesignSystem';

interface SidebarProps {
  type: 'user' | 'admin';
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ type, activePage, onNavigate, isOpen, onClose }) => {
  const userItems = [
    { id: 'today', label: '오늘의 코디', icon: '☀️' },
    { id: 'closet', label: '나의 옷장', icon: '🧥' },
    { id: 'checklist', label: '체크리스트', icon: '✅' },
    { id: 'reco', label: '스타일 추천', icon: '✨' },
    { id: 'calendar', label: 'OOTD 달력', icon: '📅' },
    { id: 'history', label: '히스토리', icon: '📜' },
    { id: 'dashboard', label: '나의 통계', icon: '📊' },
    { id: 'mypage', label: '마이페이지', icon: '👤' },
  ];

  const adminItems = [
    { id: 'admin-dashboard', label: '대시보드', icon: '📊' },
    { id: 'admin-users', label: '사용자 관리', icon: '👥' },
    { id: 'admin-data', label: '데이터 분석', icon: '📈' },
    { id: 'admin-funnel', label: '추천 퍼널', icon: '⚡' },
    { id: 'admin-settings', label: '시스템 설정', icon: '🔧' },
  ];

  const items = type === 'user' ? userItems : adminItems;

  return (
    <>
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-navy-900 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8">
          <div className="text-2xl font-black tracking-tighter flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
            <span className="bg-orange-500 w-8 h-8 rounded flex items-center justify-center text-sm shadow-lg shadow-orange-500/20">CO</span>
            CODION
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onClose(); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                activePage === item.id 
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <span className={cn("text-lg transition-transform group-hover:scale-110", activePage === item.id ? "scale-110" : "")}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
          
          <div className="h-4"></div>
          <div className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Developer</div>
          <button
            onClick={() => { onNavigate('showcase'); onClose(); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              activePage === 'showcase' ? "bg-white/10 text-white" : "text-slate-500 hover:text-white hover:bg-slate-800"
            )}
          >
            <span>🛠️</span> 쇼케이스 허브
          </button>
        </nav>

        <div className="p-6 border-t border-slate-800">
          <button 
            className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-sm font-bold w-full"
            onClick={() => onNavigate('landing')}
          >
            <span>🚪</span> 로그아웃
          </button>
        </div>
      </aside>
      
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

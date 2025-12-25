
import React, { useState } from 'react';
import { Button } from '../DesignSystem';

interface UserLayoutProps {
  children: React.ReactNode;
  activePage?: string;
  onNavigate?: (page: string) => void;
}

export const UserLayout: React.FC<UserLayoutProps> = ({ children, activePage, onNavigate }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'today', label: 'Today', icon: '☀️' },
    { id: 'closet', label: 'My Closet', icon: '🧥' },
    { id: 'reco', label: 'Recommendations', icon: '✨' },
    { id: 'history', label: 'History', icon: '📅' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'help', label: 'Help & FAQ', icon: '❓' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-navy-800 text-white shadow-md">
        <div className="font-bold text-xl tracking-tighter">CODION</div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 bg-navy-700 rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"/></svg>
        </button>
      </div>

      {/* Sidebar (Responsive) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-navy-800 text-white flex-col transition-transform duration-300 transform
        md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 hidden md:block">
          <div className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="bg-orange-500 p-1 rounded">CO</span>DION
          </div>
        </div>

        <nav className="flex-1 px-4 mt-4 md:mt-0 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate?.(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activePage === item.id ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-navy-700'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-navy-700">
          <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white" onClick={() => onNavigate?.('landing')}>
            🚪 Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar Desktop */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200">
          <div className="text-slate-400 font-medium">Welcome back, <span className="text-slate-900 font-bold">Alex Rivera</span></div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border-2 border-orange-500">
              <img src="https://picsum.photos/32/32?random=1" alt="Avatar" />
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-navy-900/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}
    </div>
  );
};

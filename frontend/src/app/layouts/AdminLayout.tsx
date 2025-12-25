
import React, { useState } from 'react';
import { Button, Badge } from '../DesignSystem';

interface AdminLayoutProps {
  children: React.ReactNode;
  activePage?: string;
  onNavigate?: (page: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activePage, onNavigate }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'admin-users', label: 'User Management', icon: '👥' },
    { id: 'admin-data', label: 'Closet Insights', icon: '📈' },
    { id: 'admin-funnel', label: 'Conversion Funnel', icon: '⚡' },
    { id: 'admin-settings', label: 'System Settings', icon: '🔧' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-navy-900 text-white flex-col transition-transform duration-300 transform
        md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8">
          <div className="text-xl font-bold text-white flex items-center gap-2">
            <span className="bg-orange-500 p-1 rounded">CO</span>DION Admin
          </div>
          <div className="mt-2">
            <Badge variant="success">Production Mode</Badge>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate?.(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activePage === item.id ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white hover:bg-navy-800'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-navy-800">
           <div className="flex items-center gap-3 p-3 rounded-xl bg-navy-800/50 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-lg">A</div>
              <div>
                <div className="text-sm font-bold">Admin Root</div>
                <div className="text-xs text-slate-500">Super Admin</div>
              </div>
           </div>
           <Button variant="outline" className="w-full bg-navy-800 border-navy-700 text-white hover:bg-navy-700" onClick={() => onNavigate?.('landing')}>
              Back to Store
           </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"/></svg>
            </button>
            <h1 className="text-xl font-bold text-slate-800">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             System Status: Healthy
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 max-w-screen-2xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-navy-900/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}
    </div>
  );
};

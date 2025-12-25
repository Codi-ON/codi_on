
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface ShellProps {
  children: React.ReactNode;
  type: 'user' | 'admin';
  activePage: string;
  onNavigate: (page: string) => void;
}

export const Shell: React.FC<ShellProps> = ({ children, type, activePage, onNavigate }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar 
        type={type} 
        activePage={activePage} 
        onNavigate={onNavigate} 
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
        <Topbar onMenuClick={() => setSidebarOpen(true)} type={type} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </main>
      </div>
    </div>
  );
};

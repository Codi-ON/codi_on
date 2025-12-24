/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Signal, Wifi, Battery } from 'lucide-react';

// --- ATOMS ---

export const Button = ({ variant = 'primary', children, className = "", ...props }: any) => {
  const baseStyle = "w-full py-3.5 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-brand-primary text-white shadow-soft hover:bg-brand-primary-dark hover:shadow-glow border border-transparent",
    secondary: "bg-white text-slate-700 border border-slate-200 shadow-sm hover:border-brand-primary hover:text-brand-primary hover:bg-brand-accent-bg",
    ghost: "bg-transparent text-slate-500 hover:text-brand-primary hover:bg-brand-secondary",
    accent: "bg-brand-accent text-white shadow-soft hover:brightness-105"
  };
  
  return (
    <button className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input = ({ icon: Icon, placeholder, className = "" }: any) => (
  <div className={`relative group ${className}`}>
    {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={20} />}
    <input 
      type="text" 
      placeholder={placeholder} 
      className={`w-full bg-white border border-slate-200 rounded-2xl py-3.5 ${Icon ? 'pl-12' : 'pl-4'} pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all shadow-sm`}
    />
  </div>
);

export const Card = ({ children, className = "", noPadding = false, hover = true }: any) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-card ${hover ? 'hover:shadow-card-hover hover:border-brand-primary/30 hover:-translate-y-0.5' : ''} transition-all duration-300 overflow-hidden ${noPadding ? '' : 'p-5'} ${className}`}>
    {children}
  </div>
);

export const Chip = ({ active, children, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${active ? 'bg-brand-primary text-white border-brand-primary shadow-soft' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-primary hover:text-brand-primary hover:bg-brand-accent-bg'}`}
  >
    {children}
  </button>
);

export const SectionTitle = ({ children, action }: any) => (
  <div className="flex justify-between items-end mb-4 px-1">
    <h3 className="font-bold text-lg text-slate-900 tracking-tight">{children}</h3>
    {action && <span className="text-brand-primary text-sm font-semibold cursor-pointer hover:text-brand-primary-dark transition-colors">{action}</span>}
  </div>
);

// --- FRAMES ---

export const PhoneFrame = ({ children, title }: any) => (
  <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
    <div className="w-[375px] h-[812px] bg-brand-bg rounded-[44px] shadow-2xl border-[8px] border-slate-900 relative overflow-hidden flex flex-col ring-8 ring-slate-900/5">
      {/* Dynamic Island / Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-slate-900 rounded-b-2xl z-50 flex items-end justify-center pb-2">
        <div className="w-16 h-4 bg-black rounded-full"></div>
      </div>
      
      {/* Status Bar */}
      <div className="h-[48px] flex justify-between items-center px-7 pt-3 text-xs font-semibold text-slate-900 z-40 bg-white/80 backdrop-blur-md sticky top-0">
        <span>9:41</span>
        <div className="flex gap-1.5 text-slate-900">
          <Signal size={14} />
          <Wifi size={14} />
          <Battery size={14} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative bg-brand-bg">
        {children}
      </div>

      {/* Home Indicator */}
      <div className="h-[34px] flex justify-center items-end pb-2 bg-white/0 pointer-events-none absolute bottom-0 inset-x-0 z-50">
        <div className="w-[134px] h-[5px] bg-slate-900/90 rounded-full mb-2"></div>
      </div>
    </div>
    <div className="mt-6 flex flex-col items-center">
      <p className="font-mono text-xs text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <div className="w-12 h-1 bg-slate-200 rounded-full"></div>
    </div>
  </div>
);

export const BrowserFrame = ({ children, title }: any) => (
  <div className="flex flex-col items-center w-full max-w-[1440px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="w-full h-[800px] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden ring-1 ring-slate-900/5">
      {/* Browser Toolbar */}
      <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-4 sticky top-0 z-50">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400/80 shadow-sm"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400/80 shadow-sm"></div>
          <div className="w-3 h-3 rounded-full bg-green-400/80 shadow-sm"></div>
        </div>
        <div className="flex gap-4 text-slate-400">
             <div className="w-6 h-6 rounded-md hover:bg-slate-200/50 flex items-center justify-center">←</div>
             <div className="w-6 h-6 rounded-md hover:bg-slate-200/50 flex items-center justify-center">→</div>
        </div>
        <div className="flex-1 max-w-3xl bg-white border border-slate-200 rounded-lg h-8 flex items-center px-3 text-xs text-slate-500 font-medium shadow-sm">
          <span className="text-slate-300 mr-2">https://</span>app.codion.ai/home
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-brand-bg scroll-smooth">
        {children}
      </div>
    </div>
    <div className="mt-6 flex flex-col items-center">
        <p className="font-mono text-xs text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <div className="w-12 h-1 bg-slate-200 rounded-full"></div>
    </div>
  </div>
);
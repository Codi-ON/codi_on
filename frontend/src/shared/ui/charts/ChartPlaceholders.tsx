
import React from 'react';

export const LineChartPlaceholder: React.FC = () => (
  <div className="w-full h-64 bg-slate-50 rounded-xl flex items-end justify-between p-6 overflow-hidden relative border border-slate-100">
    <div className="absolute inset-0 flex flex-col justify-between py-6 px-4">
      {[1,2,3,4].map(i => <div key={i} className="w-full border-t border-slate-200/50"></div>)}
    </div>
    <svg className="absolute inset-0 w-full h-full text-orange-500" viewBox="0 0 100 40" preserveAspectRatio="none">
       <path d="M0 40 Q 20 10, 40 30 T 80 10 T 100 20 L 100 40 L 0 40 Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1" />
    </svg>
    <div className="text-xs text-slate-400 absolute bottom-2 left-1/2 -translate-x-1/2 font-bold uppercase tracking-widest">30-Day Activity Flow</div>
  </div>
);

export const BarChartPlaceholder: React.FC = () => (
  <div className="w-full h-64 bg-white rounded-xl flex items-end justify-around p-4 gap-2 border border-slate-100">
    {[40, 70, 55, 90, 65, 80, 45].map((h, i) => (
      <div key={i} className="flex flex-col items-center gap-2 w-full">
         <div className="w-full bg-navy-800 rounded-t-lg transition-all hover:bg-orange-500" style={{ height: `${h}%` }}></div>
         <div className="text-[10px] font-bold text-slate-400">Day {i+1}</div>
      </div>
    ))}
  </div>
);

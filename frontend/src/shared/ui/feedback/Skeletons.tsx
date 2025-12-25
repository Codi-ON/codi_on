
import React from 'react';
import { cn } from '../../../app/DesignSystem';

export const CardSkeleton = () => (
  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 animate-pulse">
    <div className="h-40 bg-slate-100 rounded-xl"></div>
    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
  </div>
);

export const ListSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map(i => (
      <div key={i} className="flex gap-4 p-4 bg-white border border-slate-100 rounded-xl animate-pulse">
        <div className="w-12 h-12 bg-slate-100 rounded-lg"></div>
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 bg-slate-200 rounded w-1/4"></div>
          <div className="h-2 bg-slate-100 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

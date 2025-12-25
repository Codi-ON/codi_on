
import React from 'react';

export const EmptyState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="text-center py-12 px-6">
    <div className="text-5xl mb-4 grayscale">📁</div>
    <h3 className="text-xl font-bold text-navy-900 mb-2">{title}</h3>
    <p className="text-slate-500 max-w-xs mx-auto text-sm">{description}</p>
  </div>
);

export const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-center py-12 px-6 border border-red-100 bg-red-50 rounded-2xl">
    <div className="text-5xl mb-4">⚠️</div>
    <h3 className="text-xl font-bold text-red-800 mb-2">Something went wrong</h3>
    <p className="text-red-700 text-sm">{message}</p>
    <button className="mt-4 text-sm font-bold text-red-800 underline">Try again</button>
  </div>
);

export const OfflineState: React.FC = () => (
  <div className="fixed bottom-6 right-6 z-50 p-4 bg-navy-900 text-white rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
    <div className="w-2 h-2 rounded-full bg-red-500"></div>
    <span className="text-sm font-bold">You are currently offline</span>
  </div>
);

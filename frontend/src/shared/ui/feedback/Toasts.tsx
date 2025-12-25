
import React from 'react';

export const ToastSuccess: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl shadow-sm">
    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">✓</div>
    <span className="text-sm font-bold text-green-800">{message}</span>
  </div>
);

export const ToastError: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl shadow-sm">
    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white">!</div>
    <span className="text-sm font-bold text-red-800">{message}</span>
  </div>
);

export const ToastWarning: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-100 rounded-xl shadow-sm">
    <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white">⚠</div>
    <span className="text-sm font-bold text-yellow-800">{message}</span>
  </div>
);

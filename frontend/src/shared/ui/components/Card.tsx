
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, subtitle, padding = 'md' }) => {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 py-5 border-b border-slate-50">
          {title && <h3 className="text-lg font-black text-[#0F172A] tracking-tight">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>}
        </div>
      )}
      <div className={paddings[padding]}>
        {children}
      </div>
    </div>
  );
};

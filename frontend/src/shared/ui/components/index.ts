
import React from 'react';

// --- Utility ---
export const cn = (...classes: (string | undefined | boolean)[]) => classes.filter(Boolean).join(' ');

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', size = 'md', isLoading, children, className, ...props 
}) => {
  const base = "inline-flex items-center justify-center rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-[#0F172A] text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10",
    secondary: "bg-[#F97316] text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20",
    outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "bg-red-500 text-white hover:bg-red-600"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base"
  };

  /* Using React.createElement for compatibility with .ts extension */
  return React.createElement(
    'button',
    {
      className: cn(base, variants[variant], sizes[size], className),
      disabled: isLoading,
      ...props
    },
    isLoading && React.createElement(
      'svg',
      { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-current", fill: "none", viewBox: "0 0 24 24" },
      React.createElement('circle', { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
      React.createElement('path', { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
    ),
    children
  );
};

// --- Badge ---
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'navy' | 'orange' | 'success' | 'slate' | 'error';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'slate' }) => {
  const styles = {
    navy: "bg-[#0F172A] text-white",
    orange: "bg-[#F97316] text-white",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    slate: "bg-slate-100 text-slate-600 border border-slate-200",
    error: "bg-red-50 text-red-700 border border-red-100"
  };
  /* Using React.createElement for compatibility with .ts extension */
  return React.createElement(
    'span',
    { className: cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", styles[variant]) },
    children
  );
};

// --- Card ---
interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, title, subtitle }) => (
  /* Using React.createElement for compatibility with .ts extension */
  React.createElement(
    'div',
    { className: cn("bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden", className) },
    title && React.createElement(
      'div',
      { className: "px-6 py-5 border-b border-slate-50" },
      React.createElement('div', { className: "font-black text-slate-800 tracking-tight" }, title),
      subtitle && React.createElement('p', { className: "text-xs text-slate-500 mt-1 font-medium" }, subtitle)
    ),
    React.createElement('div', { className: "p-6" }, children)
  )
);

// --- Section Header ---
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action }) => (
  /* Using React.createElement for compatibility with .ts extension */
  React.createElement(
    'div',
    { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8" },
    React.createElement(
      'div',
      { className: "space-y-1" },
      React.createElement('h2', { className: "text-3xl font-black text-[#0F172A] tracking-tight" }, title),
      subtitle && React.createElement('p', { className: "text-slate-500 text-sm font-medium" }, subtitle)
    ),
    action && React.createElement('div', null, action)
  )
);

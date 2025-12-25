
import React from 'react';

export const cn = (...classes: (string | undefined | boolean)[]) => classes.filter(Boolean).join(' ');

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ElementType;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', size = 'md', isLoading, icon: Icon, children, className, ...props 
}) => {
  const base = "inline-flex items-center justify-center rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: "bg-navy-900 text-white hover:bg-slate-800 shadow-xl shadow-navy-900/10 focus:ring-navy-900",
    secondary: "bg-orange-500 text-white hover:bg-orange-600 shadow-xl shadow-orange-500/20 focus:ring-orange-500",
    outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-navy-900",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-xl shadow-red-500/10 focus:ring-red-500"
  };
  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-10 py-4 text-base"
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={isLoading} {...props}>
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon && (
        <Icon className="w-4 h-4 mr-2" />
      )}
      {children}
    </button>
  );
};

// --- Badge ---
export const Badge: React.FC<{ children: React.ReactNode; variant?: 'navy' | 'orange' | 'success' | 'slate' | 'error' }> = ({ children, variant = 'slate' }) => {
  const styles = {
    navy: "bg-navy-900 text-white",
    orange: "bg-orange-500 text-white",
    success: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    slate: "bg-slate-100 text-slate-600 border border-slate-200",
    error: "bg-red-100 text-red-800 border border-red-200"
  };
  return <span className={cn("px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider whitespace-nowrap", styles[variant])}>{children}</span>;
};

// --- Input ---
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }> = ({ label, error, className, ...props }) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="text-xs font-black text-slate-500 uppercase ml-1 tracking-widest">{label}</label>}
    <input 
      className={cn(
        "w-full px-5 py-4 bg-white border-2 rounded-2xl text-sm focus:ring-4 outline-none transition-all placeholder:text-slate-300",
        error ? "border-red-500 focus:ring-red-500/10" : "border-slate-100 focus:ring-navy-900/5 focus:border-navy-900",
        className
      )}
      {...props}
    />
    {error && <p className="text-[11px] font-bold text-red-500 ml-1">{error}</p>}
  </div>
);

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; subtitle?: string; footer?: React.ReactNode; padding?: 'none' | 'sm' | 'md' | 'lg' }> = ({ children, className, title, subtitle, footer, padding = 'md' }) => {
  const paddings = {
    none: "p-0",
    sm: "p-4",
    md: "p-8",
    lg: "p-12"
  };
  return (
    <div className={cn("bg-white border border-slate-200/60 rounded-[32px] shadow-sm hover:shadow-xl hover:shadow-navy-900/[0.02] transition-all duration-500 overflow-hidden", className)}>
      {(title || subtitle) && (
        <div className="px-8 py-6 border-b border-slate-50">
          <div className="font-black text-navy-900 text-lg tracking-tighter">{title}</div>
          {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
        </div>
      )}
      <div className={paddings[padding]}>{children}</div>
      {footer && <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-50">{footer}</div>}
    </div>
  );
};

// --- Stepper ---
export const Stepper: React.FC<{ steps: string[]; currentStep: number }> = ({ steps, currentStep }) => (
  <div className="flex items-center gap-4 mb-10 overflow-x-auto no-scrollbar py-2">
    {steps.map((step, i) => (
      <React.Fragment key={i}>
        <div className="flex items-center gap-3 shrink-0">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all",
            i <= currentStep ? "bg-navy-900 text-white shadow-lg" : "bg-slate-100 text-slate-400"
          )}>
            {i < currentStep ? '✓' : i + 1}
          </div>
          <span className={cn(
            "text-xs font-black tracking-tight",
            i <= currentStep ? "text-navy-900" : "text-slate-400"
          )}>{step}</span>
        </div>
        {i < steps.length - 1 && <div className="w-8 h-px bg-slate-100 shrink-0" />}
      </React.Fragment>
    ))}
  </div>
);

// --- Section Header ---
export const SectionHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
    <div className="space-y-2">
      <h2 className="text-4xl font-black text-navy-900 tracking-tighter leading-tight">{title}</h2>
      {subtitle && <p className="text-slate-400 text-base font-medium">{subtitle}</p>}
    </div>
    {action && <div className="flex-shrink-0 flex gap-2">{action}</div>}
  </div>
);

// --- Modal ---
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden relative animate-in zoom-in-95 duration-300">
        <div className="px-10 pt-10 pb-6 flex items-center justify-between">
          <h3 className="text-2xl font-black text-navy-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-navy-900 hover:bg-slate-100 rounded-full transition-all">
            ✕
          </button>
        </div>
        <div className="px-10 pb-10">{children}</div>
        {footer && (
          <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

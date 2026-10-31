import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'teal' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'default';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-[11px] leading-tight',
    md: 'px-3 py-1 text-xs font-semibold leading-tight',
  };

  const variantStyles = {
    primary: 'bg-brand-navy/10 text-brand-navy border border-brand-navy/15',
    teal: 'bg-teal-50 text-teal-800 border border-teal-200/80',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    error: 'bg-rose-50 text-rose-800 border border-rose-200/80',
    info: 'bg-sky-50 text-sky-800 border border-sky-200/80',
    neutral: 'bg-slate-100/80 text-slate-700 border border-slate-200/80',
    default: 'bg-slate-100/80 text-slate-700 border border-slate-200/80',
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-full transition-colors ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

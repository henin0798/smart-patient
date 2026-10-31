import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'teal' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'navy' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'apple-press inline-flex items-center justify-center font-semibold rounded-xl select-none focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[32px]',
    md: 'px-4 py-2 text-sm gap-2 min-h-[38px]',
    lg: 'px-5 py-2.5 text-base gap-2.5 min-h-[44px]',
  };

  const variantStyles = {
    teal: 'apple-liquid-glass-teal text-white focus:ring-teal-500 hover:brightness-[1.03] active:brightness-[0.95]',
    primary: 'apple-liquid-glass-navy text-white focus:ring-brand-navy hover:brightness-[1.05] active:brightness-[0.95]',
    navy: 'apple-liquid-glass-navy text-white focus:ring-brand-navy hover:brightness-[1.05] active:brightness-[0.95]',
    secondary: 'apple-liquid-glass text-brand-navy hover:bg-white/90 focus:ring-slate-300 border border-slate-200/80',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500',
    outline: 'bg-white/80 backdrop-blur-md border border-slate-200 hover:bg-slate-50 text-brand-text focus:ring-teal-500 shadow-sm',
    ghost: 'bg-transparent hover:bg-slate-100/70 text-brand-text focus:ring-slate-300',
    glass: 'apple-glass text-brand-navy hover:bg-white/90 focus:ring-teal-500',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
      ) : (
        icon && <span className="inline-flex shrink-0 items-center justify-center">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverEffect = false,
  glass = false,
}) => {
  const baseCard = glass
    ? 'apple-liquid-glass-card'
    : 'bg-white/95 backdrop-blur-sm border border-slate-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.03)]';

  const interactive = hoverEffect
    ? 'apple-press hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-slate-300 transition-all duration-200 cursor-pointer'
    : '';

  return (
    <div
      onClick={onClick}
      className={`${baseCard} rounded-[20px] p-6 ${interactive} ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}> = ({ title, subtitle, action, className = '', children }) => {
  if (children) {
    return <div className={`mb-4 ${className}`}>{children}</div>;
  }

  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div>
        {title && <h3 className="text-lg font-bold tracking-tight text-brand-navy leading-snug">{title}</h3>}
        {subtitle && <p className="text-xs text-brand-muted mt-1 leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <h3 className={`text-lg font-bold tracking-tight text-brand-navy leading-snug ${className}`}>{children}</h3>;

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`space-y-4 ${className}`}>{children}</div>;

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3 ${className}`}>{children}</div>;

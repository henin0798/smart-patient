import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Apple Translucent Dimming Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/45 backdrop-blur-md animate-apple-fade transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog with Apple Spring Transition & Liquid Glass border */}
      <div
        className={`relative w-full ${maxWidthStyles[maxWidth]} animate-apple-spring rounded-[24px] bg-white/95 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] border border-white/80 ring-1 ring-slate-900/5 my-8 z-10`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header if title passed directly */}
        {title && (
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-brand-navy">{title}</h3>
              {description && <p className="text-xs text-brand-muted mt-1 leading-relaxed">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="apple-press text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100/80 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div>{children}</div>
      </div>
    </div>
  );
};

export const DialogHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`pb-4 border-b border-slate-100 mb-5 ${className}`}>{children}</div>;

export const DialogTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <h3 className={`text-lg font-bold tracking-tight text-brand-navy ${className}`}>{children}</h3>;

export const DialogContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`space-y-4 ${className}`}>{children}</div>;

export const DialogFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3 ${className}`}>
    {children}
  </div>
);

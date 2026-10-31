import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 tracking-tight mb-1.5">
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full px-3.5 py-2.5 bg-white/95 border rounded-xl text-slate-800 placeholder-slate-400 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all duration-150 ${
            error ? 'border-rose-400 focus:ring-rose-500/25 focus:border-rose-500' : 'border-slate-200 hover:border-slate-300'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs font-medium text-rose-600 animate-apple-fade">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

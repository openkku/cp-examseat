// src/components/ui/Input.tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  leftIcon,
  rightElement,
  containerClassName = '',
  className = '',
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`flex flex-col ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={`shadow-sm appearance-none border rounded-xl w-full py-3 px-4 text-slate-800 dark:text-slate-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans transition-all bg-white dark:bg-slate-800 ${
            leftIcon ? 'pl-10' : ''
          } ${
            rightElement ? 'pr-10' : ''
          } ${
            error
              ? 'border-rose-300 focus:ring-rose-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          } ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3.5 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <span className="text-rose-500 text-xs font-semibold mt-1.5 animate-in fade-in duration-200">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

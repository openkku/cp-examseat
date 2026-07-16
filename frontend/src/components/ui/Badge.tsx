// src/components/ui/Badge.tsx
import React from 'react';

interface BadgeProps {
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'sky' | 'slate' | 'indigo';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-full border whitespace-nowrap leading-none';
  
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const variantStyles = {
    blue: 'bg-blue-50 dark:bg-blue-950/60 border-blue-100 dark:border-blue-900/60 text-blue-700 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-900/60 text-amber-700 dark:text-amber-400',
    rose: 'bg-rose-50 dark:bg-rose-950/60 border-rose-100 dark:border-rose-900/60 text-rose-700 dark:text-rose-400',
    sky: 'bg-sky-50 dark:bg-sky-950/60 border-sky-100 dark:border-sky-900/60 text-sky-700 dark:text-sky-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-100 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-400',
    slate: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-655 dark:text-slate-300',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

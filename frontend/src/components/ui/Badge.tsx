// src/components/ui/Badge.tsx
import React from 'react';

interface BadgeProps {
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'sky' | 'slate' | 'indigo' | 'purple' | 'navy';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-full border whitespace-nowrap leading-none transition-colors shadow-xs';
  
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-xs sm:text-sm',
  };

  const variantStyles = {
    blue: 'bg-sky-50 dark:bg-sky-950/80 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200',
    emerald: 'bg-teal-50 dark:bg-teal-950/80 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200',
    amber: 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
    rose: 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300',
    sky: 'bg-sky-50 dark:bg-sky-950/80 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200',
    purple: 'bg-purple-50 dark:bg-purple-950/80 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200',
    navy: 'bg-faculty-light dark:bg-blue-950/80 border-blue-200 dark:border-blue-800 text-faculty dark:text-blue-200',
    slate: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-750 dark:text-slate-200',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

// src/components/ui/Card.tsx
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glass?: boolean;
  borderVariant?: 'default' | 'rose' | 'amber' | 'sky';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  hover = false,
  glass = false,
  borderVariant = 'default',
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-2xl overflow-hidden border transition-all duration-200';
  
  const glassStyles = glass 
    ? 'bg-white/82 dark:bg-slate-900/82 backdrop-blur-xl'
    : 'bg-white dark:bg-slate-900';

  const borderStyles = {
    default: 'border-slate-200/80 dark:border-slate-800/90',
    rose: 'border-rose-200 dark:border-rose-950/85 shadow-rose-500/5 dark:shadow-none',
    amber: 'border-amber-200 dark:border-amber-950/85 shadow-amber-500/5 dark:shadow-none',
    sky: 'border-sky-200 dark:border-sky-950/85 shadow-sky-500/5 dark:shadow-none',
  };

  const hoverStyles = hover
    ? 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-950/5 dark:hover:shadow-xl dark:hover:shadow-teal-950/50 hover:border-teal-300 dark:hover:border-teal-500/80 shadow-sm dark:shadow-none'
    : 'shadow-sm shadow-emerald-950/[0.025] dark:shadow-none';

  return (
    <div
      className={`${baseStyles} ${glassStyles} ${borderStyles[borderVariant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

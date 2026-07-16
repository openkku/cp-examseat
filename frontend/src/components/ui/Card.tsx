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
  const baseStyles = 'rounded-2xl overflow-hidden border transition-all duration-300';
  
  const glassStyles = glass 
    ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md'
    : 'bg-white dark:bg-slate-900';

  const borderStyles = {
    default: 'border-slate-200/50 dark:border-slate-800/80',
    rose: 'border-rose-200 dark:border-rose-950/85 shadow-rose-500/5 dark:shadow-none',
    amber: 'border-amber-200 dark:border-amber-950/85 shadow-amber-500/5 dark:shadow-none',
    sky: 'border-sky-200 dark:border-sky-950/85 shadow-sky-500/5 dark:shadow-none',
  };

  const hoverStyles = hover
    ? 'hover:-translate-y-0.5 hover:shadow-xl hover:border-slate-300/50 dark:hover:border-slate-700/60 shadow-md dark:shadow-none'
    : 'shadow-sm dark:shadow-none';

  return (
    <div
      className={`${baseStyles} ${glassStyles} ${borderStyles[borderVariant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

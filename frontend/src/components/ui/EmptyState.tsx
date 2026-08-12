// src/components/ui/EmptyState.tsx
import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = '🔍',
  action,
  className = '',
}) => {
  return (
    <div className={`bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 sm:p-10 text-center shadow-sm shadow-emerald-950/[0.03] dark:shadow-none max-w-md mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300 ${className}`}>
      <div className="text-4xl mb-4 leading-none select-none flex justify-center">{icon}</div>
      <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-1 leading-snug">
        {title}
      </h3>
      {description && (
        <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold leading-relaxed mb-4">
          {description}
        </p>
      )}
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
};

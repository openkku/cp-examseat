// src/components/ui/Select.tsx
import React, { useId } from 'react';
import { ChevronDown } from '../icons';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  children,
  label,
  options,
  className = '',
  id,
  ...props
}) => {
  const generatedId = useId();
  const selectId = id || `select-${generatedId}`;

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-2 tracking-wider"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className="min-h-11 w-full appearance-none border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-xs font-bold bg-white dark:bg-slate-900 hover:bg-teal-50/40 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-100 hover:border-teal-300 dark:hover:border-teal-500 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/25 dark:focus:ring-teal-500/40 focus:border-teal-500 dark:focus:border-teal-400 transition-all font-sans"
          {...props}
        >
          {options ? (
            options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          ) : (
            children
          )}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 dark:text-slate-500">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

// src/components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'min-h-11 inline-flex items-center justify-center font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 focus-visible:outline-none';
  
  const sizeStyles = {
    sm: 'py-1.5 px-3 text-xs rounded-lg gap-1.5',
    md: 'py-2 px-4 text-xs md:text-sm rounded-xl gap-2',
    lg: 'py-3 px-6 text-sm md:text-base rounded-xl gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-faculty hover:bg-faculty-dark text-white shadow-sm shadow-faculty/20 dark:shadow-none',
    secondary: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-faculty-light/60 dark:hover:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-900/70 shadow-sm dark:shadow-none',
    ghost: 'text-slate-600 dark:text-slate-400 hover:bg-faculty-light/70 dark:hover:bg-blue-950/30 hover:text-faculty dark:hover:text-blue-200',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm hover:shadow-md hover:shadow-rose-500/20',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};

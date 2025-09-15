import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', isLoading = false, ...props }) => {
  const { className, ...restProps } = props;

  const baseClasses = 'rounded-md font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 flex items-center justify-center gap-2';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const variantClasses = {
    primary: 'bg-primary text-white border-transparent hover:bg-primary-hover',
    secondary: 'bg-card text-text-primary border border-border hover:bg-slate-50 hover:border-slate-400',
    danger: 'bg-red-600 text-white border-transparent hover:bg-red-700',
  };

  const disabledClasses = 'disabled:opacity-60 disabled:cursor-not-allowed';

  const combinedClassName = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    disabledClasses,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={combinedClassName}
      disabled={isLoading || props.disabled}
      {...restProps}
    >
      {isLoading && (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
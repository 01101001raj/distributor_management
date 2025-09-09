import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', isLoading = false, ...props }) => {
  const { className, ...restProps } = props;

  const baseClasses = 'rounded-md font-semibold text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center';
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };
  
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-hover focus:ring-primary',
    secondary: 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-600',
  };

  const disabledClasses = 'disabled:bg-gray-300 disabled:cursor-not-allowed';

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
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;

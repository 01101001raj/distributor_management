import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, id, error, icon, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`w-full px-3 py-2 border rounded-md focus-visible:outline-none focus-visible:ring-2 transition text-sm text-text-primary bg-input-bg ${icon ? 'pl-10' : ''} ${error ? 'border-red-500' : 'border-border focus:border-primary'}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
};

export default Input;
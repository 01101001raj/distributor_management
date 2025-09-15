import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ label, id, error, children, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`w-full px-3 py-2 border rounded-md focus-visible:outline-none focus-visible:ring-2 transition text-sm text-text-primary appearance-none bg-input-bg ${error ? 'border-red-500' : 'border-border focus:border-primary'}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
};

export default Select;
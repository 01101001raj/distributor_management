
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, id, error, ...props }) => {
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">
        {label}
      </label>
      <input
        id={id}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Input;

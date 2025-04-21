import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  showErrorIcon?: boolean;
}

export function FormInput({ 
  label, 
  error, 
  className = '', 
  showErrorIcon = true,
  ...props 
}: FormInputProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      <div className="relative">
        <input
          className={`
            w-full bg-gray-700 text-white px-4 py-2 rounded 
            focus:outline-none focus:ring-2 focus:ring-purple-500
            ${error ? 'border border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && showErrorIcon && (
          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
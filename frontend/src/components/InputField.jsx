import React from 'react';

export default function InputField({ label, id, type, value, onChange, placeholder, required = false, className = '' }) {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-gray-300 font-mono text-sm mb-1 uppercase">
          {label}
        </label>
      )}
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full p-2.5 bg-gray-800 text-yellow-400 border-2 border-green-500 rounded-md shadow-inner focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 font-mono placeholder-gray-500 ${className}`}
      />
    </div>
  );
}

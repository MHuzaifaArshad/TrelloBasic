import React from 'react';

export default function Button({ children, onClick, className, type = 'button', disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        font-mono uppercase
        py-2 px-5
        rounded-md
        shadow-md
        transition duration-200 ease-in-out
        hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400
        border-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

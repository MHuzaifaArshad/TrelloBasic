// frontend/src/components/NotificationToast.jsx
import React, { useEffect, useState } from 'react';

// This component is now primarily illustrative for the Navbar dropdown.
// It's not directly rendered as a "toast" in the App.jsx anymore.
export default function NotificationToast({ id, message, type = 'info', onDismiss }) {
  const [isVisible, setIsVisible] = useState(true);

  // This auto-dismiss logic is typically for transient toasts.
  // For persistent notifications in a dropdown, this might not be desired.
  // However, keeping it here for consistency if it were to be used as a temporary toast.
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(id), 500);
    }, 5000); // Notification visible for 5 seconds

    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(id), 300);
  };

  const baseClasses = "fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white flex items-center justify-between transition-all duration-300 transform";
  let typeClasses = "";

  switch (type) {
    case 'success':
      typeClasses = "bg-green-500";
      break;
    case 'error':
      typeClasses = "bg-red-500";
      break;
    case 'warning':
      typeClasses = "bg-yellow-500";
      break;
    case 'info':
    default:
      typeClasses = "bg-blue-500";
      break;
  }

  return (
    <div
      className={`${baseClasses} ${typeClasses} ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      style={{ zIndex: 1000 }}
    >
      <p className="mr-4">{message}</p>
      <button
        onClick={handleDismiss}
        className="ml-2 text-white opacity-75 hover:opacity-100 focus:outline-none"
        aria-label="Dismiss notification"
      >
        &times;
      </button>
    </div>
  );
}
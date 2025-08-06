// frontend/src/components/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import Button from './Button';
import { Bell, XCircle, CheckCircle } from 'lucide-react'; // Ensure lucide-react is installed

export default function Navbar({
  isLoggedIn,
  onLogout,
  onNavigateToLogin,
  onNavigateToRegister,
  onNavigateToDashboard,
  notifications = [], // Persistent notifications array
  markNotificationAsRead, // Function to mark as read
  markAllNotificationsAsRead, // Function to mark all as read
  currentUser // Current user for display
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);

  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationsRef]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assigned':
        return <Bell size={16} className="text-blue-500 mr-2" />;
      case 'task_status_change':
      case 'task_updated':
        return <CheckCircle size={16} className="text-green-500 mr-2" />;
      case 'task_deleted':
        return <XCircle size={16} className="text-red-500 mr-2" />;
      case 'task_unassigned':
        return <XCircle size={16} className="text-orange-500 mr-2" />;
      default:
        return <Bell size={16} className="text-gray-500 mr-2" />;
    }
  };

  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <nav className="bg-gray-800 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white text-2xl font-bold">
          <button onClick={() => onNavigateToDashboard('projects')} className="hover:text-gray-300 transition-colors duration-200">
            TaskFlow
          </button>
        </div>
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              <span className="text-white text-sm">Welcome, {currentUser?.username || 'User'}!</span>
              <Button
                onClick={() => onNavigateToDashboard('projects')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md text-sm"
              >
                Projects
              </Button>

              {/* Notifications Dropdown */}
              <div className="relative" ref={notificationsRef}>
                <Button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md text-sm relative"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-50 max-h-96 overflow-y-auto">
                    <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200">
                      <h4 className="font-bold text-gray-800">Notifications</h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                        >
                          Mark All Read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-gray-500 text-sm p-4 text-center">No notifications.</p>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif._id}
                          onClick={() => !notif.isRead && markNotificationAsRead(notif._id)}
                          className={`flex items-start p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${notif.isRead ? 'text-gray-500' : 'bg-blue-50 text-gray-800 font-medium'}`}
                        >
                          {getNotificationIcon(notif.type)}
                          <div className="flex-1">
                            <p className="text-sm leading-snug">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatNotificationDate(notif.createdAt)}</p>
                          </div>
                          {!notif.isRead && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markNotificationAsRead(notif._id); }}
                              className="ml-2 text-gray-400 hover:text-gray-700"
                              title="Mark as read"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <Button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md text-sm"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={onNavigateToLogin}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md text-sm"
              >
                Login
              </Button>
              <Button
                onClick={onNavigateToRegister}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md text-sm"
              >
                Register
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
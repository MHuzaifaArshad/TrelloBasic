import React, { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import Navbar from './components/Navbar';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ProjectListPage from './pages/Projects/ProjectListPage';
import ProjectFormPage from './pages/Projects/ProjectFormPage';
import ProjectDetailsPage from './pages/Projects/ProjectDetailsPage';
import ProjectDashboardPage from './pages/Projects/ProjectDashboardPage';
import { authApi, projectApi, notificationApi } from './api/api';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?._id) {
      setNotifications([]);
      return;
    }
    console.log('Frontend: Attempting to fetch notifications for user:', user._id);
    try {
      const fetchedNotifications = await notificationApi.getNotifications();
      setNotifications(fetchedNotifications);
      console.log('Frontend: Successfully fetched notifications.');
    } catch (err) {
      console.error('Frontend: Error fetching notifications:', err);
    }
  }, [user]);

  const markNotificationAsRead = useCallback(async (notificationId) => {
    try {
      await notificationApi.markNotificationAsRead(notificationId);
      setNotifications(prevNotifs =>
        prevNotifs.map(notif =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (err) {
      console.error('Frontend: Error marking notification as read:', err);
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllNotificationsAsRead();
      setNotifications(prevNotifs =>
        prevNotifs.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (err) {
      console.error('Frontend: Error marking all notifications as read:', err);
    }
  }, []);

  // Effect for initial auth check and setting up Socket.IO connection
  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      try {
        // Attempt to get projects to implicitly check auth status
        await projectApi.getProjects(); 
        setIsLoggedIn(true);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser); // Set user state here

          // Initialize Socket.IO connection only once
          if (!socketRef.current) {
            console.log('Frontend: Initializing Socket.IO connection...');
            socketRef.current = io('http://localhost:5000', {
              withCredentials: true,
            });

            // Set up listeners for notifications
            socketRef.current.on('connect', () => {
              console.log('Frontend: Socket.IO connected.');
            });
            socketRef.current.on('disconnect', () => {
              console.log('Frontend: Socket.IO disconnected.');
            });
            socketRef.current.on('connect_error', (err) => {
              console.error('Frontend: Socket.IO connection error:', err);
            });

            socketRef.current.on('newNotification', (newNotif) => {
              console.log('Frontend: Real-time: New individual notification received', newNotif);
              setNotifications(prevNotifs => [newNotif, ...prevNotifs]); // Add to top
            });

            socketRef.current.on('notificationUpdated', (updatedNotif) => {
              console.log('Frontend: Real-time: Notification updated', updatedNotif);
              setNotifications(prevNotifs =>
                prevNotifs.map(notif =>
                  notif._id === updatedNotif._id ? updatedNotif : notif
                )
              );
            });

            socketRef.current.on('allNotificationsRead', () => {
              console.log('Frontend: Real-time: All notifications marked as read');
              setNotifications(prevNotifs =>
                prevNotifs.map(notif => ({ ...notif, isRead: true }))
              );
            });
          }
          setCurrentPage('projects'); // Navigate after auth check and user set
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          console.log("Frontend: Session check failed: User is not authenticated.");
        } else {
          console.error('Frontend: An unexpected error occurred during auth check:', err);
        }
        setIsLoggedIn(false);
        setUser(null);
        localStorage.removeItem('user');
        setCurrentPage('login');
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();

    // Cleanup Socket.IO on component unmount
    return () => {
      if (socketRef.current) {
        console.log('Frontend: Cleaning up Socket.IO listeners and disconnecting.');
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('newNotification');
        socketRef.current.off('notificationUpdated');
        socketRef.current.off('allNotificationsRead');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Runs once on mount

  // Effect to join user room and fetch notifications when `user` state changes
  useEffect(() => {
    if (user?._id && socketRef.current && socketRef.current.connected) {
      // Emit joinUserRoom only when user is available and socket is connected
      socketRef.current.emit('joinUserRoom', user._id);
      console.log(`Frontend: Emitted joinUserRoom for ${user._id}`);
      fetchNotifications(); // Fetch initial notifications for the logged-in user
    } else if (!user?._id) {
      setNotifications([]); // Clear notifications if user logs out
      console.log('Frontend: User logged out or not available, clearing notifications.');
    } else if (user?._id && socketRef.current && !socketRef.current.connected) {
      console.log('Frontend: User available but socket not connected yet, waiting for connection...');
    }
  }, [user, fetchNotifications]); // Reruns when user changes or fetchNotifications changes

  const handleLogin = async (email, password) => {
    try {
      const response = await authApi.login(email, password);
      setIsLoggedIn(true);
      const userData = { _id: response.userId, username: response.username, email: response.email };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setCurrentPage('projects');
    } catch (err) {
      console.error('Frontend: Login failed:', err);
      throw new Error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleRegister = async (username, email, password) => {
    try {
      const response = await authApi.register(username, email, password);
      setIsLoggedIn(true);
      const userData = { _id: response.userId, username: response.username, email: response.email };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setCurrentPage('projects');
    } catch (err) {
      console.error('Frontend: Registration failed:', err);
      throw new Error(err.response?.data?.message || 'Registration failed.');
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      setIsLoggedIn(false);
      setUser(null);
      localStorage.removeItem('user');
      setCurrentPage('login');
      if (socketRef.current) { // Disconnect socket on logout
        console.log('Frontend: Disconnecting socket on logout.');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }
  };

  const handleNavigate = (page, projectId = null) => {
    console.log('Frontend: Navigating to:', page, 'with Project ID:', projectId);
    setCurrentPage(page);
    setCurrentProjectId(projectId);
  };

  const renderPage = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="text-lg font-semibold text-gray-700">Loading application...</div>
        </div>
      );
    }
    
    if (!isLoggedIn) {
      return (
        currentPage === 'register' ? (
          <RegisterPage onRegister={handleRegister} onNavigateToLogin={() => handleNavigate('login')} />
        ) : (
          <LoginPage onLogin={handleLogin} onNavigateToRegister={() => handleNavigate('register')} />
        )
      );
    }

    switch (currentPage) {
      case 'projects':
        return (
          <ProjectListPage
            onNavigateToProjectDetails={(projectId) => handleNavigate('projectDetails', projectId)}
            onNavigateToCreateProject={() => handleNavigate('createProject')}
            onNavigateToEditProject={(projectId) => handleNavigate('editProject', projectId)}
          />
        );
      case 'createProject':
        return (
          <ProjectFormPage
            onProjectSaved={() => {
              handleNavigate('projects');
            }}
            onCancel={() => handleNavigate('projects')}
          />
        );
      case 'editProject':
        return (
          <ProjectFormPage
            projectId={currentProjectId}
            onProjectSaved={() => {
              handleNavigate('projects');
            }}
            onCancel={() => handleNavigate('projects')}
            isEditMode={true}
          />
        );
      case 'projectDetails':
        return (
          <ProjectDetailsPage
            projectId={currentProjectId}
            onBackToProjects={() => handleNavigate('projects')}
            currentUser={user}
            onNavigateToDashboard={(projectId) => handleNavigate('projectDashboard', projectId)}
          />
        );
      case 'projectDashboard':
        return (
          <ProjectDashboardPage
            projectId={currentProjectId}
            onBackToProjectDetails={(projectId) => handleNavigate('projectDetails', projectId)}
          />
        );
      default:
        return (
          <ProjectListPage
            onNavigateToProjectDetails={(projectId) => handleNavigate('projectDetails', projectId)}
            onNavigateToCreateProject={() => handleNavigate('createProject')}
            onNavigateToEditProject={(projectId) => handleNavigate('editProject', projectId)}
          />
        );
    }
  };

  return (
    <div>
      <Navbar
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        onNavigateToLogin={() => handleNavigate('login')}
        onNavigateToRegister={() => handleNavigate('register')}
        onNavigateToDashboard={() => handleNavigate('projects')}
        notifications={notifications}
        markNotificationAsRead={markNotificationAsRead}
        markAllNotificationsAsRead={markAllNotificationsAsRead}
        currentUser={user}
      />
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderPage()}
      </div>
    </div>
  );
}

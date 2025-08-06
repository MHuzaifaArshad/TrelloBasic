// frontend/src/api/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

//Authentication/User API Calls
const authApi = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('Login successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  register: async (username, email, password) => {
    try {
      const response = await api.post('/auth/register', { username, email, password });
      console.log('Registration successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  logout: async () => {
    try {
      const response = await api.get('/auth/logout');
      console.log('Logout successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Logout error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
};

// Project API Calls
const projectApi = {
  getProjects: async () => {
    try {
      const response = await api.get('/projects');
      return response.data;
    } catch (error) {
      console.error('getProjects error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  createProject: async (projectData) => {
    try {
      const response = await api.post('/projects', projectData);
      return response.data;
    } catch (error) {
      console.error('createProject error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  updateProject: async (id, projectData) => {
    try {
      const response = await api.put(`/projects/${id}`, projectData);
      return response.data;
    } catch (error) {
      console.error('updateProject error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  deleteProject: async (id) => {
    try {
      const response = await api.delete(`/projects/${id}`);
      return response.data;
    } catch (error) {
      console.error('deleteProject error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  getProjectById: async (id) => {
    try {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    } catch (error) {
      console.error('getProjectById error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  getProjectDashboardSummary: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/dashboard-summary`);
      return response.data;
    } catch (error) {
      console.error('getProjectDashboardSummary error:', error.response ? error.response.data : error.message);
      throw error;
    }
  }
};

// Task API Calls
const taskApi = {
  getTasks: async (projectId, searchTerm = '', status = 'All') => {
    try {
        const params = new URLSearchParams();
        if (searchTerm) {
            params.append('search', searchTerm);
        }
        if (status && status !== 'All') {
            params.append('status', status);
        }
        const queryString = params.toString();
        const url = `/projects/${projectId}/tasks${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('getTasks error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  createTask: async (projectId, taskData) => {
    try {
      const response = await api.post(`/projects/${projectId}/tasks`, taskData);
      return response.data;
    } catch (error) {
      console.error('createTask error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  updateTask: async (taskId, taskData) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      console.error('updateTask error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  deleteTask: async (taskId) => {
    try {
      const response = await api.delete(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('deleteTask error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  getTaskById: async (taskId) => {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('getTaskById error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  uploadTaskAttachment: async (taskId, file) => {
    try {
      const formData = new FormData();
      formData.append('attachment', file);

      const response = await api.post(`/tasks/${taskId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('uploadTaskAttachment error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
};

// Chat API Calls 
const chatApi = {
  getMessages: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/chat`);
      return response.data;
    } catch (error) {
      console.error('getMessages error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
};

// Notification API Calls
const notificationApi = {
  getNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('getNotifications error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('markNotificationAsRead error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  markAllNotificationsAsRead: async () => {
    try {
      const response = await api.put('/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      console.error('markAllNotificationsAsRead error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
};


export { authApi, projectApi, taskApi, chatApi, notificationApi };

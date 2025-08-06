import React, { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { projectApi, taskApi, chatApi } from '../../api/api';
import Button from '../../components/Button';
import TaskCard from '../../components/TaskCard';
import TaskForm from '../../components/TaskForm';
import Chatbox from '../../components/Chatbox';
import InputField from '../../components/InputField';
import { PlusCircle, Search, Filter } from 'lucide-react';

export default function ProjectDetailsPage({ projectId, onBackToProjects, currentUser, onNavigateToDashboard }) {
  console.log('ProjectDetailsPage rendered with projectId:', projectId);
  console.log('Current User for Chat:', currentUser);

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState(null);
  const [messages, setMessages] = useState([]);

  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [taskFilterStatus, setTaskFilterStatus] = useState('All');
  const [triggeredSearchTerm, setTriggeredSearchTerm] = useState('');

  const socketRef = useRef(null);

  const fetchProjectAndTasks = useCallback(async () => {
    setLoadingTasks(true);
    setError('');
    try {
      if (!project) {
        setLoadingProject(true);
        const fetchedProject = await projectApi.getProjectById(projectId);
        setProject(fetchedProject);
        setLoadingProject(false);
      }

      const fetchedTasks = await taskApi.getTasks(projectId, triggeredSearchTerm, taskFilterStatus);
      setTasks(fetchedTasks);
    } catch (err) {
      console.error('Error fetching project or tasks:', err);
      setError(err.response?.data?.message || 'Failed to load project details and tasks.');
      setLoadingProject(false);
    } finally {
      setLoadingTasks(false);
    }
  }, [projectId, triggeredSearchTerm, taskFilterStatus, project]);

  const fetchMessages = useCallback(async () => {
    try {
      const fetchedMessages = await chatApi.getMessages(projectId);
      setMessages(fetchedMessages);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchProjectAndTasks();
      fetchMessages();

      // CRITICAL FIX: Connect to the correct backend URL for Socket.IO
      // Use VITE_APP_BACKEND_URL and strip the '/api' path for Socket.IO
      const backendBaseUrl = import.meta.env.VITE_APP_BACKEND_URL
        ? import.meta.env.VITE_APP_BACKEND_URL.replace('/api', '') 
        : 'http://localhost:5000'; // Fallback for local dev

      if (!socketRef.current) {
        socketRef.current = io(backendBaseUrl, { 
          withCredentials: true, 
          transports: ['websocket', 'polling'], 
          
        });

        console.log(`Attempting to connect Socket.IO to: ${backendBaseUrl}`);

        socketRef.current.on('connect', () => {
          console.log('Socket.IO connected:', socketRef.current.id);
          console.log(`Joining project room: ${projectId}`);
          socketRef.current.emit('joinProject', projectId);
        });

        socketRef.current.on('disconnect', (reason) => {
          console.log('Socket.IO disconnected:', reason);
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error);
        });

        socketRef.current.on('taskCreated', (newTask) => {
          console.log('Real-time: Task created', newTask);
          setTasks(prevTasks => [...prevTasks, newTask]);
        });

        socketRef.current.on('taskUpdated', (updatedTask) => {
          console.log('Real-time: Task updated', updatedTask);
          setTasks(prevTasks =>
            prevTasks.map(task =>
              task._id === updatedTask._id ? updatedTask : task
            )
          );
        });

        socketRef.current.on('taskDeleted', (deletedTaskId) => {
          console.log('Real-time: Task deleted', deletedTaskId);
          setTasks(prevTasks => prevTasks.filter(task => task._id !== deletedTaskId));
        });

        socketRef.current.on('newMessage', (message) => {
          console.log('Real-time: New message received on frontend:', message);
          setMessages(prevMessages => [...prevMessages, message]);
        });
      }
    }

    return () => {
      if (socketRef.current) {
        console.log(`Leaving project room and disconnecting socket: ${projectId}`);
        socketRef.current.emit('leaveProject', projectId); // Emit leave event
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('taskCreated');
        socketRef.current.off('taskUpdated');
        socketRef.current.off('taskDeleted');
        socketRef.current.off('newMessage');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [projectId, fetchProjectAndTasks, fetchMessages, project]); // Added project to dependency array

  const handleCreateTask = async (taskData, file) => {
    try {
      const createdTask = await taskApi.createTask(projectId, taskData);
      if (file) {
        await taskApi.uploadTaskAttachment(createdTask._id, file);
      }
      setShowTaskForm(false);
      // Backend will emit 'taskCreated' after saving
    } catch (err) {
      console.error('Error creating task:', err);
      throw new Error(err.response?.data?.message || 'Failed to create task.');
    }
  };

  const handleUpdateTask = async (taskId, taskData, file) => {
    try {
      await taskApi.updateTask(taskId, taskData);
      if (file) {
        await taskApi.uploadTaskAttachment(taskId, file);
      }
      setShowTaskForm(false);
      setEditingTask(null);
      // Backend will emit 'taskUpdated' after saving
    } catch (err) {
      console.error('Error updating task:', err);
      throw new Error(err.response?.data?.message || 'Failed to update task.');
    }
  };

  const handleDeleteTask = (taskId) => {
    setTaskToDeleteId(taskId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDeleteId) return;

    try {
      await taskApi.deleteTask(taskToDeleteId);
      // Backend will emit 'taskDeleted' after saving
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.response?.data?.message || 'Failed to delete task.');
    } finally {
      setShowDeleteModal(false);
      setTaskToDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setTaskToDeleteId(null);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskApi.updateTask(taskId, { status: newStatus });
      // Backend will emit 'taskUpdated' after saving
    } catch (err) {
      console.error('Error changing task status:', err);
      setError(err.response?.data?.message || 'Failed to change task status.');
    }
  };

  const startEditTask = (taskId) => {
    const taskToEdit = tasks.find(t => t._id === taskId);
    if (taskToEdit) {
      setEditingTask(taskToEdit);
      setShowTaskForm(true);
    }
  };

  const cancelTaskForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  const handleSendMessage = (messageText) => {
    console.log('handleSendMessage debug:', {
      socketReady: !!socketRef.current,
      messageNotEmpty: !!messageText.trim(),
      userExists: !!currentUser,
      userIdExists: !!(currentUser && currentUser._id)
    });

    if (!socketRef.current || !messageText.trim() || !currentUser || !currentUser._id) {
      console.warn('Cannot send message: Socket not ready, message empty, or user not logged in.');
      return;
    }

    const messageData = {
      projectId,
      sender: currentUser._id,
      content: messageText,
    };
    
    console.log('Emitting sendMessage:', messageData);
    socketRef.current.emit('sendMessage', messageData);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      setTriggeredSearchTerm(taskSearchTerm);
    }
  };

  const handleSearchButtonClick = () => {
    setTriggeredSearchTerm(taskSearchTerm);
  };

  if (loadingProject) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] bg-gray-900 text-green-400 font-mono text-xl animate-pulse">
        <p>LOADING PROJECT DATA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] bg-red-900 text-red-300 font-mono text-lg">
        <p className="mb-4">ERROR: {error}</p>
        <Button onClick={onBackToProjects} className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-6 border-2 border-red-500 shadow-md transition duration-200 ease-in-out">
          BACK TO PROJECTS
        </Button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] bg-gray-900 text-yellow-400 font-mono text-lg">
        <p className="mb-4">PROJECT NOT FOUND.</p>
        <Button onClick={onBackToProjects} className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-6 border-2 border-gray-500 shadow-md transition duration-200 ease-in-out">
          BACK TO PROJECTS
        </Button>
      </div>
    );
  }

  const todoTasks = tasks.filter(task => task.status === 'To Do');
  const inProgressTasks = tasks.filter(task => task.status === 'In Progress');
  const doneTasks = tasks.filter(task => task.status === 'Done');

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-900 text-gray-100 p-8 border-4 border-gray-600 shadow-xl font-sans">
      {/* Background pattern for retro feel */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none z-0"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b-4 border-gray-600">
        <div className="mb-4 md:mb-0">
          <h1 className="text-5xl font-extrabold text-yellow-400 mb-2 font-mono tracking-widest text-shadow-retro">
            {project.name.toUpperCase()}
          </h1>
          <p className="text-gray-300 text-lg mb-2 font-mono">{project.description}</p>
          <p className="text-gray-400 text-sm font-mono">
            <span className="font-bold text-yellow-400">OWNER:</span> {project.owner?.username.toUpperCase()} | <span className="font-bold text-yellow-400">MEMBERS:</span> {project.members.map(m => m.username.toUpperCase()).join(', ') || 'NONE'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => onNavigateToDashboard(projectId)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-5 border-2 border-purple-500 shadow-md transition duration-200 ease-in-out text-sm flex items-center justify-center font-mono"
          >
            VIEW DASHBOARD
          </Button>
          <Button onClick={onBackToProjects} className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-5 border-2 border-gray-500 shadow-md transition duration-200 ease-in-out text-sm flex items-center justify-center font-mono">
            BACK TO PROJECTS
          </Button>
        </div>
      </div>

      <div className="mb-8 relative z-10">
        <Button
          onClick={() => { setShowTaskForm(true); setEditingTask(null); }}
          className="bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-8 border-4 border-green-500 shadow-lg transform transition duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 flex items-center font-mono text-lg"
        >
          <PlusCircle size={20} className="mr-2" /> ADD NEW TASK
        </Button>
      </div>

      {/* Task Search and Filter Section */}
      <div className="mb-8 p-6 bg-gray-700 rounded-lg shadow-lg flex flex-col sm:flex-row items-center justify-center gap-4 max-w-3xl mx-auto border-2 border-gray-600 relative z-10">
        <div className="w-full sm:w-auto flex-grow">
          <InputField
            label="Search Tasks"
            id="taskSearch"
            type="text"
            value={taskSearchTerm}
            onChange={(e) => setTaskSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="SEARCH BY TITLE OR DESCRIPTION..."
            className="w-full" // InputField component's own classes will handle the styling
          />
        </div>
        
        <Button
          onClick={handleSearchButtonClick}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 border-2 border-purple-500 shadow-md transition duration-200 ease-in-out w-full sm:w-auto h-10 flex items-center justify-center font-mono"
        >
          <Search size={18} className="mr-2" /> SEARCH
        </Button>

        <div className="w-full sm:w-auto">
          <label htmlFor="taskStatusFilter" className="block text-sm font-mono text-gray-300 mb-1 uppercase">FILTER BY STATUS:</label>
          <select
            id="taskStatusFilter"
            value={taskFilterStatus}
            onChange={(e) => setTaskFilterStatus(e.target.value)}
            className="w-full p-2.5 bg-gray-800 text-yellow-400 border-2 border-green-500 rounded-md shadow-sm focus:ring-green-400 focus:border-green-400 h-10 font-mono"
          >
            <option value="All">ALL STATUSES</option>
            <option value="To Do">TO DO</option>
            <option value="In Progress">IN PROGRESS</option>
            <option value="Done">DONE</option>
          </select>
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-gray-950 bg-opacity-80 flex items-center justify-center z-50 p-4 font-sans">
          <TaskForm
            onSubmit={editingTask ? (data, file) => handleUpdateTask(editingTask._id, data, file) : handleCreateTask}
            onCancel={cancelTaskForm}
            initialData={editingTask}
            isEditMode={!!editingTask}
            projectMembers={project.members}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-950 bg-opacity-80 flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-gray-800 p-8 rounded-lg shadow-2xl max-w-sm w-full border-4 border-red-600">
            <h2 className="text-2xl font-bold text-red-400 mb-4 font-mono uppercase">CONFIRM DELETION</h2>
            <p className="text-gray-300 mb-6 font-sans">ARE YOU SURE YOU WANT TO DELETE THIS TASK? THIS ACTION CANNOT BE UNDONE.</p>
            <div className="flex justify-end space-x-4">
              <Button
                onClick={handleCancelDelete}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-5 border-2 border-gray-500 shadow-md transition duration-200 ease-in-out font-mono"
              >
                CANCEL
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-5 border-2 border-red-500 shadow-md transition duration-200 ease-in-out font-mono"
              >
                DELETE
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Task Columns (Kanban Board) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-8 relative z-10">
        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {loadingTasks ? (
            <div className="md:col-span-3 flex items-center justify-center py-20 bg-gray-700 rounded-lg shadow-lg border-2 border-gray-600">
              <p className="text-xl font-semibold text-green-400 font-mono animate-pulse">LOADING TASKS...</p>
            </div>
          ) : (
            <>
              <div className="bg-gray-700 p-6 rounded-lg shadow-md border-2 border-gray-600">
                <h3 className="text-2xl font-bold text-yellow-400 mb-5 pb-3 border-b-2 border-gray-500 flex items-center font-mono uppercase">
                  <span className="mr-2">▶</span> TO DO ({todoTasks.length})
                </h3>
                <div className="space-y-4 min-h-[150px]">
                  {todoTasks.length === 0 ? (
                    <p className="text-gray-400 text-md text-center py-4 font-mono">NO TASKS IN "TO DO".</p>
                  ) : (
                    todoTasks.map(task => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onEdit={startEditTask}
                        onDelete={handleDeleteTask}
                        onStatusChange={handleStatusChange}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="bg-gray-700 p-6 rounded-lg shadow-md border-2 border-gray-600">
                <h3 className="text-2xl font-bold text-blue-400 mb-5 pb-3 border-b-2 border-gray-500 flex items-center font-mono uppercase">
                  <span className="mr-2">⚙</span> IN PROGRESS ({inProgressTasks.length})
                </h3>
                <div className="space-y-4 min-h-[150px]">
                  {inProgressTasks.length === 0 ? (
                    <p className="text-gray-400 text-md text-center py-4 font-mono">NO TASKS "IN PROGRESS".</p>
                  ) : (
                    inProgressTasks.map(task => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onEdit={startEditTask}
                        onDelete={handleDeleteTask}
                        onStatusChange={handleStatusChange}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="bg-gray-700 p-6 rounded-lg shadow-md border-2 border-gray-600">
                <h3 className="text-2xl font-bold text-green-400 mb-5 pb-3 border-b-2 border-gray-500 flex items-center font-mono uppercase">
                  <span className="mr-2">✔</span> DONE ({doneTasks.length})
                </h3>
                <div className="space-y-4 min-h-[150px]">
                  {doneTasks.length === 0 ? (
                    <p className="text-gray-400 text-md text-center py-4 font-mono">NO TASKS "DONE".</p>
                  ) : (
                    doneTasks.map(task => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onEdit={startEditTask}
                        onDelete={handleDeleteTask}
                        onStatusChange={handleStatusChange}
                      />
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Project Chat Section */}
        <div className="md:col-span-1 bg-gray-700 rounded-lg shadow-lg border-2 border-gray-600 flex flex-col h-[600px] font-sans">
          <Chatbox
            messages={messages}
            onSendMessage={handleSendMessage}
            user={currentUser}
          />
        </div>
      </div>
    </div>
  );
}

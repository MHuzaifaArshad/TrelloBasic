import React, { useState, useEffect } from 'react';
import Button from './Button';
import InputField from './InputField';

export default function TaskForm({ onSubmit, onCancel, initialData, isEditMode = false, projectMembers = [] }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('To Do');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setStatus(initialData.status || 'To Do');
      setAssignedTo(initialData.assignedTo?._id || ''); 
      setPriority(initialData.priority || 'Medium');
      if (initialData.dueDate) {
        setDueDate(new Date(initialData.dueDate).toISOString().split('T')[0]);
      } else {
        setDueDate('');
      }
      setSelectedFile(null);
    } else {
      setTitle('');
      setDescription('');
      setStatus('To Do');
      setAssignedTo('');
      setDueDate('');
      setPriority('Medium');
      setSelectedFile(null);
    }
    setError('');
  }, [isEditMode, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!title.trim()) {
      setError('Task title is required.');
      setLoading(false);
      return;
    }

    const finalAssignedTo = assignedTo === '' ? null : assignedTo;
    const finalDueDate = dueDate ? new Date(dueDate).toISOString() : null;

    try {
      const taskData = {
        title,
        description,
        status,
        assignedTo: finalAssignedTo,
        dueDate: finalDueDate,
        priority,
      };

      await onSubmit(taskData, selectedFile);
    } catch (err) {
      console.error("Task submission error:", err);
      setError(err.message || 'Failed to save task.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-2xl max-w-lg w-full border-4 border-green-600 font-sans">
      <h2 className="text-3xl font-bold text-yellow-400 mb-6 font-mono text-shadow-retro uppercase">
        {isEditMode ? 'EDIT TASK' : 'CREATE NEW TASK'}
      </h2>
      {error && <p className="text-red-400 text-sm mb-4 font-mono">{error}</p>}
      <form onSubmit={handleSubmit}>
        <InputField
          label="Title"
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="TASK TITLE"
          required
        />
        <div className="mb-4">
          <label htmlFor="task-description" className="block text-gray-300 font-mono text-sm mb-1 uppercase">
            Description
          </label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2.5 bg-gray-800 text-yellow-400 border-2 border-green-500 rounded-md shadow-inner focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 font-mono placeholder-gray-500"
            rows="3"
            placeholder="DETAILED DESCRIPTION OF THE TASK"
          ></textarea>
        </div>

        <div className="mb-4">
          <label htmlFor="task-status" className="block text-gray-300 font-mono text-sm mb-1 uppercase">
            Status
          </label>
          <select
            id="task-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-2.5 bg-gray-800 text-yellow-400 border-2 border-green-500 rounded-md shadow-inner focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 font-mono"
          >
            <option value="To Do">TO DO</option>
            <option value="In Progress">IN PROGRESS</option>
            <option value="Done">DONE</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="task-priority" className="block text-gray-300 font-mono text-sm mb-1 uppercase">
            Priority
          </label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full p-2.5 bg-gray-800 text-yellow-400 border-2 border-green-500 rounded-md shadow-inner focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 font-mono"
          >
            <option value="Low">LOW</option>
            <option value="Medium">MEDIUM</option>
            <option value="High">HIGH</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="assigned-to" className="block text-gray-300 font-mono text-sm mb-1 uppercase">
            Assigned To
          </label>
          <select
            id="assigned-to"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full p-2.5 bg-gray-800 text-yellow-400 border-2 border-green-500 rounded-md shadow-inner focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 font-mono"
          >
            <option value="">UNASSIGNED</option>
            {projectMembers.map((member) => (
              <option key={member._id} value={member._id}>
                {member.username.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <InputField
          label="Due Date"
          id="task-due-date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required={false}
        />

        <div className="mb-4">
          <label htmlFor="task-attachment" className="block text-gray-300 font-mono text-sm mb-1 uppercase">
            Attachment (Optional)
          </label>
          <input
            type="file"
            id="task-attachment"
            onChange={handleFileChange}
            className="w-full p-2.5 bg-gray-800 text-yellow-400 border-2 border-green-500 rounded-md shadow-inner focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 font-mono
                       file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-bold file:bg-gray-700 file:text-white file:border-2 file:border-gray-500 hover:file:bg-gray-600"
          />
          {selectedFile && (
            <p className="text-sm text-gray-400 mt-2 font-mono">SELECTED FILE: {selectedFile.name.toUpperCase()}</p>
          )}
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <Button
            type="button"
            onClick={onCancel}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-5 border-2 border-gray-500 shadow-md transition duration-200 ease-in-out font-mono"
            disabled={loading}
          >
            CANCEL
          </Button>
          <Button
            type="submit"
            className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-5 border-2 border-green-500 shadow-md transition duration-200 ease-in-out font-mono"
            disabled={loading}
          >
            {loading ? 'SAVING...' : (isEditMode ? 'UPDATE TASK' : 'CREATE TASK')}
          </Button>
        </div>
      </form>
    </div>
  );
}

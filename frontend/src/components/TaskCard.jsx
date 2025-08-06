// frontend/src/components/TaskCard.jsx
import React from 'react';
import Button from './Button'; 
import { Paperclip } from 'lucide-react'; 

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 font-semibold';
      case 'Medium': return 'text-yellow-600 font-semibold';
      case 'Low': return 'text-green-600 font-semibold';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'To Do': return 'bg-gray-200 text-gray-800';
      case 'In Progress': return 'bg-blue-200 text-blue-800';
      case 'Done': return 'bg-green-200 text-green-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-xl border-2 border-gray-600 flex flex-col font-sans text-gray-100">
      <h4 className="text-xl font-bold text-yellow-400 mb-2 font-mono uppercase">{task.title}</h4>
      <p className="text-gray-300 text-sm mb-3 flex-grow">{task.description || 'No description provided.'}</p>

      <div className="text-gray-400 text-xs mb-3 space-y-1">
        <p><span className="font-bold text-yellow-400">STATUS:</span> <span className={`px-2 py-1 rounded-full text-xs font-mono ${getStatusColor(task.status)}`}>{task.status.toUpperCase()}</span></p>
        <p><span className="font-bold text-yellow-400">PRIORITY:</span> <span className={`${getPriorityColor(task.priority)} font-mono`}>{task.priority.toUpperCase()}</span></p>
        <p><span className="font-bold text-yellow-400">DUE DATE:</span> <span className="font-mono">{formatDate(task.dueDate)}</span></p>
        <p><span className="font-bold text-yellow-400">ASSIGNED TO:</span> <span className="font-mono">{task.assignedTo?.username.toUpperCase() || 'UNASSIGNED'}</span></p>
        <p><span className="font-bold text-yellow-400">CREATED BY:</span> <span className="font-mono">{task.createdBy?.username.toUpperCase() || 'N/A'}</span></p>
      </div>

      {/* Display Attachments */}
      {task.attachments && task.attachments.length > 0 && (
        <div className="mt-2 mb-3">
          <p className="font-bold text-yellow-400 text-xs mb-1 font-mono uppercase">Attachments:</p>
          <div className="flex flex-wrap gap-2">
            {task.attachments.map((attachment, index) => (
              <a
                key={index}
                href={attachment.filePath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 bg-gray-700 rounded-full text-xs text-blue-400 hover:bg-gray-600 transition duration-150 ease-in-out border border-gray-500 font-mono"
              >
                <Paperclip size={12} className="mr-1 text-blue-400" />
                {attachment.filename}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Responsive Buttons Container */}
      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t-2 border-gray-600">
        <Button
          onClick={() => onEdit(task._id)}
          className="bg-yellow-600 hover:bg-yellow-700 text-gray-900 text-xs flex-1 min-w-[80px] border-2 border-yellow-500 shadow-lg"
        >
          Edit
        </Button>
        <Button
          onClick={() => onDelete(task._id)}
          className="bg-red-600 hover:bg-red-700 text-white text-xs flex-1 min-w-[80px] border-2 border-red-500 shadow-lg"
        >
          Delete
        </Button>
        {/* Simple status change buttons for quick actions */}
        {task.status !== 'Done' && (
          <Button
            onClick={() => onStatusChange(task._id, task.status === 'To Do' ? 'In Progress' : 'Done')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs flex-1 min-w-[80px] border-2 border-blue-500 shadow-lg"
          >
            {task.status === 'To Do' ? 'Start' : 'Complete'}
          </Button>
        )}
      </div>
    </div>
  );
}

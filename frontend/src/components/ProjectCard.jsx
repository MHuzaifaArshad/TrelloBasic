// frontend/src/components/ProjectCard.jsx
import React from 'react';
import Button from './Button'; // Assuming Button.jsx is in the same components folder

export default function ProjectCard({ project, onEdit, onDelete, onViewDetails }) { // CRITICAL FIX: Changed onSelectProject to onViewDetails
  // Helper to format date if needed
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

  return (
    <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200 flex flex-col h-full">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{project.name}</h3>
      <p className="text-gray-600 text-sm mb-3 flex-grow">{project.description || 'No description provided.'}</p>

      <div className="text-gray-500 text-xs mb-3">
        <p><span className="font-medium">Owner:</span> {project.owner?.username || 'N/A'}</p>
        <p><span className="font-medium">Members:</span> {project.members && project.members.length > 0
          ? project.members.map(member => member.username).join(', ')
          : 'None'}</p>
        <p><span className="font-medium">Created:</span> {formatDate(project.createdAt)}</p>
      </div>

      <div className="flex space-x-2 mt-auto"> {/* mt-auto pushes buttons to the bottom */}
        <Button
          onClick={() => onViewDetails(project._id)} // CRITICAL FIX: Call onViewDetails with project._id
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm flex-1"
        >
          View Project
        </Button>
        <Button
          onClick={() => onEdit(project._id)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm flex-1"
        >
          Edit
        </Button>
        <Button
          onClick={() => onDelete(project._id)}
          className="bg-red-500 hover:bg-red-600 text-white text-sm flex-1"
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
// frontend/src/components/ProjectForm.jsx
import React, { useState, useEffect } from 'react';
import Button from './Button';
import InputField from './InputField';

export default function ProjectForm({ onSubmit, onCancel, initialData, isEditMode = false }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [membersInput, setMembersInput] = useState(''); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      if (initialData.members && initialData.members.length > 0) {
        setMembersInput(initialData.members.map(member => member.username).join(', '));
      } else {
        setMembersInput('');
      }
    }
  }, [isEditMode, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name.trim()) {
      setError('Project name is required.');
      setLoading(false);
      return;
    }

    try {
      const membersArray = membersInput
        .split(',')
        .map(username => username.trim())
        .filter(username => username !== '');

      const projectData = {
        name,
        description,
        members: membersArray,
      };
      await onSubmit(projectData);
    } catch (err) {
      console.error("Project submission error:", err);
      setError(err.message || 'An error occurred while saving the project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Outer container for centering the modal
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Modal content container */}
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg mx-auto transform transition-all duration-300 scale-100 opacity-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {isEditMode ? 'Edit Project' : 'Create New Project'}
        </h2>
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5"> {/* Increased space-y for better vertical spacing */}
          <InputField
            label="Project Name"
            id="projectName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Website Redesign"
            required
          />
          <div> {/* Wrapper for textarea to apply consistent styling */}
            <label htmlFor="projectDescription" className="block text-gray-700 font-semibold mb-2">
              Description
            </label>
            <textarea
              id="projectDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out resize-y" // Added p-3, transition, resize-y
              rows="3"
              placeholder="A brief overview of the project goals and scope."
            ></textarea>
          </div>
          <div> {/* Wrapper for members textarea */}
            <label htmlFor="projectMembers" className="block text-gray-700 font-semibold mb-2">
              Members (by Username)
            </label>
            <textarea
              id="projectMembers"
              value={membersInput}
              onChange={(e) => setMembersInput(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out resize-y" // Added p-3, transition, resize-y
              rows="2"
              placeholder="Enter usernames, separated by commas (e.g., user1, user2)"
            ></textarea>
            <p className="text-xs text-gray-500 mt-1">
              Enter existing usernames, separated by commas.
            </p>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-md transition duration-150 ease-in-out"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150 ease-in-out"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Project' : 'Create Project')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
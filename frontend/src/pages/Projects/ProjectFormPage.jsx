import React, { useState, useEffect } from 'react';
import { projectApi } from '../../api/api';
import Button from '../../components/Button';
import InputField from '../../components/InputField';

export default function ProjectFormPage({ projectId, onProjectSaved, onCancel, isEditMode = false }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState(''); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && projectId) {
      const fetchProject = async () => {
        setLoading(true);
        try {
          const project = await projectApi.getProjectById(projectId);
          setName(project.name);
          setDescription(project.description);
          setMembers(project.members.map(m => m.username).join(', '));
        } catch (err) {
          console.error('Error fetching project for edit:', err);
          setError(err.response?.data?.message || 'Failed to load project for editing.');
        } finally {
          setLoading(false);
        }
      };
      fetchProject();
    } else {
      setName('');
      setDescription('');
      setMembers('');
      setError('');
    }
  }, [isEditMode, projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name.trim()) {
      setError('Project name is required.');
      setLoading(false);
      return;
    }

    const projectData = {
      name,
      description,
      members: members.split(',').map(m => m.trim()).filter(m => m), // Split by comma, trim, filter empty
    };

    try {
      if (isEditMode) {
        await projectApi.updateProject(projectId, projectData);
      } else {
        await projectApi.createProject(projectData);
      }
      onProjectSaved();
    } catch (err) {
      console.error('Error saving project:', err);
      setError(err.response?.data?.message || 'Failed to save project.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] bg-gray-900 text-green-400 font-mono text-xl animate-pulse">
        <p>LOADING PROJECT DATA...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-2xl max-w-2xl w-full mx-auto border-4 border-yellow-600 font-sans">
      <h2 className="text-3xl font-bold text-yellow-400 mb-6 font-mono text-shadow-retro uppercase">
        {isEditMode ? 'EDIT PROJECT' : 'CREATE NEW PROJECT'}
      </h2>
      {error && <p className="text-red-400 text-sm mb-4 font-mono">{error}</p>}
      <form onSubmit={handleSubmit}>
        <InputField
          label="Project Name"
          id="project-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="PROJECT NAME"
          required
        />
        <div className="mb-4">
          <label htmlFor="project-description" className="block text-gray-300 font-mono text-sm mb-1 uppercase">
            Description
          </label>
          <textarea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2.5 bg-gray-800 text-yellow-400 border-2 border-green-500 rounded-md shadow-inner focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 font-mono placeholder-gray-500"
            rows="3"
            placeholder="DETAILED PROJECT DESCRIPTION"
          ></textarea>
        </div>
        <InputField
          label="Members (comma-separated usernames)"
          id="project-members"
          type="text"
          value={members}
          onChange={(e) => setMembers(e.target.value)}
          placeholder="USER1, USER2, USER3"
        />
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
            className="bg-yellow-700 hover:bg-yellow-800 text-white font-bold py-2 px-5 border-2 border-yellow-500 shadow-md transition duration-200 ease-in-out font-mono"
            disabled={loading}
          >
            {loading ? 'SAVING...' : (isEditMode ? 'UPDATE PROJECT' : 'CREATE PROJECT')}
          </Button>
        </div>
      </form>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { projectApi } from '../../api/api';
import Button from '../../components/Button';
import ProjectCard from '../../components/ProjectCard';

export default function ProjectListPage({ onNavigateToProjectDetails, onNavigateToCreateProject, onNavigateToEditProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedProjects = await projectApi.getProjects();
      setProjects(fetchedProjects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.response?.data?.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] bg-gray-900 text-green-400 font-mono text-xl animate-pulse">
        <p>LOADING PROJECTS...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] bg-red-900 text-red-300 font-mono text-lg">
        <p className="mb-4">ERROR: {error}</p>
        <Button onClick={fetchProjects} className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-6 border-2 border-red-500 shadow-md transition duration-200 ease-in-out">
          RETRY
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-800 text-gray-100 p-8 border-4 border-gray-600 shadow-xl font-sans">
      {/* Background pattern for retro feel */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none z-0"></div>
      
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center mb-10 pb-6 border-b-4 border-gray-600">
        <h1 className="text-5xl font-extrabold text-yellow-400 mb-6 sm:mb-0 font-mono tracking-widest text-shadow-retro">
          MY PROJECTS
        </h1>
        <Button
          onClick={onNavigateToCreateProject}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 border-4 border-purple-400 shadow-lg transform transition duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300 font-mono text-lg"
        >
          + NEW PROJECT
        </Button>
      </div>

      {projects.length === 0 && (
        <div className="text-center py-20 bg-gray-700 p-8 border-2 border-gray-600 shadow-inner">
          <p className="text-xl text-yellow-400 font-mono mb-4">NO PROJECTS FOUND.</p>
          <p className="text-lg text-gray-300 font-sans">CREATE ONE TO GET STARTED!</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {projects.map(project => (
          <ProjectCard
            key={project._id}
            project={project}
            onViewDetails={onNavigateToProjectDetails}
            onEdit={onNavigateToEditProject}
          />
        ))}
      </div>
    </div>
  );
}

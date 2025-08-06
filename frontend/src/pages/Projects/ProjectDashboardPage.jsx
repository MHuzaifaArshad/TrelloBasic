// frontend/src/pages/Projects/ProjectDashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { projectApi } from '../../api/api';
import Button from '../../components/Button';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'; // Import Recharts components

// Define colors for the pie chart slices
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#FF8042', '#0088FE', '#00C49F'];

// Custom label for PieChart to show percentage
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function ProjectDashboardPage({ projectId, onBackToProjectDetails }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projectName, setProjectName] = useState(''); // To display project name

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const projectDetails = await projectApi.getProjectById(projectId);
      setProjectName(projectDetails.name);

      const data = await projectApi.getProjectDashboardSummary(projectId);
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchDashboardData();
    }
  }, [projectId, fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <p className="text-lg font-semibold text-gray-700">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
        <p className="text-lg text-red-500">{error}</p>
        <Button onClick={() => onBackToProjectDetails(projectId)} className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold">
          Back to Project
        </Button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
        <p className="text-lg text-gray-700">No dashboard data available for this project.</p>
        <Button onClick={() => onBackToProjectDetails(projectId)} className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold">
          Back to Project
        </Button>
      </div>
    );
  }

  const { tasksByStatus, tasksByAssignee } = dashboardData;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard for "{projectName}"</h1>
          <p className="text-gray-600 text-sm">Visual insights into your project's progress.</p>
        </div>
        <Button onClick={() => onBackToProjectDetails(projectId)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-md text-sm">
          Back to Project
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Tasks by Status Chart (Pie Chart) */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Tasks by Status</h2>
          {tasksByStatus && tasksByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tasksByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status" // CRITICAL FIX: Tell the Pie to use 'status' for the legend
                >
                  {tasksByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend /> {/* Legend will now use nameKey from Pie */}
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500">No tasks to display status for.</p>
          )}
        </div>

        {/* Tasks by Assignee Chart (Bar Chart) */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Tasks by Assignee</h2>
          {tasksByAssignee && tasksByAssignee.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={tasksByAssignee}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="username" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500">No tasks assigned to display.</p>
          )}
        </div>
      </div>
    </div>
  );
}
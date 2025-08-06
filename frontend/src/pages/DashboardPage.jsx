
    import React from 'react';

    export default function DashboardPage({ username }) {
      return (
        <div className="p-4 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome, {username || 'User'}!</h1>
          <p className="text-gray-600">This is your dashboard. More content coming soon!</p>
          <p className="text-gray-500 mt-2">You are logged in.</p>
        </div>
      );
    }
    
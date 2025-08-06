// frontend/src/pages/Auth/RegisterPage.jsx
import React, { useState } from 'react';
import InputField from '../../components/InputField';
import Button from '../../components/Button';

export default function RegisterPage({ onRegister, onNavigateToLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onRegister(username, email, password);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] bg-gray-900 text-gray-100 font-sans relative">
      {/* Background pattern for retro feel */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none z-0"></div>

      <div className="relative z-10 w-full max-w-sm bg-gray-800 p-8 rounded-lg shadow-2xl border-4 border-gray-600">
        <h2 className="text-4xl font-extrabold text-yellow-400 text-center mb-8 font-mono tracking-wider text-shadow-retro">
          REGISTER
        </h2>
        <form onSubmit={handleSubmit}>
          <InputField
            label="USERNAME"
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="CHOOSE A USERNAME"
            required
            labelClassName="text-yellow-400 font-mono"
          />
          <InputField
            label="EMAIL"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="YOUR@EXAMPLE.COM"
            required
            labelClassName="text-yellow-400 font-mono"
          />
          <InputField
            label="PASSWORD"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
            labelClassName="text-yellow-400 font-mono"
          />
          {error && <p className="text-red-500 text-xs mt-1 mb-4 text-center font-mono">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 mt-6 border-2 border-green-500 shadow-lg"
            disabled={loading}
          >
            {loading ? 'REGISTERING...' : 'REGISTER'}
          </Button>
        </form>
        <p className="text-center text-gray-400 text-sm mt-6 font-mono">
          ALREADY HAVE AN ACCOUNT?{' '}
          <button
            onClick={onNavigateToLogin}
            className="text-blue-400 hover:text-blue-300 font-bold transition-colors"
          >
            LOGIN HERE
          </button>
        </p>
      </div>
    </div>
  );
}

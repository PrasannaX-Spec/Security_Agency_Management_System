import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Username and password are required.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const user = await login(username.trim(), password);
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'SUPERVISOR') {
        navigate('/supervisor/live');
      } else if (user.role === 'GUARD') {
        setError('Guard accounts must use the Android mobile application.');
      } else {
        setError('Account role is not recognized for web portal access.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Invalid username or password.';
      setError(typeof msg === 'string' ? msg : 'Unable to sign in. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-accent text-white">
          <Shield size={24} />
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-text">
          Security Agency Operations
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Sign in to manage guard duties, attendance and live locations.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-6 border border-border rounded-lg shadow-sm sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-danger/10 border border-danger/20 p-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-xs font-medium text-text-muted uppercase">
                Username
              </label>
              <div className="mt-1 relative rounded-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                  <User size={16} />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full rounded-md border border-border pl-10 pr-3 py-2 text-sm text-text bg-background focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-text-muted uppercase">
                Password
              </label>
              <div className="mt-1 relative rounded-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-border pl-10 pr-3 py-2 text-sm text-text bg-background focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 transition-colors duration-150"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border flex justify-center space-x-4 text-xs text-text-muted">
            <Link to="/terms" className="hover:text-text hover:underline">
              Terms and Conditions
            </Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-text hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

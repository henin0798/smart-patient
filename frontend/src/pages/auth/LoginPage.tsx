import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api-client';
import { Activity, Eye, EyeOff, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR' | 'ADMIN'>('PATIENT');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingNotice, setLoadingNotice] = useState<string | null>(null);

  useEffect(() => {
    // Proactively pre-warm backend server while user is filling credentials
    api.get('/health').catch(() => {});
  }, []);

  useEffect(() => {
    let timer: any;
    if (isLoading) {
      timer = setTimeout(() => {
        setLoadingNotice('Connecting to cloud server (waking up service, please wait a moment)...');
      }, 3000);
    } else {
      setLoadingNotice(null);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setErrorMessage('Please enter both username/email and password.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const auth = await login(usernameOrEmail, password, role);
      if (auth.role === 'ADMIN') {
        navigate('/admin');
      } else if (auth.role === 'DOCTOR') {
        navigate('/doctor');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string, r: 'PATIENT' | 'DOCTOR' | 'ADMIN') => {
    setUsernameOrEmail(u);
    setPassword(p);
    setRole(r);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2.5">
          <div className="w-12 h-12 rounded-2xl bg-brand-navy flex items-center justify-center text-brand-teal shadow-lg shadow-brand-navy/10">
            <Activity className="w-7 h-7 text-brand-teal" />
          </div>
          <div className="text-left">
            <span className="text-2xl font-bold tracking-tight text-brand-navy">SMART</span>
            <span className="text-2xl font-bold tracking-tight text-brand-teal ml-1">PATIENT</span>
          </div>
        </Link>
        <h2 className="mt-6 text-2xl font-extrabold text-brand-navy tracking-tight">
          Sign In to Your Health Portal
        </h2>
        <p className="mt-1 text-sm text-brand-muted">
          Access your digital health record or manage clinical encounters
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-brand-border sm:px-10">
          {/* Role selector tabs */}
          <div className="mb-6 grid grid-cols-3 gap-1 bg-brand-panel p-1 rounded-xl border border-brand-border">
            {(['PATIENT', 'DOCTOR', 'ADMIN'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  role === r
                    ? 'bg-white text-brand-navy shadow-sm'
                    : 'text-brand-muted hover:text-brand-navy'
                }`}
              >
                {r.charAt(0) + r.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-brand-error text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username or Registered Email"
              type="text"
              required
              placeholder="e.g. patient1 or deepak@student.edu"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-slate-400 hover:text-brand-navy"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button
              type="submit"
              variant="navy"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In as {role.charAt(0) + role.slice(1).toLowerCase()}
            </Button>

            {loadingNotice && (
              <p className="mt-2 text-center text-xs text-brand-teal font-medium animate-pulse">
                {loadingNotice}
              </p>
            )}
          </form>

          {/* Demonstration Quick Fill Box */}
          <div className="mt-6 pt-5 border-t border-brand-border">
            <div className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2.5 text-center">
              Demonstration Test Accounts
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('patient1', 'Patient@123', 'PATIENT')}
                className="p-2 text-left rounded-lg border border-brand-border hover:bg-brand-bg transition"
              >
                <div className="font-bold text-brand-navy">Patient</div>
                <div className="text-[10px] text-brand-muted truncate">patient1</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('dr.sharma', 'Doctor@123', 'DOCTOR')}
                className="p-2 text-left rounded-lg border border-brand-border hover:bg-brand-bg transition"
              >
                <div className="font-bold text-brand-teal">Doctor</div>
                <div className="text-[10px] text-brand-muted truncate">dr.sharma</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'Admin@123', 'ADMIN')}
                className="p-2 text-left rounded-lg border border-brand-border hover:bg-brand-bg transition"
              >
                <div className="font-bold text-brand-error">Admin</div>
                <div className="text-[10px] text-brand-muted truncate">admin</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-brand-muted">
            Don't have a personal health record?{' '}
            <Link to="/register" className="font-semibold text-brand-teal hover:underline">
              Create a Patient ID
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

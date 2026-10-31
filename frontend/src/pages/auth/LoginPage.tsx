import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api-client';
import { Activity, Eye, EyeOff, User, AlertCircle, Stethoscope, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

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
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-teal-500/20">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center animate-apple-fade">
        <Link to="/" className="apple-press inline-flex items-center space-x-2.5">
          <div className="w-12 h-12 rounded-[16px] apple-liquid-glass-teal flex items-center justify-center text-white shadow-md">
            <Activity className="w-6 h-6" />
          </div>
          <div className="text-left leading-none">
            <span className="text-2xl font-black tracking-tight text-[#102B4E]">SMART</span>
            <span className="text-2xl font-black tracking-tight text-teal-600 ml-1">PATIENT</span>
          </div>
        </Link>
        <h2 className="mt-6 text-2xl font-black text-slate-900 tracking-tight">
          Sign In to Your Health Portal
        </h2>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          Access your digital health record, doctor encounters, or clinical administration
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="apple-liquid-glass-card py-8 px-6 sm:px-9 rounded-[28px] shadow-[0_20px_50px_rgba(15,23,42,0.06)] animate-apple-spring border border-white/80">
          {/* Apple Segmented Role Selector */}
          <div className="mb-6 grid grid-cols-3 gap-1 apple-liquid-glass p-1 rounded-2xl border border-slate-200/60 shadow-inner">
            {(['PATIENT', 'DOCTOR', 'ADMIN'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`apple-press py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  role === r
                    ? 'apple-liquid-glass-navy text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {r === 'PATIENT' ? (
                  <User className="w-3.5 h-3.5" />
                ) : r === 'DOCTOR' ? (
                  <Stethoscope className="w-3.5 h-3.5" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span>{r.charAt(0) + r.slice(1).toLowerCase()}</span>
              </button>
            ))}
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200/80 text-rose-700 text-xs font-medium flex items-start space-x-2.5 animate-apple-fade">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username or Registered Email"
              type="text"
              required
              placeholder={
                role === 'PATIENT'
                  ? 'e.g. patient1 or deepak@student.edu'
                  : role === 'DOCTOR'
                  ? 'e.g. dr.sharma'
                  : 'e.g. admin'
              }
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
                className="apple-press absolute right-3.5 top-8 text-slate-400 hover:text-slate-700 p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-3 font-bold"
              isLoading={isLoading}
            >
              Sign In as {role.charAt(0) + role.slice(1).toLowerCase()}
            </Button>

            {loadingNotice && (
              <p className="mt-2 text-center text-xs text-teal-700 font-semibold animate-pulse">
                {loadingNotice}
              </p>
            )}
          </form>

          {/* Demonstration Quick Fill Box */}
          <div className="mt-7 pt-5 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 text-center">
              Demonstration Test Accounts
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('patient1', 'Patient@123', 'PATIENT')}
                className="apple-press p-2.5 text-left rounded-xl apple-liquid-glass hover:border-teal-400/60 transition-all"
              >
                <div className="font-bold text-slate-900">Patient</div>
                <div className="text-[10px] text-slate-500 truncate font-mono">patient1</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('dr.sharma', 'Doctor@123', 'DOCTOR')}
                className="apple-press p-2.5 text-left rounded-xl apple-liquid-glass hover:border-teal-400/60 transition-all"
              >
                <div className="font-bold text-teal-700">Doctor</div>
                <div className="text-[10px] text-slate-500 truncate font-mono">dr.sharma</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'Admin@123', 'ADMIN')}
                className="apple-press p-2.5 text-left rounded-xl apple-liquid-glass hover:border-teal-400/60 transition-all"
              >
                <div className="font-bold text-rose-700">Admin</div>
                <div className="text-[10px] text-slate-500 truncate font-mono">admin</div>
              </button>
            </div>
          </div>

          {/* Contextual Registration Link */}
          <div className="mt-6 text-center text-xs text-slate-500">
            {role === 'DOCTOR' ? (
              <>
                Medical practitioner looking to join the network?{' '}
                <Link to="/register?role=DOCTOR" className="font-bold text-teal-600 hover:text-teal-700 hover:underline block sm:inline mt-1 sm:mt-0">
                  Register Doctor Account
                </Link>
              </>
            ) : role === 'ADMIN' ? (
              <span className="text-slate-400">
                Hospital administrative accounts are created and verified internally.
              </span>
            ) : (
              <>
                Don't have a personal health record?{' '}
                <Link to="/register?role=PATIENT" className="font-bold text-teal-600 hover:text-teal-700 hover:underline block sm:inline mt-1 sm:mt-0">
                  Create a Patient ID
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

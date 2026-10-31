import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import {
  LayoutDashboard,
  Calendar,
  Building2,
  FileText,
  Pill,
  Clock,
  Share2,
  Bell,
  LogOut,
  User,
  ShieldCheck,
  Menu,
  X,
  Stethoscope,
  Activity,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api-client';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Unread notification count
  const { data: notifData } = useQuery<{ unreadCount: number }>({
    queryKey: ['unread-notifications'],
    queryFn: () => api.get<{ unreadCount: number }>('/notifications/unread-count'),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unreadCount = notifData?.unreadCount || 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Role specific menu items
  const patientNav = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Find Care', path: '/find-care', icon: Building2 },
    { label: 'Appointments', path: '/appointments', icon: Calendar },
    { label: 'Medical Reports', path: '/reports', icon: FileText },
    { label: 'Medicine Tracker', path: '/medicines', icon: Pill },
    { label: 'Follow-ups', path: '/follow-ups', icon: Clock },
    { label: 'Share Records', path: '/sharing', icon: Share2 },
    { label: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
  ];

  const doctorNav = [
    { label: 'Doctor Workspace', path: '/doctor', icon: Stethoscope },
    { label: 'Find Care & Directory', path: '/find-care', icon: Building2 },
    { label: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
  ];

  const adminNav = [
    { label: 'Admin Dashboard', path: '/admin', icon: ShieldCheck },
    { label: 'Hospitals Directory', path: '/find-care', icon: Building2 },
    { label: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
  ];

  const navItems =
    user?.role === 'ADMIN'
      ? adminNav
      : user?.role === 'DOCTOR'
      ? doctorNav
      : patientNav;

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col selection:bg-teal-500/20">
      {/* Academic Project Identity Banner */}
      <div className="bg-[#102B4E] text-slate-300 text-[11px] py-1 px-4 border-b border-slate-700/50 flex items-center justify-between tracking-tight">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="font-semibold text-white">Providence College of Engineering</span>
          <span className="hidden sm:inline text-slate-400">• Dept of CSE • PBLCST304 (OOP)</span>
          <span className="hidden md:inline text-slate-400">• Guide: Chitra Mohan</span>
        </div>
        <div className="text-slate-400 text-[10.5px] hidden lg:block font-mono">
          Deepak Biju, Avanthika Aneesh, Henin Alosius, Aman M, Aron George Daniel
        </div>
      </div>

      {/* Top Header with Apple Frosted Glass Layer */}
      <header className="sticky top-0 z-40 apple-glass border-b border-slate-200/70 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden apple-press p-2 rounded-xl text-slate-600 hover:bg-white/80"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/" className="apple-press flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-[11px] apple-liquid-glass-teal flex items-center justify-center text-white shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center">
                  <span className="text-lg font-black tracking-tight text-[#102B4E]">SMART</span>
                  <span className="text-lg font-black tracking-tight text-teal-600 ml-1">PATIENT</span>
                  <span className="hidden sm:inline-block ml-2 text-[9.5px] uppercase tracking-wider font-bold px-2 py-0.5 bg-slate-100/90 text-slate-700 rounded-full border border-slate-200/60">
                    Health System
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* User profile & quick actions */}
          <div className="flex items-center space-x-2.5">
            <Link
              to="/notifications"
              className="apple-press relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <div className="hidden sm:flex items-center space-x-2.5 pl-3 border-l border-slate-200/70">
              <div className="w-8 h-8 rounded-full apple-liquid-glass flex items-center justify-center text-[#102B4E] font-bold text-xs shadow-sm">
                {user?.fullName?.charAt(0) || <User className="w-3.5 h-3.5" />}
              </div>
              <div className="text-left leading-tight">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{user?.fullName}</span>
                  {user?.role && (
                    <Badge variant={user.role === 'ADMIN' ? 'error' : user.role === 'DOCTOR' ? 'teal' : 'primary'} size="sm">
                      {user.role}
                    </Badge>
                  )}
                </div>
                {user?.patientCode && (
                  <span className="text-[10px] font-mono text-slate-500 font-semibold">{user.patientCode}</span>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout securely"
              className="apple-press p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 transition-colors ml-1"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Desktop Sidebar with Apple Translucent Layer */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-24 apple-glass rounded-[24px] border border-white/80 p-3 shadow-[0_4px_24px_rgba(15,23,42,0.02)] space-y-4">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`apple-press flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'apple-liquid-glass-navy text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-teal-300' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isActive ? 'bg-teal-400 text-slate-950 font-bold' : 'bg-slate-200/80 text-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Digital ID Card */}
            {user?.patientCode && (
              <div className="apple-liquid-glass rounded-[18px] p-3.5 border border-white/90">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  Digital Health ID
                </div>
                <div className="text-sm font-bold font-mono text-[#102B4E] mt-0.5">
                  {user.patientCode}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Secured patient health record key.
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Slide-out Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-md animate-apple-fade"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-white/95 backdrop-blur-2xl h-full p-5 flex flex-col shadow-2xl z-10 animate-apple-spring rounded-r-[28px] border-r border-white/80">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg apple-liquid-glass-teal flex items-center justify-center text-white">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-sm text-[#102B4E]">SMART PATIENT</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="apple-press p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 border-b border-slate-100">
                <div className="font-bold text-sm text-slate-900">{user?.fullName}</div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">{user?.patientCode || user?.email}</div>
                {user?.role && (
                  <Badge variant="teal" size="sm" className="mt-2">
                    {user.role}
                  </Badge>
                )}
              </div>

              <nav className="space-y-1 mt-4 flex-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`apple-press flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive
                          ? 'apple-liquid-glass-navy text-white'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-teal-300' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <button
                onClick={handleLogout}
                className="apple-press mt-4 flex items-center space-x-2 text-rose-600 p-3 rounded-xl hover:bg-rose-50/80 text-xs font-semibold w-full"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out securely</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 min-w-0 animate-apple-fade">{children || <Outlet />}</main>
      </div>
    </div>
  );
};

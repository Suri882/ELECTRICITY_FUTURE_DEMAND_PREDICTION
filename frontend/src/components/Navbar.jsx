import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Bell, User as UserIcon, LogOut, Menu, Shield } from 'lucide-react';
import api from '../services/api';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const fetchAlerts = async () => {
        try {
          const res = await api.get('/alerts');
          const unread = res.data.filter((a) => !a.is_read).length;
          setUnreadCount(unread);
        } catch (err) {
          // silent fallback
        }
      };
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Zap className="h-5 w-5 text-slate-950 font-bold" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              ElectroWise
              <span className="hidden sm:inline-block rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 tracking-wider">
                ENERGY PLATFORM
              </span>
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick link to Planning Studio */}
        <Link
          to="/planning-studio"
          className="hidden md:flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Energy Planning Studio</span>
        </Link>
        {user ? (
          <>
            {/* Consumer Type Badge */}
            <span className="hidden md:inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 border border-slate-700">
              {isAdmin ? (
                <Shield className="mr-1.5 h-3.5 w-3.5 text-indigo-400" />
              ) : null}
              {isAdmin ? 'System Admin' : user.consumer_type}
            </span>

            {/* Notification Bell */}
            <Link
              to="/notifications"
              className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Notification Center"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Profile Dropdown / Quick Links */}
            <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-lg py-1.5 px-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-950 border border-emerald-700/50 text-emerald-400 font-semibold text-xs">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <span className="hidden lg:inline-block font-medium truncate max-w-[120px]">
                  {user.name}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;

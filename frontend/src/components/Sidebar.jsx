import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  TrendingUp,
  Zap,
  CloudSun,
  DollarSign,
  Sliders,
  Leaf,
  Lightbulb,
  FileText,
  Settings,
  BarChart3,
  AlertTriangle,
  User,
  ShieldCheck,
  LogOut,
  PlusCircle,
  Sparkles,
  Building2,
} from 'lucide-react';

const Sidebar = ({ onClose }) => {
  const { user, isAdmin, logout } = useAuth();

  // Energy Intelligence Navigation Links
  const primaryNavItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Energy Planning Studio', to: '/planning-studio', icon: Building2, highlight: true },
    { label: 'Demand Prediction', to: '/predictions', icon: TrendingUp },
    { label: 'Peak-Demand Analysis', to: '/peak-demand', icon: Zap },
    { label: 'Weather Insights', to: '/weather', icon: CloudSun },
    { label: 'Bill Estimator', to: '/billing', icon: DollarSign },
    { label: 'What-If Simulator', to: '/simulator', icon: Sliders },
    { label: 'Carbon Emissions', to: '/carbon', icon: Leaf },
    { label: 'Smart Recommendations', to: '/recommendations', icon: Lightbulb },
    { label: 'Reports and History', to: '/reports', icon: FileText },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  // Secondary Data & Operations Links
  const secondaryNavItems = [
    { label: 'Consumption Logs', to: '/consumption', icon: BarChart3 },
    { label: 'Anomaly Diagnostics', to: '/anomalies', icon: AlertTriangle },
    { label: 'User Profile', to: '/profile', icon: User },
  ];

  return (
    <aside className="flex h-full flex-col justify-between border-r border-slate-800 bg-slate-900/95 py-5 px-3 overflow-y-auto">
      <div>
        {/* Quick Add CTA */}
        <div className="mb-4 px-1">
          <NavLink
            to="/consumption/add"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/10 hover:from-emerald-400 hover:to-teal-400 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Meter Entry</span>
          </NavLink>
        </div>

        {/* Primary Navigation list */}
        <nav className="space-y-0.5">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Energy Intelligence
          </p>
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full">
                    <Sparkles className="h-2.5 w-2.5" />
                    New
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* Secondary Data section */}
          <div className="pt-3 mt-3 border-t border-slate-800/80">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Data & Operations
            </p>
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-slate-200 border border-slate-700'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-300'
                    }`
                  }
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Admin section if applicable */}
          {isAdmin && (
            <div className="pt-3 mt-3 border-t border-slate-800/80">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1.5">
                Administration
              </p>
              <NavLink
                to="/admin"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-indigo-300'
                  }`
                }
              >
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                <span>Admin Dashboard</span>
              </NavLink>
            </div>
          )}
        </nav>
      </div>

      {/* User info & Logout */}
      <div className="border-t border-slate-800 pt-3 px-1 mt-4">
        <div className="flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              logout();
              if (onClose) onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors shrink-0"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

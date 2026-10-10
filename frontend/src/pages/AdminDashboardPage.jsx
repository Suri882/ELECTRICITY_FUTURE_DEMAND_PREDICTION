import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  ShieldCheck,
  Users,
  Activity,
  Zap,
  TrendingUp,
  Bell,
  Award,
  Search,
  Trash2,
  Calendar,
  Building2,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const AdminDashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Protect route
  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch admin system data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to permanently delete user account: ${userEmail}?`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete user.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading centralized administrator telemetry..." />;
  }

  if (!data) return null;

  const { stats, users, activity_trends } = data;

  const filteredUsers = users.filter((u) => {
    const s = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      u.consumer_type.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-indigo-400" />
            <span>Admin Governance & System Monitor</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            System-wide user activity, regression volume, and platform analytics
          </p>
        </div>

        <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30 self-start sm:self-auto">
          Root Administrator Access
        </span>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 inline mr-2 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Admin Stat Cards (Section 26) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Total Users"
          value={stats.total_users}
          subtitle="Registered accounts"
          icon={Users}
          badge="Platform"
          badgeColor="blue"
        />
        <StatCard
          title="Active Users"
          value={stats.active_users}
          subtitle="Logged telemetry"
          icon={Activity}
          badge="Engaged"
          badgeColor="emerald"
        />
        <StatCard
          title="Total Records"
          value={stats.total_consumption_records}
          subtitle="Consumption logs"
          icon={Zap}
          badge="Telemetry"
          badgeColor="teal"
        />
        <StatCard
          title="ML Forecasts"
          value={stats.total_predictions}
          subtitle="Model executions"
          icon={TrendingUp}
          badge="Regressors"
          badgeColor="emerald"
        />
        <StatCard
          title="Total Alerts"
          value={stats.total_alerts}
          subtitle="Events triggered"
          icon={Bell}
          badge="Dispatched"
          badgeColor="amber"
        />
        <StatCard
          title="Avg Efficiency"
          value={`${stats.average_efficiency_score} / 100`}
          subtitle="Overall platform"
          icon={Award}
          badge="Benchmark"
          badgeColor="emerald"
        />
      </div>

      {/* System Activity Chart */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Platform System Activity Trends</h3>
            <p className="text-xs text-slate-400">Monthly progression of records, ML predictions, and alerts</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activity_trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="records_logged" name="Records Logged" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="predictions_run" name="ML Predictions" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="alerts_triggered" name="Alerts Dispatched" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Management Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">Registered Consumer Directory</h3>
            <p className="text-xs text-slate-400">Manage user accounts and monitor telemetry isolation</p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">User</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Budget</th>
                <th className="py-3 px-4 font-semibold">Logs</th>
                <th className="py-3 px-4 font-semibold">Forecasts</th>
                <th className="py-3 px-4 font-semibold">Created</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-white">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold border ${
                        u.role === 'ADMIN'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-300">{u.consumer_type}</td>
                  <td className="py-3 px-4 text-xs text-slate-200">
                    {u.monthly_budget > 0 ? `₹${u.monthly_budget.toLocaleString()}` : 'Not set'}
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">{u.records_count}</td>
                  <td className="py-3 px-4 text-teal-400 font-bold">{u.predictions_count}</td>
                  <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {u.id !== user?.id && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

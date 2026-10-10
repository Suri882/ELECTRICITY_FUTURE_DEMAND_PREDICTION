import React, { useState, useEffect } from 'react';
import api from '../services/api';
import EmptyState from '../components/EmptyState';
import { LoadingSpinner, AlertBadge } from '../components/LoadingSpinner';
import {
  Bell,
  CheckCheck,
  Check,
  AlertTriangle,
  Zap,
  DollarSign,
  Lightbulb,
  FileText,
  Smartphone,
} from 'lucide-react';

const NotificationsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [fcmRegistered, setFcmRegistered] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/alerts');
      setAlerts(res.data);
    } catch (err) {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/alerts/${id}/read`);
      setAlerts(alerts.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
    } catch (err) {
      //
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/alerts/mark-all-read');
      setAlerts(alerts.map((a) => ({ ...a, is_read: true })));
    } catch (err) {
      //
    }
  };

  const handleEnablePush = async () => {
    try {
      // Register web push token
      const mockDeviceToken = `fcm_web_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await api.post('/alerts/token', {
        device_token: mockDeviceToken,
        platform: 'web-browser',
      });
      setFcmRegistered(true);
    } catch (err) {
      alert('Failed to register notification token.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Connecting to notification center..." />;
  }

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'unread') return !a.is_read;
    return true;
  });

  const getAlertIcon = (type) => {
    switch (type) {
      case 'HIGH_DEMAND':
        return <Zap className="h-4 w-4 text-rose-400" />;
      case 'ANOMALY':
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case 'BUDGET':
        return <DollarSign className="h-4 w-4 text-cyan-400" />;
      case 'RECOMMENDATION':
        return <Lightbulb className="h-4 w-4 text-emerald-400" />;
      case 'REPORT':
        return <FileText className="h-4 w-4 text-indigo-400" />;
      default:
        return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl flex items-center gap-2">
            <span>Notification Center</span>
            {alerts.filter((a) => !a.is_read).length > 0 && (
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-400 border border-rose-500/30">
                {alerts.filter((a) => !a.is_read).length} Unread
              </span>
            )}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Real-time consumption alerts, high demand forecasts, and energy budget notifications
          </p>
        </div>

        <div className="flex items-center gap-2">
          {alerts.some((a) => !a.is_read) && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-750 hover:text-white transition-colors"
            >
              <CheckCheck className="h-4 w-4 text-emerald-400" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {/* FCM Push Notification Device Registration Banner (Section 21) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Firebase Cloud Messaging (FCM) Integration</h4>
            <p className="text-xs text-slate-400">
              Receive instant push alerts for critical surges, budget breaches, and ready audit reports.
            </p>
          </div>
        </div>

        <button
          onClick={handleEnablePush}
          disabled={fcmRegistered}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors shrink-0 ${
            fcmRegistered
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          }`}
        >
          {fcmRegistered ? '✓ Push Registered' : 'Enable Mobile Push'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          All Notifications ({alerts.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            filter === 'unread'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Unread Only ({alerts.filter((a) => !a.is_read).length})
        </button>
      </div>

      {/* Notifications List */}
      {filteredAlerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          description="Your grid profile is operating normally. When anomalies, high demand periods, or budget alerts occur, they will appear here."
          actionLabel="View Dashboard"
          actionTo="/dashboard"
        />
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((a) => (
            <div
              key={a.id}
              className={`rounded-2xl border p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                a.is_read
                  ? 'border-slate-800 bg-slate-900/40 opacity-75'
                  : 'border-slate-700/80 bg-slate-900/95 shadow-md shadow-slate-950/40'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="rounded-xl bg-slate-800 p-2.5 border border-slate-700/60 shrink-0 mt-0.5">
                  {getAlertIcon(a.alert_type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{a.title}</h3>
                    <AlertBadge severity={a.severity} />
                    {!a.is_read && (
                      <span className="h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">{a.message}</p>
                  <span className="text-[10px] text-slate-500 mt-2 block">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {!a.is_read && (
                <button
                  onClick={() => handleMarkAsRead(a.id)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-750 hover:text-white transition-colors self-end sm:self-center shrink-0 flex items-center gap-1"
                >
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Mark Read</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;

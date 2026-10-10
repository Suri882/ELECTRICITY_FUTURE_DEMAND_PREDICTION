import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, Phone, Building2, MapPin, DollarSign, Zap, Bell, CheckCircle2, AlertCircle } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    consumer_type: 'Household',
    location: '',
    monthly_budget: '',
    avg_monthly_consumption: '',
    notification_enabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        consumer_type: user.consumer_type || 'Household',
        location: user.location || '',
        monthly_budget: user.monthly_budget ? user.monthly_budget.toString() : '0',
        avg_monthly_consumption: user.avg_monthly_consumption
          ? user.avg_monthly_consumption.toString()
          : '0',
        notification_enabled: user.notification_enabled ?? true,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await updateProfile({
        name: formData.name,
        consumer_type: formData.consumer_type,
        location: formData.location,
        monthly_budget: parseFloat(formData.monthly_budget) || 0,
        avg_monthly_consumption: parseFloat(formData.avg_monthly_consumption) || 0,
        notification_enabled: formData.notification_enabled,
      });
      setMessage('Profile and preferences updated successfully.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Consumer Profile Setup</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Configure tariff parameters, budget thresholds, and telemetry notification preferences
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-sm shadow-xl">
        {message && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Consumer Classification
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <select
                  name="consumer_type"
                  value={formData.consumer_type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Household">Household (Residential)</option>
                  <option value="College">College (Campus/Institutional)</option>
                  <option value="Office">Office (Commercial Complex)</option>
                  <option value="Small Industry">Small Industry (Industrial)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Location / Facility City
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  name="location"
                  placeholder="e.g. Bangalore, KA"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Monthly Electricity Budget (₹)
              </label>
              <div className="relative">
                <DollarSign className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="monthly_budget"
                  placeholder="e.g. 5000.0"
                  value={formData.monthly_budget}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Avg Monthly Consumption (kWh)
              </label>
              <div className="relative">
                <Zap className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="avg_monthly_consumption"
                  placeholder="e.g. 450.0"
                  value={formData.avg_monthly_consumption}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Readonly Account Info */}
          <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
            <div>
              <span className="font-semibold text-slate-300">Account Email:</span> {user?.email}
            </div>
            <div>
              <span className="font-semibold text-slate-300">Account Phone:</span> {user?.phone}
            </div>
          </div>

          {/* Notification Checkbox */}
          <div className="pt-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="notif_toggle"
              name="notification_enabled"
              checked={formData.notification_enabled}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
            />
            <label htmlFor="notif_toggle" className="text-xs text-slate-300 cursor-pointer">
              Enable smart mobile push & in-app alerts for high demand periods and anomalies
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving Profile...' : 'Save Profile Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;

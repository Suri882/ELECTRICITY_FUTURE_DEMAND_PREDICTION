import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Zap, Calendar, DollarSign, Clock, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

const AddConsumptionPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    units_consumed: '',
    bill_amount: '',
    number_of_days: '30',
    peak_usage: '0',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const units = parseFloat(formData.units_consumed);
    const bill = parseFloat(formData.bill_amount);
    const days = parseInt(formData.number_of_days);
    const peak = parseFloat(formData.peak_usage || '0');

    if (isNaN(units) || units <= 0) {
      setError('Units consumed must be a positive number.');
      return;
    }
    if (isNaN(bill) || bill < 0) {
      setError('Bill amount cannot be negative.');
      return;
    }
    if (isNaN(days) || days <= 0 || days > 366) {
      setError('Number of days must be between 1 and 366.');
      return;
    }
    if (peak < 0 || peak > units) {
      setError(`Peak usage (${peak}) cannot exceed total units consumed (${units}).`);
      return;
    }

    setLoading(true);
    try {
      await api.post('/consumption', {
        date: formData.date,
        units_consumed: units,
        bill_amount: bill,
        number_of_days: days,
        peak_usage: peak,
      });

      setSuccess('Electricity consumption record logged successfully! Autonomous analytics updated.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save record. Please check values.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/consumption"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Log Electricity Consumption</h1>
          <p className="text-xs text-slate-400">Add verified billing telemetry to feed predictive models</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-sm shadow-xl">
        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Billing Date *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Calendar className="h-4 w-4" />
                </div>
                <input
                  type="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Units Consumed */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Units Consumed (kWh) *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Zap className="h-4 w-4" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  name="units_consumed"
                  required
                  value={formData.units_consumed}
                  onChange={handleChange}
                  placeholder="e.g. 450.5"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Bill Amount */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Bill Amount (₹) *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <DollarSign className="h-4 w-4" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="bill_amount"
                  required
                  value={formData.bill_amount}
                  onChange={handleChange}
                  placeholder="e.g. 3250.0"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Number of Days */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Cycle Days *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Clock className="h-4 w-4" />
                </div>
                <input
                  type="number"
                  min="1"
                  max="366"
                  name="number_of_days"
                  required
                  value={formData.number_of_days}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Peak Usage */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Peak Hours Usage (kWh)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Zap className="h-4 w-4 text-amber-400" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="peak_usage"
                  value={formData.peak_usage}
                  onChange={handleChange}
                  placeholder="e.g. 110.0"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Link
              to="/consumption"
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving Telemetry...' : 'Save Electricity Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddConsumptionPage;

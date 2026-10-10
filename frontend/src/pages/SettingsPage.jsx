import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sliders,
  DollarSign,
  Leaf,
  CloudSun,
  Database,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { energyApi } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [demoActionLoading, setDemoActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: 'success' });

  // Settings form state
  const [formData, setFormData] = useState({
    demand_threshold_low: 250,
    demand_threshold_medium: 450,
    demand_threshold_high: 700,
    base_tariff_rate: 7.50,
    peak_tariff_multiplier: 1.40,
    fixed_charges: 120.0,
    tax_percentage: 5.0,
    grid_emission_factor: 0.82,
    weather_city: 'Bengaluru',
    weather_latitude: 12.9716,
    weather_longitude: 77.5946,
    demo_mode: false,
  });

  useEffect(() => {
    fetchProfileSettings();
  }, []);

  const fetchProfileSettings = async () => {
    try {
      setLoading(true);
      const res = await energyApi.getUserProfile();
      if (res.data) {
        setFormData({
          demand_threshold_low: res.data.demand_threshold_low ?? 250,
          demand_threshold_medium: res.data.demand_threshold_medium ?? 450,
          demand_threshold_high: res.data.demand_threshold_high ?? 700,
          base_tariff_rate: res.data.base_tariff_rate ?? 7.50,
          peak_tariff_multiplier: res.data.peak_tariff_multiplier ?? 1.40,
          fixed_charges: res.data.fixed_charges ?? 120.0,
          tax_percentage: res.data.tax_percentage ?? 5.0,
          grid_emission_factor: res.data.grid_emission_factor ?? 0.82,
          weather_city: res.data.weather_city || 'Bengaluru',
          weather_latitude: res.data.weather_latitude ?? 12.9716,
          weather_longitude: res.data.weather_longitude ?? 77.5946,
          demo_mode: res.data.demo_mode ?? false,
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await energyApi.updateUserProfile(formData);
      setFeedbackMsg({ text: 'All energy settings saved and applied platform-wide!', type: 'success' });
      setTimeout(() => setFeedbackMsg({ text: '', type: 'success' }), 4000);
    } catch (err) {
      setFeedbackMsg({ text: err.response?.data?.detail || 'Failed to save settings.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDemoData = async (load = true) => {
    try {
      setDemoActionLoading(true);
      if (load) {
        const res = await energyApi.loadDemoData();
        setFormData({ ...formData, demo_mode: true });
        setFeedbackMsg({ text: res.data?.message || 'Loaded 12-month demo dataset!', type: 'success' });
      } else {
        const res = await energyApi.clearDemoData();
        setFormData({ ...formData, demo_mode: false });
        setFeedbackMsg({ text: res.data?.message || 'Cleared demo data. Switched to clean real-data mode.', type: 'success' });
      }
      setTimeout(() => setFeedbackMsg({ text: '', type: 'success' }), 4000);
    } catch (err) {
      setFeedbackMsg({ text: 'Failed to update demonstration dataset.', type: 'error' });
    } finally {
      setDemoActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner text="Loading system configuration..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300 border border-slate-700">
          <Settings className="h-3 w-3" />
          System Preferences
        </span>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100 mt-1">
          Platform Configuration & Intelligence Settings
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Configure personal demand thresholds, utility billing tariffs, regional carbon factors, weather location, and test modes.
        </p>
      </div>

      {feedbackMsg.text && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3.5 text-sm font-medium border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Demonstration Mode Card */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-slate-900 to-slate-900 p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-400" />
              <h3 className="font-semibold text-slate-100 text-base">Demonstration Mode & Evaluation Dataset</h3>
              {formData.demo_mode && (
                <span className="rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300">
              Load a realistic 12-month historical consumption and peak profile to evaluate all ML prediction models,
              What-If simulator scenarios, and weather analytics with 1 click.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!formData.demo_mode ? (
              <button
                type="button"
                onClick={() => handleToggleDemoData(true)}
                disabled={demoActionLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-400 hover:to-cyan-400 transition-all disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{demoActionLoading ? 'Loading Data...' : 'Load 12-Month Demo Data'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleToggleDemoData(false)}
                disabled={demoActionLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 px-4 py-2 text-xs font-semibold transition-all disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{demoActionLoading ? 'Resetting...' : 'Clear Demo Data (Real Mode)'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 1: Demand Thresholds */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="h-5 w-5 text-emerald-400" />
              <h2 className="font-semibold text-slate-200">Demand Level Thresholds (kWh/month)</h2>
            </div>
            <p className="text-xs text-slate-400">
              Thresholds used to categorize your usage as LOW, MEDIUM, HIGH, or CRITICAL.
            </p>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Low Ceiling</label>
                <input
                  type="number"
                  value={formData.demand_threshold_low}
                  onChange={(e) => setFormData({ ...formData, demand_threshold_low: Number(e.target.value) })}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Medium Ceiling</label>
                <input
                  type="number"
                  value={formData.demand_threshold_medium}
                  onChange={(e) => setFormData({ ...formData, demand_threshold_medium: Number(e.target.value) })}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">High Ceiling</label>
                <input
                  type="number"
                  value={formData.demand_threshold_high}
                  onChange={(e) => setFormData({ ...formData, demand_threshold_high: Number(e.target.value) })}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Tariffs */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <DollarSign className="h-5 w-5 text-cyan-400" />
              <h2 className="font-semibold text-slate-200">Electricity Tariffs & Charges</h2>
            </div>
            <p className="text-xs text-slate-400">
              Tariff schedule applied across bill estimations and simulator financial calculations.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Base Tariff (₹/kWh)</label>
                <input
                  type="number"
                  step="0.25"
                  value={formData.base_tariff_rate}
                  onChange={(e) => setFormData({ ...formData, base_tariff_rate: Number(e.target.value) })}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Peak Surcharge Multiplier</label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.peak_tariff_multiplier}
                  onChange={(e) => setFormData({ ...formData, peak_tariff_multiplier: Number(e.target.value) })}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Fixed Monthly Charge (₹)</label>
                <input
                  type="number"
                  value={formData.fixed_charges}
                  onChange={(e) => setFormData({ ...formData, fixed_charges: Number(e.target.value) })}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Electricity Duty / Tax (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.tax_percentage}
                  onChange={(e) => setFormData({ ...formData, tax_percentage: Number(e.target.value) })}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Weather Coordinates */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <CloudSun className="h-5 w-5 text-amber-400" />
              <h2 className="font-semibold text-slate-200">Weather Location & Meteorological Source</h2>
            </div>
            <p className="text-xs text-slate-400">
              City name and geographic coordinates for live Open-Meteo meteorological API calls.
            </p>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">City Name</label>
                <input
                  type="text"
                  value={formData.weather_city}
                  onChange={(e) => setFormData({ ...formData, weather_city: e.target.value })}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.weather_latitude}
                  onChange={(e) => setFormData({ ...formData, weather_latitude: Number(e.target.value) })}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.weather_longitude}
                  onChange={(e) => setFormData({ ...formData, weather_longitude: Number(e.target.value) })}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Carbon Emission Factor */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Leaf className="h-5 w-5 text-teal-400" />
              <h2 className="font-semibold text-slate-200">Grid Carbon Intensity Factor</h2>
            </div>
            <p className="text-xs text-slate-400">
              Regional grid factor in kg CO2e / kWh used for environmental calculations.
            </p>

            <div className="text-xs space-y-2">
              <div>
                <label className="text-slate-400 block mb-1">Emission Factor (kg CO2e / kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.05"
                  max="2.0"
                  value={formData.grid_emission_factor}
                  onChange={(e) => setFormData({ ...formData, grid_emission_factor: Number(e.target.value) })}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
              <span className="text-[11px] text-slate-500 block">
                Standard baseline: 0.82 kg/kWh (India CEA Grid Benchmark)
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {saving ? 'Saving System Preferences...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;

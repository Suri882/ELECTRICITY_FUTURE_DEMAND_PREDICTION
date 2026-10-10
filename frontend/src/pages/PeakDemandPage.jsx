import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Zap,
  Clock,
  Sliders,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle,
  HelpCircle,
  Info,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { energyApi } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

const PeakDemandPage = () => {
  const [loading, setLoading] = useState(true);
  const [peakData, setPeakData] = useState(null);
  const [thresholds, setThresholds] = useState({ low: 250, medium: 450, high: 700 });
  const [savingThresholds, setSavingThresholds] = useState(false);
  const [thresholdMsg, setThresholdMsg] = useState('');

  useEffect(() => {
    fetchPeakData();
  }, []);

  const fetchPeakData = async () => {
    try {
      setLoading(true);
      const res = await energyApi.getPeakDemand();
      setPeakData(res.data);
      if (res.data?.thresholds_applied) {
        setThresholds({
          low: res.data.thresholds_applied.low || 250,
          medium: res.data.thresholds_applied.medium || 450,
          high: res.data.thresholds_applied.high || 700,
        });
      }
    } catch (err) {
      console.error('Failed to fetch peak demand analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateThresholds = async (e) => {
    e.preventDefault();
    try {
      setSavingThresholds(true);
      await energyApi.updateThresholds(thresholds);
      setThresholdMsg('Thresholds updated successfully!');
      setTimeout(() => setThresholdMsg(''), 4000);
      fetchPeakData();
    } catch (err) {
      setThresholdMsg(err.response?.data?.detail || 'Failed to update thresholds.');
    } finally {
      setSavingThresholds(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner text="Analyzing grid peak demand patterns..." />
      </div>
    );
  }

  const category = peakData?.demand_category || 'MEDIUM';
  const categoryColor = {
    LOW: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    MEDIUM: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    HIGH: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    CRITICAL: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  }[category] || 'text-slate-300 bg-slate-800 border-slate-700';

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <Zap className="h-3 w-3" />
            Grid Stress Monitoring
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100 mt-1">
            Smart Peak-Demand Detection & Alerts
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Identify upcoming high-load windows, monitor configurable demand thresholds, and shift flexible loads.
          </p>
        </div>

        {/* Demand Level Badge */}
        <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 ${categoryColor}`}>
          <AlertTriangle className="h-5 w-5" />
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
              Demand Level
            </span>
            <span className="text-lg font-bold">{category}</span>
          </div>
        </div>
      </div>

      {/* Advance Warning Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 p-5 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-100 text-base">Advance Peak Alert Notice</h3>
            <p className="text-sm text-slate-300">{peakData?.advance_alert}</p>
            <p className="text-xs text-amber-400/90 pt-1 flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5" />
              Expected Critical Surge Window: {peakData?.peak_window || '18:00 – 21:30'}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <span className="text-xs text-slate-400 block mb-1">Peak Time Window</span>
          <p className="text-xl font-bold text-slate-100">{peakData?.peak_window || 'N/A'}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Expected Daily Surge</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <span className="text-xs text-slate-400 block mb-1">Peak Hour Load</span>
          <p className="text-xl font-bold text-amber-400">
            {peakData?.peak_hour_predicted_kwh || 0} <span className="text-xs text-slate-400 font-normal">kWh</span>
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">At {peakData?.expected_peak_hour || '19:00'}</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <span className="text-xs text-slate-400 block mb-1">Peak Load Ratio</span>
          <p className="text-xl font-bold text-cyan-400">
            {peakData?.peak_ratio_pct || 0}%
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Of Total 24h Projected Energy</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <span className="text-xs text-slate-400 block mb-1">Total 24h Demand</span>
          <p className="text-xl font-bold text-emerald-400">
            {peakData?.total_24h_predicted_kwh || 0} <span className="text-xs text-slate-400 font-normal">kWh</span>
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Next 24-Hour Horizon</span>
        </div>
      </div>

      {/* Chart: Hourly Demand Breakdown */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-100">Forecasted Hourly Load Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Hourly predicted kWh. Red/Orange bars indicate critical peak surge hours subject to peak tariffs.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-500"></span> Normal Load
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Peak Tariff Slot
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={peakData?.hourly_points || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                labelStyle={{ color: '#cbd5e1', fontWeight: 'bold' }}
                formatter={(val, name, item) => [
                  `${val} kWh (${item.payload.is_peak ? 'Peak Slot' : 'Standard Slot'})`,
                  'Projected Load'
                ]}
              />
              <Bar dataKey="predicted_kwh" radius={[4, 4, 0, 0]}>
                {(peakData?.hourly_points || []).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.is_peak ? '#f59e0b' : '#06b6d4'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Section: Configurable Thresholds & Load Shifting Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Load Shifting Advisories */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="h-5 w-5 text-cyan-400" />
            <h3 className="font-semibold text-slate-100">Load Shifting Action Plan</h3>
          </div>
          <p className="text-xs text-slate-400">
            Shift flexible appliances from peak hours to off-peak periods to avoid high-tier tariffs.
          </p>

          <div className="space-y-3">
            {(peakData?.load_shifting_advisories || []).map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-800/40 p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-200">{item.appliance}</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    High Savings
                  </span>
                </div>
                <p className="text-xs text-slate-300">{item.action}</p>
                <p className="text-[11px] text-cyan-400/90 pt-0.5">Benefit: {item.potential_saving}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Threshold Configuration Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold text-slate-100">Configure Personal Demand Thresholds</h3>
          </div>
          <p className="text-xs text-slate-400">
            Customize monthly kWh consumption bands to match your utility contract or household target.
          </p>

          {thresholdMsg && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-400">
              {thresholdMsg}
            </div>
          )}

          <form onSubmit={handleUpdateThresholds} className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                LOW Demand Upper Limit (kWh/month)
              </label>
              <input
                type="number"
                value={thresholds.low}
                onChange={(e) => setThresholds({ ...thresholds, low: Number(e.target.value) })}
                className="w-full text-sm rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-500">Usage below this is categorized as LOW demand.</span>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                MEDIUM Demand Upper Limit (kWh/month)
              </label>
              <input
                type="number"
                value={thresholds.medium}
                onChange={(e) => setThresholds({ ...thresholds, medium: Number(e.target.value) })}
                className="w-full text-sm rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-500">Usage between Low and Medium is classified as MEDIUM.</span>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                HIGH Demand Threshold (kWh/month)
              </label>
              <input
                type="number"
                value={thresholds.high}
                onChange={(e) => setThresholds({ ...thresholds, high: Number(e.target.value) })}
                className="w-full text-sm rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-500">Usage above this triggers CRITICAL surge warnings.</span>
            </div>

            <button
              type="submit"
              disabled={savingThresholds}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50"
            >
              {savingThresholds ? 'Saving Thresholds...' : 'Save Configured Thresholds'}
            </button>
          </form>
        </div>
      </div>

      {/* Disclaimers & Nature of Measurement */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex gap-3 text-xs text-slate-400">
        <Info className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300 block mb-0.5">
            Measurement vs Forecast Distinction Notice:
          </span>
          Values presented in this module are algorithmic forward predictions based on trained chronological patterns
          and diurnal load models. They represent projected peak risks for proactive planning and are distinctly
          separated from actual historical meter readings.
        </div>
      </div>
    </div>
  );
};

export default PeakDemandPage;

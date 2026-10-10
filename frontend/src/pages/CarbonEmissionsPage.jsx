import React, { useState, useEffect } from 'react';
import {
  Leaf,
  TreeDeciduous,
  Car,
  Fuel,
  Sliders,
  CheckCircle2,
  Info,
  TrendingDown,
  Globe,
  ArrowDownRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { energyApi } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

const CarbonEmissionsPage = () => {
  const [loading, setLoading] = useState(true);
  const [carbonData, setCarbonData] = useState(null);
  const [factorInput, setFactorInput] = useState(0.82);
  const [savingFactor, setSavingFactor] = useState(false);
  const [factorMsg, setFactorMsg] = useState('');

  useEffect(() => {
    fetchCarbonData();
  }, []);

  const fetchCarbonData = async () => {
    try {
      setLoading(true);
      const res = await energyApi.getCarbonSummary();
      setCarbonData(res.data);
      if (res.data?.grid_emission_factor) {
        setFactorInput(res.data.grid_emission_factor);
      }
    } catch (err) {
      console.error('Failed to load carbon summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFactor = async (e) => {
    e.preventDefault();
    try {
      setSavingFactor(true);
      await energyApi.updateEmissionFactor({ grid_emission_factor: Number(factorInput) });
      setFactorMsg('Grid emission factor updated successfully!');
      setTimeout(() => setFactorMsg(''), 4000);
      fetchCarbonData();
    } catch (err) {
      setFactorMsg(err.response?.data?.detail || 'Failed to update factor.');
    } finally {
      setSavingFactor(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner text="Calculating environmental carbon metrics..." />
      </div>
    );
  }

  const act = carbonData?.actual || {};
  const pred = carbonData?.predicted || {};
  const sim = carbonData?.simulated || {};
  const eq = act.equivalencies || {};

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-semibold text-teal-400 border border-teal-500/20">
            <Leaf className="h-3 w-3" />
            Environmental Sustainability
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100 mt-1">
            Carbon Emission Estimation & Grid Factors
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Measure your greenhouse gas footprint (CO2e), compare baseline vs simulated scenarios, and track green offsets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            Factor: {carbonData?.grid_emission_factor} kg CO2e/kWh
          </span>
        </div>
      </div>

      {/* 4 Carbon Impact Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Total Footprint */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Cycle Carbon Footprint</span>
            <Globe className="h-4 w-4 text-teal-400" />
          </div>
          <p className="text-3xl font-bold text-teal-400">
            {act.emissions_kg ?? 0} <span className="text-xs font-normal text-slate-400">kg CO2e</span>
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {act.emissions_metric_tons ?? 0} Metric Tons CO2e
          </span>
        </div>

        {/* Metric 2: Tree Equivalency */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Tree Absorption Needed</span>
            <TreeDeciduous className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-emerald-400">
            {eq.trees_monthly_absorption ?? 0}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Adult trees required for 1 month offset
          </span>
        </div>

        {/* Metric 3: Car km Equivalent */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Gasoline Car Travel</span>
            <Car className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-bold text-cyan-400">
            {eq.gasoline_car_km?.toLocaleString() ?? 0} <span className="text-xs font-normal text-slate-400">km</span>
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Equivalent driving emissions
          </span>
        </div>

        {/* Metric 4: Reduction Potential */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Simulated Avoidance</span>
            <TrendingDown className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-bold text-indigo-400">
            {sim.emissions_saved_kg ?? 0} <span className="text-xs font-normal text-slate-400">kg</span>
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Through peak shaving optimization
          </span>
        </div>
      </div>

      {/* Scenario Comparisons: Baseline vs Predicted vs Simulated */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Historical Baseline</span>
            <span>{act.consumption_kwh} kWh</span>
          </div>
          <p className="text-2xl font-bold text-slate-200">{act.emissions_kg} kg CO2e</p>
          <p className="text-xs text-slate-500">
            Actual emissions based on the latest recorded billing cycle.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold">
            <span>AI Forecasted Horizon</span>
            <span>{pred.consumption_kwh || 'N/A'} kWh</span>
          </div>
          <p className="text-2xl font-bold text-indigo-400">{pred.emissions_kg || 'N/A'} kg CO2e</p>
          <p className="text-xs text-slate-500">
            Projected emissions if unmanaged seasonal demand growth continues.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span>Optimized Simulation</span>
            <span>{sim.consumption_kwh || 'N/A'} kWh</span>
          </div>
          <p className="text-2xl font-bold text-emerald-300">{sim.emissions_kg || 'N/A'} kg CO2e</p>
          <p className="text-xs text-emerald-400/90 flex items-center gap-1 font-medium">
            <ArrowDownRight className="h-4 w-4" />
            Avoids {sim.emissions_saved_kg || 0} kg CO2e (~{sim.trees_offset_equivalent || 0} trees)
          </p>
        </div>
      </div>

      {/* Timeline Chart if available */}
      {(carbonData?.timeline || []).length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
          <h3 className="font-semibold text-slate-100 mb-1">Historical Carbon Emission Timeline</h3>
          <p className="text-xs text-slate-400 mb-4">
            Cycle-by-cycle greenhouse gas emission progression over recorded timeline.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={carbonData.timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="carbonGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                  labelStyle={{ color: '#cbd5e1', fontWeight: 'bold' }}
                  formatter={(val) => [`${val} kg CO2e`, 'Emissions']}
                />
                <Area
                  type="monotone"
                  dataKey="emissions_kg"
                  stroke="#14b8a6"
                  strokeWidth={2.5}
                  fill="url(#carbonGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Grid Factor Settings & Documentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Factor Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="h-5 w-5 text-teal-400" />
            <h3 className="font-semibold text-slate-100">Configure Grid Emission Factor</h3>
          </div>
          <p className="text-xs text-slate-400">
            Adjust the regional electricity grid carbon intensity factor based on your regional energy generation mix.
          </p>

          {factorMsg && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-400">
              {factorMsg}
            </div>
          )}

          <form onSubmit={handleUpdateFactor} className="space-y-3">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Grid Emission Factor (kg CO2e / kWh)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.05"
                max="2.0"
                value={factorInput}
                onChange={(e) => setFactorInput(e.target.value)}
                className="w-full text-sm rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Default: 0.82 kg CO2e/kWh (Central Electricity Authority CEA Indian national grid average)
              </span>
            </div>

            <button
              type="submit"
              disabled={savingFactor}
              className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 py-2.5 text-xs font-semibold text-slate-950 shadow-md shadow-teal-500/20 hover:from-teal-400 hover:to-emerald-400 transition-all disabled:opacity-50"
            >
              {savingFactor ? 'Updating...' : 'Update Emission Factor'}
            </button>
          </form>
        </div>

        {/* Reference Benchmarks */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-3">
          <h3 className="font-semibold text-slate-100">Standard Grid Benchmarks (IEA / CEA)</h3>
          <p className="text-xs text-slate-400">
            Recognized international greenhouse gas carbon emission factor references:
          </p>

          <div className="space-y-2 text-xs">
            <div className="rounded-lg bg-slate-800/40 border border-slate-800 p-2.5 flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-200 block">India National Grid (CEA)</span>
                <span className="text-[10px] text-slate-500">Weighted average including thermal & renewable mix</span>
              </div>
              <span className="font-bold text-amber-400">0.82 kg/kWh</span>
            </div>

            <div className="rounded-lg bg-slate-800/40 border border-slate-800 p-2.5 flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-200 block">Global Average (IEA)</span>
                <span className="text-[10px] text-slate-500">World energy generation average</span>
              </div>
              <span className="font-bold text-cyan-400">0.47 kg/kWh</span>
            </div>

            <div className="rounded-lg bg-slate-800/40 border border-slate-800 p-2.5 flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-200 block">US National Grid (EPA eGRID)</span>
                <span className="text-[10px] text-slate-500">National average grid factor</span>
              </div>
              <span className="font-bold text-emerald-400">0.38 kg/kWh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarbonEmissionsPage;

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Zap,
  TrendingDown,
  DollarSign,
  Leaf,
  Save,
  Trash2,
  Sparkles,
  Info,
  CheckCircle2,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { energyApi } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

const WhatIfSimulatorPage = () => {
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Controls state
  const [peakReductionPct, setPeakReductionPct] = useState(15);
  const [peakShiftPct, setPeakShiftPct] = useState(20);
  const [customBaselineKwh, setCustomBaselineKwh] = useState(450);
  const [baseTariff, setBaseTariff] = useState(7.50);
  const [peakMultiplier, setPeakMultiplier] = useState(1.40);
  const [scenarioName, setScenarioName] = useState('My Custom Optimizer');

  // Simulation output
  const [simData, setSimData] = useState(null);
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Initial load
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch user profile for default tariffs
      const profRes = await energyApi.getUserProfile().catch(() => null);
      if (profRes && profRes.data) {
        if (profRes.data.base_tariff_rate) setBaseTariff(profRes.data.base_tariff_rate);
        if (profRes.data.peak_tariff_multiplier) setPeakMultiplier(profRes.data.peak_tariff_multiplier);
        if (profRes.data.avg_monthly_consumption) setCustomBaselineKwh(profRes.data.avg_monthly_consumption || 450);
      }

      // Initial simulation call
      const simRes = await energyApi.runSimulation({
        peak_reduction_pct: 15,
        peak_shift_pct: 20,
        custom_base_tariff: profRes?.data?.base_tariff_rate || 7.50,
        custom_peak_multiplier: profRes?.data?.peak_tariff_multiplier || 1.40,
        custom_baseline_kwh: profRes?.data?.avg_monthly_consumption || 450
      });
      setSimData(simRes.data);

      // Load saved history
      const histRes = await energyApi.getSavedScenarios().catch(() => ({ data: [] }));
      setSavedScenarios(histRes.data || []);
    } catch (err) {
      console.error('Simulator load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const runDynamicSimulation = async (red = peakReductionPct, shift = peakShiftPct, kwh = customBaselineKwh) => {
    try {
      setSimulating(true);
      const res = await energyApi.runSimulation({
        peak_reduction_pct: Number(red),
        peak_shift_pct: Number(shift),
        custom_baseline_kwh: Number(kwh),
        custom_base_tariff: Number(baseTariff),
        custom_peak_multiplier: Number(peakMultiplier)
      });
      setSimData(res.data);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handlePresetSelect = (red, shift, name) => {
    setPeakReductionPct(red);
    setPeakShiftPct(shift);
    setScenarioName(name);
    runDynamicSimulation(red, shift);
  };

  const handleSaveScenario = async () => {
    if (!simData || !simData.summary) return;
    try {
      setSaving(true);
      const payload = {
        scenario_name: scenarioName || 'Optimized Strategy',
        peak_reduction_pct: peakReductionPct,
        peak_shift_pct: peakShiftPct,
        baseline_kwh: simData.summary.original_consumption_kwh,
        simulated_kwh: simData.summary.simulated_consumption_kwh,
        kwh_saved: simData.summary.energy_saved_kwh,
        baseline_cost: simData.summary.original_bill_inr,
        simulated_cost: simData.summary.simulated_bill_inr,
        cost_saved: simData.summary.bill_saved_inr,
        emissions_saved_kg: simData.summary.carbon_saved_kg,
        notes: `Simulated with ${peakReductionPct}% peak reduction & ${peakShiftPct}% load shift.`
      };
      await energyApi.saveScenario(payload);
      setSaveSuccessMsg('Scenario saved successfully to history!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
      const hist = await energyApi.getSavedScenarios();
      setSavedScenarios(hist.data || []);
    } catch (err) {
      console.error('Save scenario error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScenario = async (id) => {
    try {
      await energyApi.deleteScenario(id);
      setSavedScenarios(savedScenarios.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner text="Initializing What-If Simulation Engine..." />
      </div>
    );
  }

  const s = simData?.summary || {};

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              <Sparkles className="h-3 w-3" />
              Signature Innovation
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100 mt-1">
            What-If Energy Simulator
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Experiment with peak load shaving, flexible demand shifting, and tariff arbitrage in real time.
          </p>
        </div>

        <button
          onClick={() => runDynamicSimulation()}
          disabled={simulating}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${simulating ? 'animate-spin' : ''}`} />
          <span>{simulating ? 'Recalculating...' : 'Re-Run Simulation'}</span>
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm font-medium text-emerald-400">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Preset Strategy Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Conservative Shift', red: 0, shift: 10, icon: '🛡️', desc: '0% cut • 10% shift' },
          { label: 'Moderate Balance', red: 10, shift: 15, icon: '⚖️', desc: '10% cut • 15% shift' },
          { label: 'Recommended', red: 15, shift: 20, icon: '⭐', desc: '15% cut • 20% shift' },
          { label: 'Aggressive Shave', red: 25, shift: 25, icon: '⚡', desc: '25% cut • 25% shift' },
        ].map((p, idx) => (
          <button
            key={idx}
            onClick={() => handlePresetSelect(p.red, p.shift, p.label)}
            className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
              peakReductionPct === p.red && peakShiftPct === p.shift
                ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-base">{p.icon}</span>
              {p.label === 'Recommended' && (
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  AI Pick
                </span>
              )}
            </div>
            <span className="font-semibold text-sm mt-1">{p.label}</span>
            <span className="text-[11px] text-slate-400 mt-0.5">{p.desc}</span>
          </button>
        ))}
      </div>

      {/* Two Column Layout: Controls & Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Controls Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-6 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="h-5 w-5 text-emerald-400" />
            <h2 className="font-semibold text-slate-200">Simulation Controls</h2>
          </div>

          {/* Slider 1: Peak Reduction */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="text-slate-300 font-medium">Peak Hour Curtailment</label>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-xs border border-emerald-500/20">
                {peakReductionPct}% Reduction
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={peakReductionPct}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPeakReductionPct(val);
                runDynamicSimulation(val, peakShiftPct);
              }}
              className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>0% (None)</span>
              <span>10%</span>
              <span>20%</span>
              <span>40% (Aggressive)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Directly curtails wasteful peak usage (AC setpoint +1.5°C, standby power isolation).
            </p>
          </div>

          {/* Slider 2: Peak Shifting */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="text-slate-300 font-medium">Off-Peak Load Shifting</label>
              <span className="font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded text-xs border border-cyan-500/20">
                {peakShiftPct}% Shifted
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={peakShiftPct}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPeakShiftPct(val);
                runDynamicSimulation(peakReductionPct, val);
              }}
              className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>0% (No Shift)</span>
              <span>15%</span>
              <span>30%</span>
              <span>40% (Max Shift)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Transfers flexible load (laundry, EV charging, dishwashing) from 18:00–22:00 to solar/night off-peak hours.
            </p>
          </div>

          {/* Baseline & Tariffs Parameters */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tariff & Base Parameters
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Baseline Monthly kWh</label>
                <input
                  type="number"
                  value={customBaselineKwh}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCustomBaselineKwh(val);
                    runDynamicSimulation(peakReductionPct, peakShiftPct, val);
                  }}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Base Tariff (₹/kWh)</label>
                <input
                  type="number"
                  step="0.5"
                  value={baseTariff}
                  onChange={(e) => {
                    setBaseTariff(Number(e.target.value));
                    runDynamicSimulation();
                  }}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="text-slate-400 block mb-1">Peak Surcharge Multiplier</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="2.5"
                  value={peakMultiplier}
                  onChange={(e) => {
                    setPeakMultiplier(Number(e.target.value));
                    runDynamicSimulation();
                  }}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-slate-400 text-xs">x regular</span>
              </div>
            </div>
          </div>

          {/* Save Scenario Form */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <label className="text-xs text-slate-300 font-medium block">Save Current Scenario</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="Scenario name..."
                className="w-full text-xs rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleSaveScenario}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 px-3 py-2 text-xs font-semibold text-slate-100 transition-colors border border-slate-700"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? '...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Impact Display Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Metric 1: Energy Saved */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Energy Saved</span>
                <Zap className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">
                {s.energy_saved_kwh ?? 0} <span className="text-xs font-normal text-slate-400">kWh</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                <span className="text-emerald-400 font-semibold">-{s.energy_reduction_pct ?? 0}%</span> total load
              </p>
            </div>

            {/* Metric 2: Financial Savings */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Monthly Bill Impact</span>
                <DollarSign className="h-4 w-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-cyan-400">
                ₹{s.bill_saved_inr ?? 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                <span className="text-cyan-400 font-semibold">-{s.bill_reduction_pct ?? 0}%</span> monthly bill
              </p>
            </div>

            {/* Metric 3: Carbon Avoided */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">CO2e Avoided</span>
                <Leaf className="h-4 w-4 text-teal-400" />
              </div>
              <p className="text-2xl font-bold text-teal-400">
                {s.carbon_saved_kg ?? 0} <span className="text-xs font-normal text-slate-400">kg</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                ~{((s.carbon_saved_kg || 0) / 1.83).toFixed(1)} tree-months
              </p>
            </div>

            {/* Metric 4: New Bill Total */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Simulated Bill</span>
                <TrendingDown className="h-4 w-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-bold text-slate-100">
                ₹{s.simulated_bill_inr ?? 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 line-through">
                Was ₹{s.original_bill_inr ?? 0}
              </p>
            </div>
          </div>

          {/* 24-Hour Load Profile Chart: Baseline vs Simulated */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-100">24-Hour Diurnal Demand Curve</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comparison between baseline consumption and simulated curve with peak shaving (18:00–22:00)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-500"></span> Baseline
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span> Simulated
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={simData?.hourly_profile_comparison || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#64748b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="simulatedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                    labelStyle={{ color: '#cbd5e1', fontWeight: 'bold' }}
                    formatter={(val, name) => [`${val} kWh`, name === 'baseline_kwh' ? 'Baseline' : 'Simulated']}
                  />
                  <Area
                    type="monotone"
                    dataKey="baseline_kwh"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#baselineGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="simulated_kwh"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#simulatedGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Comparison Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <h3 className="font-semibold text-slate-100 mb-1">Pre-Evaluated Strategy Benchmarks</h3>
        <p className="text-xs text-slate-400 mb-4">
          Comparative matrix evaluating financial savings, energy reduction, and emissions mitigation across candidate scenarios.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 rounded-l-lg">Strategy Name</th>
                <th className="py-3 px-4">Peak Shave</th>
                <th className="py-3 px-4">Load Shift</th>
                <th className="py-3 px-4">Simulated kWh</th>
                <th className="py-3 px-4">kWh Saved</th>
                <th className="py-3 px-4">Monthly Bill Saved</th>
                <th className="py-3 px-4 rounded-r-lg">CO2 Avoided</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {(simData?.strategy_benchmarks || []).map((bench, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    bench.is_recommended ? 'bg-emerald-500/10 font-semibold text-emerald-300' : ''
                  }`}
                >
                  <td className="py-3 px-4 flex items-center gap-2">
                    {bench.strategy_name}
                    {bench.is_recommended && (
                      <span className="rounded bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5">
                        Optimal
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">{bench.peak_reduction_pct}%</td>
                  <td className="py-3 px-4">{bench.peak_shift_pct}%</td>
                  <td className="py-3 px-4">{bench.simulated_kwh} kWh</td>
                  <td className="py-3 px-4 text-emerald-400">-{bench.kwh_saved} kWh</td>
                  <td className="py-3 px-4 text-cyan-400">₹{bench.bill_saved_inr}</td>
                  <td className="py-3 px-4 text-teal-400">{bench.emissions_saved_kg} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Saved Scenarios History */}
      {savedScenarios.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
          <h3 className="font-semibold text-slate-100 mb-1">Your Saved What-If Scenarios</h3>
          <p className="text-xs text-slate-400 mb-4">
            Previously simulated scenarios saved for executive decision making and load scheduling.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedScenarios.map((sc) => (
              <div key={sc.id} className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-2 relative">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-sm text-slate-200">{sc.scenario_name}</h4>
                  <button
                    onClick={() => handleDeleteScenario(sc.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                    title="Delete scenario"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-700/50">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Saved Energy:</span>
                    <span className="font-semibold text-emerald-400">{sc.kwh_saved} kWh</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Monthly Bill Saving:</span>
                    <span className="font-semibold text-cyan-400">₹{sc.cost_saved}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Curtailment:</span>
                    <span className="text-slate-300">{sc.peak_reduction_pct}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Load Shift:</span>
                    <span className="text-slate-300">{sc.peak_shift_pct}%</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 italic pt-1">{sc.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assumptions & Methodology Notice */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 flex gap-3 text-xs text-slate-400">
        <Info className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300 block mb-0.5">
            Simulation Methodology & Technical Assumptions:
          </span>
          {simData?.disclaimer || (
            <span>
              Simulated savings are mathematical projections based on your entered parameters and tariff schedule.
              Peak hour shifting transfers kWh demand from 18:00–22:00 to low-tariff solar/night hours, eliminating peak
              surcharges without diminishing total energy delivered to end-use appliances. Peak curtailment directly reduces
              unnecessary cooling and standby electricity.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatIfSimulatorPage;

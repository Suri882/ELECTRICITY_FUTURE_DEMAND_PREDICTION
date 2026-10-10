import React, { useState, useEffect } from 'react';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Sliders,
  Receipt,
  Info,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle
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

const BillEstimatorPage = () => {
  const [loading, setLoading] = useState(true);
  const [billData, setBillData] = useState(null);

  // Custom calculator state
  const [calcKwh, setCalcKwh] = useState(480);
  const [calcPeakKwh, setCalcPeakKwh] = useState(130);
  const [calcBaseRate, setCalcBaseRate] = useState(7.50);
  const [calcPeakMult, setCalcPeakMult] = useState(1.40);
  const [calcFixed, setCalcFixed] = useState(120);
  const [calcTax, setCalcTax] = useState(5.0);
  const [customResult, setCustomResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // Tariff settings modal / form
  const [tariffs, setTariffs] = useState({
    base_tariff_rate: 7.50,
    peak_tariff_multiplier: 1.40,
    fixed_charges: 120.0,
    tax_percentage: 5.0,
  });
  const [savingTariffs, setSavingTariffs] = useState(false);
  const [tariffMsg, setTariffMsg] = useState('');

  useEffect(() => {
    fetchEstimates();
  }, []);

  const fetchEstimates = async () => {
    try {
      setLoading(true);
      const res = await energyApi.getBillingEstimates();
      setBillData(res.data);
      if (res.data?.user_tariffs) {
        setTariffs(res.data.user_tariffs);
        setCalcBaseRate(res.data.user_tariffs.base_tariff_rate || 7.50);
        setCalcPeakMult(res.data.user_tariffs.peak_tariff_multiplier || 1.40);
        setCalcFixed(res.data.user_tariffs.fixed_charges || 120.0);
        setCalcTax(res.data.user_tariffs.tax_percentage || 5.0);
      }
    } catch (err) {
      console.error('Failed to load bill estimates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCustomCalculation = async (e) => {
    e?.preventDefault();
    try {
      setCalculating(true);
      const res = await energyApi.calculateCustomBill({
        consumption_kwh: Number(calcKwh),
        peak_kwh: Number(calcPeakKwh),
        base_tariff: Number(calcBaseRate),
        peak_multiplier: Number(calcPeakMult),
        fixed_charges: Number(calcFixed),
        tax_percentage: Number(calcTax),
        period_label: 'Interactive Custom Calculation'
      });
      setCustomResult(res.data);
    } catch (err) {
      console.error('Custom calculation error:', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleUpdateTariffs = async (e) => {
    e.preventDefault();
    try {
      setSavingTariffs(true);
      await energyApi.updateTariffs(tariffs);
      setTariffMsg('Tariff structure saved successfully!');
      setTimeout(() => setTariffMsg(''), 4000);
      fetchEstimates();
    } catch (err) {
      setTariffMsg(err.response?.data?.detail || 'Failed to update tariffs.');
    } finally {
      setSavingTariffs(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner text="Computing utility tariff models..." />
      </div>
    );
  }

  const curEst = billData?.current_cycle_estimate || {};
  const predEst = billData?.predicted_cycle_estimate || {};
  const activeCalc = customResult || curEst;

  const comparisonChartData = [
    { name: 'Last Recorded', amount: curEst.total_estimated_bill || 0, fill: '#06b6d4' },
    { name: 'ML Predicted', amount: predEst.total_estimated_bill || 0, fill: '#8b5cf6' },
    { name: 'Custom Simulation', amount: customResult?.total_estimated_bill || curEst.total_estimated_bill || 0, fill: '#10b981' }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-400 border border-cyan-500/20">
            <DollarSign className="h-3 w-3" />
            Financial Intelligence
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100 mt-1">
            Electricity Bill Estimation & Tariff Analysis
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Transparent deterministic estimates, time-of-day surcharge breakdowns, and comparative cycle projections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            Base: ₹{tariffs.base_tariff_rate}/kWh • Peak: {tariffs.peak_tariff_multiplier}x
          </span>
        </div>
      </div>

      {/* Official Disclaimer Alert */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-slate-900 to-slate-900 p-4 shadow-xl flex gap-3 text-xs text-slate-300">
        <Info className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-cyan-300 block mb-0.5">
            Official Utility Estimate Notice:
          </span>
          {curEst.disclaimer || (
            <span>
              All computations are deterministic projections calculated from configured energy tariffs and unit consumption.
              Official monthly invoices issued by utility electricity boards may vary due to fuel adjustment charges (FAC),
              meter rentals, or slab tier cross-subsidies.
            </span>
          )}
        </div>
      </div>

      {/* Two Comparison Cards: Current vs Predicted */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Current Recorded Cycle */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-cyan-400" />
              <h2 className="font-semibold text-slate-200">Current Recorded Cycle</h2>
            </div>
            <span className="text-xs text-slate-400">{curEst.consumption_kwh} kWh</span>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <span className="text-xs text-slate-400">Total Estimated Bill</span>
            <p className="text-3xl font-bold text-slate-100">
              ₹{curEst.total_estimated_bill?.toLocaleString('en-IN') || 0}
            </p>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Effective rate: ₹{curEst.effective_rate_per_kwh}/kWh (inclusive of fixed & taxes)
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/60">
            <div className="flex justify-between">
              <span className="text-slate-400">Base Energy Charges:</span>
              <span>₹{curEst.itemized_breakdown?.base_energy_charges}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Peak Surcharge ({curEst.peak_kwh} kWh):</span>
              <span className="text-amber-400 font-medium">₹{curEst.itemized_breakdown?.peak_surcharge_charges}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fixed Grid Connection Charges:</span>
              <span>₹{curEst.itemized_breakdown?.fixed_service_charges}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Electricity Duty / Tax ({curEst.assumptions_applied?.tax_percentage}%):</span>
              <span>₹{curEst.itemized_breakdown?.electricity_tax_duty}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Predicted Future Cycle */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-400" />
              <h2 className="font-semibold text-slate-200">Predicted Upcoming Horizon</h2>
            </div>
            <span className="text-xs text-indigo-400 font-semibold">{predEst.consumption_kwh} kWh Projected</span>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <span className="text-xs text-slate-400">Projected Future Bill</span>
            <p className="text-3xl font-bold text-indigo-400">
              ₹{predEst.total_estimated_bill?.toLocaleString('en-IN') || 0}
            </p>
            {predEst.period_comparison && (
              <span
                className={`text-[11px] block mt-0.5 font-medium ${
                  predEst.period_comparison.difference_amount > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {predEst.period_comparison.difference_amount > 0 ? '+' : ''}
                ₹{predEst.period_comparison.difference_amount} ({predEst.period_comparison.percentage_change}%) vs current cycle
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/60">
            <div className="flex justify-between">
              <span className="text-slate-400">Base Energy Charges:</span>
              <span>₹{predEst.itemized_breakdown?.base_energy_charges}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Peak Surcharge ({predEst.peak_kwh} kWh):</span>
              <span className="text-amber-400 font-medium">₹{predEst.itemized_breakdown?.peak_surcharge_charges}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fixed Grid Charges:</span>
              <span>₹{predEst.itemized_breakdown?.fixed_service_charges}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Electricity Tax / Duty:</span>
              <span>₹{predEst.itemized_breakdown?.electricity_tax_duty}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <h3 className="font-semibold text-slate-100 mb-1">Comparative Bill Projections</h3>
        <p className="text-xs text-slate-400 mb-4">
          Visual comparison across historical baseline, AI machine learning forecast, and custom simulation.
        </p>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                labelStyle={{ color: '#cbd5e1', fontWeight: 'bold' }}
                formatter={(val) => [`₹${val}`, 'Estimated Bill']}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {comparisonChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Custom Bill Calculator & Tariff Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Calculator */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Calculator className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold text-slate-100">Interactive Custom Estimator</h3>
          </div>
          <p className="text-xs text-slate-400">
            Estimate bills for any custom consumption level, appliance addition, or seasonal change.
          </p>

          <form onSubmit={handleRunCustomCalculation} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Total Consumption (kWh)</label>
                <input
                  type="number"
                  value={calcKwh}
                  onChange={(e) => setCalcKwh(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Peak Slot kWh</label>
                <input
                  type="number"
                  value={calcPeakKwh}
                  onChange={(e) => setCalcPeakKwh(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Base Rate (₹)</label>
                <input
                  type="number"
                  step="0.5"
                  value={calcBaseRate}
                  onChange={(e) => setCalcBaseRate(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Peak Mult.</label>
                <input
                  type="number"
                  step="0.1"
                  value={calcPeakMult}
                  onChange={(e) => setCalcPeakMult(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Fixed Fee (₹)</label>
                <input
                  type="number"
                  value={calcFixed}
                  onChange={(e) => setCalcFixed(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={calculating}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all"
            >
              {calculating ? 'Calculating...' : 'Calculate Custom Estimate'}
            </button>
          </form>

          {customResult && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1 mt-3">
              <span className="text-[11px] text-emerald-400 block font-medium">Estimated Custom Total:</span>
              <p className="text-2xl font-bold text-emerald-300">
                ₹{customResult.total_estimated_bill}
              </p>
              <p className="text-[11px] text-slate-300">
                Energy: ₹{customResult.itemized_breakdown?.subtotal} • Tax: ₹{customResult.itemized_breakdown?.electricity_tax_duty}
              </p>
            </div>
          )}
        </div>

        {/* Global Tariff Settings Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100">Update Profile Tariff Settings</h3>
          </div>
          <p className="text-xs text-slate-400">
            Set your local state utility tariff schedule (e.g., BESCOM, TANGEDCO, MSEDCL) used across all reports.
          </p>

          {tariffMsg && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-400">
              {tariffMsg}
            </div>
          )}

          <form onSubmit={handleUpdateTariffs} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Base Energy Rate (₹/kWh)</label>
                <input
                  type="number"
                  step="0.25"
                  value={tariffs.base_tariff_rate}
                  onChange={(e) => setTariffs({ ...tariffs, base_tariff_rate: Number(e.target.value) })}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Peak Surcharge Multiplier</label>
                <input
                  type="number"
                  step="0.05"
                  value={tariffs.peak_tariff_multiplier}
                  onChange={(e) => setTariffs({ ...tariffs, peak_tariff_multiplier: Number(e.target.value) })}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Fixed Monthly Charges (₹)</label>
                <input
                  type="number"
                  value={tariffs.fixed_charges}
                  onChange={(e) => setTariffs({ ...tariffs, fixed_charges: Number(e.target.value) })}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Tax / Duty Percentage (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={tariffs.tax_percentage}
                  onChange={(e) => setTariffs({ ...tariffs, tax_percentage: Number(e.target.value) })}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingTariffs}
              className="w-full rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 py-2.5 text-xs font-semibold text-slate-200 transition-colors"
            >
              {savingTariffs ? 'Saving Tariffs...' : 'Save Tariff Parameters'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BillEstimatorPage;

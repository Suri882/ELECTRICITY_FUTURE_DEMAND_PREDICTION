import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { energyApi } from '../services/api';
import EmptyState from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  TrendingUp,
  Zap,
  Gauge,
  Activity,
  Award,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Cpu,
  BarChart2,
  RefreshCw,
  PlusCircle,
  Clock,
  CloudSun,
  ShieldAlert,
  Info,
  Database
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
  Cell
} from 'recharts';

const PredictionsPage = () => {
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [recordsCount, setRecordsCount] = useState(0);
  const [selectedHorizon, setSelectedHorizon] = useState('30d');
  const [weatherContext, setWeatherContext] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPredictionData = async () => {
    try {
      setLoading(true);
      const [predsRes, recsRes, wRes] = await Promise.all([
        api.get('/predictions'),
        api.get('/consumption'),
        energyApi.getWeather().catch(() => ({ data: null }))
      ]);
      setPredictions(predsRes.data);
      setRecordsCount(recsRes.data.length);
      setWeatherContext(wRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictionData();
  }, []);

  const handleRunPrediction = async (horizon = selectedHorizon) => {
    setError('');
    setSuccess('');
    setPredicting(true);

    try {
      const res = await energyApi.generatePrediction({
        forecast_period: horizon,
      });
      setSuccess(`Generated ${res.data.forecast_period} demand prediction: ${res.data.predicted_demand} kWh (${res.data.demand_level}) using ${res.data.model_name}.`);
      fetchPredictionData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate demand prediction.');
    } finally {
      setPredicting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving predictive models and evaluating feature sets..." />;
  }

  const latest = predictions[0] || null;

  const getDemandBadgeClass = (level) => {
    switch (level) {
      case 'Critical':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'High':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Low':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'Normal':
      default:
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
            <Cpu className="h-3 w-3" />
            Supervised Regression Intelligence
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100 mt-1">
            AI Electricity Demand Forecasting
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Multi-horizon forecasting (24h, 7d, 30d) powered by Random Forest, Ridge, and Polynomial ensembles with zero data leakage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {recordsCount < 3 && (
            <button
              onClick={async () => {
                await energyApi.loadDemoData();
                fetchPredictionData();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2.5 text-xs font-semibold shadow-md transition-all"
            >
              <Database className="h-4 w-4" />
              <span>Load Demo Calibration Data</span>
            </button>
          )}

          <button
            onClick={() => handleRunPrediction(selectedHorizon)}
            disabled={predicting || recordsCount < 3}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${predicting ? 'animate-spin' : ''}`} />
            <span>{predicting ? 'Training & Evaluating...' : `Forecast ${selectedHorizon.toUpperCase()}`}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-sm text-rose-400 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{error}</p>
            {recordsCount < 3 && (
              <p className="text-xs text-rose-300">
                You currently have {recordsCount} record(s). A minimum of 3 historical cycles is mathematically required to train temporal features.
              </p>
            )}
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Horizon Selector Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {[
            { id: '24h', label: 'Next 24 Hours (Hourly)', icon: Clock },
            { id: '7d', label: 'Next 7 Days (Daily)', icon: Calendar },
            { id: '30d', label: 'Next 30 Days (Cycle)', icon: BarChart2 },
          ].map((h) => {
            const Icon = h.icon;
            const active = selectedHorizon === h.id;
            return (
              <button
                key={h.id}
                onClick={() => {
                  setSelectedHorizon(h.id);
                  handleRunPrediction(h.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{h.label}</span>
              </button>
            );
          })}
        </div>

        {weatherContext?.current && (
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <CloudSun className="h-4 w-4 text-amber-400" />
            <span>Weather: {weatherContext.current.temperature}°C ({weatherContext.current.condition})</span>
          </div>
        )}
      </div>

      {recordsCount < 3 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-100">Insufficient Historical Data</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              The AI regression engine requires at least 3 historical records to construct lag vectors, compute rolling averages, and prevent speculative data fabrication.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/consumption/add"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Meter Entry</span>
            </Link>
            <button
              onClick={async () => {
                await energyApi.loadDemoData();
                fetchPredictionData();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all"
            >
              <Database className="h-4 w-4" />
              <span>Load 12-Month Demo Dataset</span>
            </button>
          </div>
        </div>
      ) : latest ? (
        <>
          {/* Main Forecast Metric Card */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getDemandBadgeClass(latest.demand_level)}`}>
                    {latest.demand_level} Demand Level
                  </span>
                  <span className="text-xs text-slate-400">
                    Target: {latest.prediction_date} • Horizon: {latest.forecast_period?.toUpperCase() || '30D'}
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black tracking-tight text-slate-100">
                    {latest.predicted_demand}
                  </span>
                  <span className="text-xl font-medium text-slate-400">kWh</span>
                  <span className={`text-sm font-semibold ${latest.percentage_change >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    ({latest.percentage_change >= 0 ? '+' : ''}{latest.percentage_change}% vs historical baseline)
                  </span>
                </div>

                <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {latest.explanation}
                </p>
              </div>

              {/* Model Badges */}
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-2 shrink-0 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Selected Best Algorithm
                </span>
                <p className="font-bold text-sm text-emerald-400">{latest.model_name}</p>
                <div className="grid grid-cols-3 gap-3 pt-1 border-t border-slate-700/60">
                  <div>
                    <span className="text-[10px] text-slate-400 block">MAE:</span>
                    <span className="font-semibold text-slate-200">{latest.mae ?? '0.00'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">RMSE:</span>
                    <span className="font-semibold text-slate-200">{latest.rmse ?? '0.00'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">R² Score:</span>
                    <span className="font-semibold text-slate-200">{latest.r2_score ?? '0.00'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Forecast Points Chart */}
          {(latest.forecast_points || []).length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-100">
                    {latest.forecast_period === '24h'
                      ? 'Hourly Forecasted Demand Curve (Next 24h)'
                      : latest.forecast_period === '7d'
                      ? 'Daily Forecasted Demand (Next 7 Days)'
                      : '30-Day Projected Demand Progression'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Temporal projection incorporating seasonality, peak hours, and ambient temperature.
                  </p>
                </div>
                <span className="text-xs text-slate-400">Unit: kWh</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={latest.forecast_points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey={latest.forecast_period === '24h' ? 'label' : 'date'} stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                      labelStyle={{ color: '#cbd5e1', fontWeight: 'bold' }}
                      formatter={(val, name, item) => [
                        `${val} kWh ${item.payload.is_peak ? '(Peak)' : ''}`,
                        'Predicted Demand'
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="predicted_kwh"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fill="url(#predGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Model Comparison Benchmark Table */}
          {(latest.model_comparison || []).length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
              <h3 className="font-semibold text-slate-100 mb-1">Candidate Model Evaluation Benchmarks</h3>
              <p className="text-xs text-slate-400 mb-4">
                Chronological train/test split accuracy metrics. The pipeline automatically selects the lowest MAE candidate to prevent overfitting.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 rounded-l-lg">Algorithm</th>
                      <th className="py-2.5 px-4">MAE (kWh)</th>
                      <th className="py-2.5 px-4">RMSE (kWh)</th>
                      <th className="py-2.5 px-4">R² Goodness of Fit</th>
                      <th className="py-2.5 px-4 rounded-r-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {latest.model_comparison.map((m, idx) => (
                      <tr key={idx} className={m.is_best ? 'bg-emerald-500/10 font-semibold text-emerald-300' : ''}>
                        <td className="py-3 px-4 flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-slate-400" />
                          <span>{m.model_name}</span>
                        </td>
                        <td className="py-3 px-4">{m.mae}</td>
                        <td className="py-3 px-4">{m.rmse}</td>
                        <td className="py-3 px-4">{m.r2_score}</td>
                        <td className="py-3 px-4">
                          {m.is_best ? (
                            <span className="rounded bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                              Selected Optimal
                            </span>
                          ) : (
                            <span className="text-slate-500">Evaluated</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Validation Notice & Safeguard */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex gap-3 text-xs text-slate-400">
            <Info className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300 block mb-0.5">Model Validation Disclaimer:</span>
              {latest.validation_notes || (
                <span>
                  Evaluated using chronological train/test split to prevent forward temporal leakage. Predictions reflect
                  statistical regression calibrated on historical records. They represent best-estimate projections and are
                  subject to unexpected weather anomalies or behavioral changes until verified against actual utility meter bills.
                </span>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default PredictionsPage;

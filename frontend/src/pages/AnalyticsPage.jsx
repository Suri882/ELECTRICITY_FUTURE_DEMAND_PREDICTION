import React, { useState, useEffect } from 'react';
import api from '../services/api';
import EmptyState from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Zap,
  Award,
  AlertCircle,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/dashboard-full');
        setData(res.data);
      } catch (err) {
        //
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Computing energy analytics and multi-tier charts..." />;
  }

  if (!data || !data.summary || !data.summary.has_data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Energy Intelligence Analytics
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Interactive multi-dimensional visualizations and regression diagnostics
          </p>
        </div>

        <EmptyState
          icon={BarChart3}
          title="No analytics telemetry available"
          description="Log electricity consumption records to unlock historical time-series, predicted vs actual comparisons, and peak hours distribution."
          actionLabel="Log Electricity Data"
          actionTo="/consumption/add"
        />
      </div>
    );
  }

  const {
    historical_consumption,
    predicted_vs_actual,
    monthly_bill,
    peak_analysis,
    efficiency_breakdown,
    cost_analysis,
  } = data;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Energy Intelligence & Telemetry Analytics
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Evaluated from verified historical consumption cycles using dynamic chart projections
        </p>
      </div>

      {/* Cost Intelligence Banner (Section 19) */}
      {cost_analysis && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-sm shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Cost Intelligence & Tariff Assessment
              </div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="text-2xl font-bold text-white">
                  ₹{cost_analysis.current_bill.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400">
                  (Prior Cycle: ₹{cost_analysis.previous_bill.toLocaleString()})
                </span>
                <span
                  className={`text-xs font-bold ${
                    cost_analysis.cost_difference > 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {cost_analysis.cost_difference > 0 ? '+₹' : '-₹'}
                  {Math.abs(cost_analysis.cost_difference).toLocaleString()} Variance
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{cost_analysis.message}</p>
            </div>

            {cost_analysis.monthly_budget > 0 && (
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 md:min-w-[240px]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Budget Limit:</span>
                  <span className="font-semibold text-white">
                    ₹{cost_analysis.monthly_budget.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-400">Budget Usage:</span>
                  <span
                    className={`font-bold ${
                      cost_analysis.is_budget_exceeded ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {cost_analysis.budget_usage_percent}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      cost_analysis.is_budget_exceeded ? 'bg-rose-500' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, cost_analysis.budget_usage_percent)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid of 6 Interactive Charts (Section 23) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Historical Consumption */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">1. Historical Consumption</h3>
              <p className="text-xs text-slate-400">Overall units billed vs peak load hours</p>
            </div>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historical_consumption}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="units_consumed"
                  name="Units Consumed (kWh)"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="peak_usage"
                  name="Peak Usage (kWh)"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Predicted vs Actual Demand */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">2. Predicted vs Actual Demand</h3>
              <p className="text-xs text-slate-400">Telemetry tracking model alignment</p>
            </div>
            <TrendingUp className="h-4 w-4 text-teal-400" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predicted_vs_actual}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Billed (kWh)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  name="ML Forecast (kWh)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Monthly Bill Comparison */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">3. Monthly Bill Comparison</h3>
              <p className="text-xs text-slate-400">Billed amount (₹) against set monthly budget</p>
            </div>
            <DollarSign className="h-4 w-4 text-amber-400" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly_bill}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="bill_amount" name="Bill Amount (₹)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="budget" name="Budget Limit (₹)" fill="#64748b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Peak Demand Analysis (Section 16) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">4. Peak Demand Analysis</h3>
              <p className="text-xs text-slate-400">
                Peak ratio percentage across billing periods (Overall {peak_analysis?.peak_percentage || 0}%)
              </p>
            </div>
            <Activity className="h-4 w-4 text-rose-400" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peak_analysis?.peak_periods || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="peak_ratio_percent" name="Peak Load Ratio (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {peak_analysis && (
            <p className="mt-2 text-xs text-slate-400">{peak_analysis.historical_peak_comparison}</p>
          )}
        </div>
      </div>

      {/* Chart 5 & 6: Efficiency Score Breakdown (Section 18) */}
      {efficiency_breakdown && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-sm shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-400" />
                <span>5. Energy Efficiency Score Breakdown</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">{efficiency_breakdown.summary}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-3xl font-extrabold text-white">
                {efficiency_breakdown.overall_score}
                <span className="text-base text-slate-400 font-normal"> / 100</span>
              </span>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                {efficiency_breakdown.category}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {efficiency_breakdown.factors.map((f, i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>{f.name}</span>
                  <span className="text-emerald-400">
                    {f.score} / {f.weight} pts
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${(f.score / f.weight) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;

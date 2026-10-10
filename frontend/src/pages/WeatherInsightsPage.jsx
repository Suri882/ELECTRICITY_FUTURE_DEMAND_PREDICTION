import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  Thermometer,
  Droplets,
  Wind,
  AlertTriangle,
  Flame,
  Info,
  Calendar,
  RefreshCw,
  Sun,
  CheckCircle2,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { energyApi } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

const WeatherInsightsPage = () => {
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [manualTempInput, setManualTempInput] = useState('');
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async (manualTemp = null) => {
    try {
      if (!weatherData) setLoading(true);
      else setRefreshing(true);

      const [wRes, aRes] = await Promise.all([
        energyApi.getWeather(manualTemp),
        energyApi.getWeatherAnalysis()
      ]);
      setWeatherData(wRes.data);
      setAnalysisData(aRes.data);
      if (manualTemp !== null) {
        setIsManualOverride(true);
      } else {
        setIsManualOverride(!wRes.data.is_live_observation);
      }
    } catch (err) {
      console.error('Weather data fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApplyManualTemp = (e) => {
    e.preventDefault();
    if (!manualTempInput) return;
    const t = parseFloat(manualTempInput);
    if (!isNaN(t)) {
      fetchWeatherData(t);
    }
  };

  const handleResetLive = () => {
    setManualTempInput('');
    setIsManualOverride(false);
    fetchWeatherData(null);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner text="Connecting to meteorological telemetry..." />
      </div>
    );
  }

  const curr = weatherData?.current || {};
  const warning = weatherData?.weather_warning || {};
  const isLive = weatherData?.is_live_observation;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                isLive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              <Compass className="h-3 w-3" />
              {isLive ? 'Live Meteorological Feed' : 'Manual / Fallback Baseline'}
            </span>
            <span className="text-xs text-slate-400">
              {weatherData?.city} ({weatherData?.latitude?.toFixed(2)}°N, {weatherData?.longitude?.toFixed(2)}°E)
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100 mt-1">
            Weather-Based Demand Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time ambient temperature impact, cooling degree days (CDD), and heatwave load surge forecasts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isManualOverride && (
            <button
              onClick={handleResetLive}
              className="text-xs text-cyan-400 hover:text-cyan-300 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
            >
              Reset to Live API
            </button>
          )}
          <button
            onClick={() => fetchWeatherData(isManualOverride ? parseFloat(manualTempInput) : null)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Heatwave / Temperature Warning Banner */}
      <div
        className={`rounded-2xl border p-5 shadow-xl ${
          warning.severity === 'Critical'
            ? 'bg-rose-500/10 border-rose-500/30'
            : warning.severity === 'Warning'
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-emerald-500/10 border-emerald-500/30'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl border shrink-0 ${
              warning.severity === 'Critical'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : warning.severity === 'Warning'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <Flame className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-100 text-base">{warning.title}</h3>
            <p className="text-sm text-slate-300">{warning.message}</p>
            <p className="text-xs text-cyan-400/90 pt-1 font-medium">
              Estimated HVAC Duty Surge: +{warning.cooling_surge_pct}% above baseline
            </p>
          </div>
        </div>
      </div>

      {/* Current Weather Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Temp */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Current Temperature</span>
            <span className="text-xl">{curr.icon || '🌡️'}</span>
          </div>
          <p className="text-3xl font-bold text-slate-100">
            {curr.temperature}°C
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Feels like {curr.apparent_temperature}°C • {curr.condition}
          </span>
        </div>

        {/* Metric 2: Cooling Degree Days */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Cooling Degree Days</span>
            <Sun className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-amber-400">
            {curr.cooling_degree_days} <span className="text-xs font-normal text-slate-400">CDD</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Base: 24°C cooling threshold
          </span>
        </div>

        {/* Metric 3: Relative Humidity */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Relative Humidity</span>
            <Droplets className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-bold text-cyan-400">
            {curr.humidity}%
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Influences latent AC dehumidification load
          </span>
        </div>

        {/* Metric 4: Weather Category */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Demand Intensity Zone</span>
            <CloudSun className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-base font-bold text-emerald-400 mt-1 leading-snug">
            {curr.condition_category || 'Comfortable'}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Source: {weatherData?.data_source}
          </span>
        </div>
      </div>

      {/* 24-Hour Temperature & Forecast Chart */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-100">Next 24 Hours Ambient Temperature Curve</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Hourly ambient temperature progression and cooling threshold benchmark (24°C).
            </p>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400"></span> Forecasted Temp (°C)
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={weatherData?.hourly_forecast || []}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                labelStyle={{ color: '#cbd5e1', fontWeight: 'bold' }}
                formatter={(val) => [`${val}°C`, 'Temperature']}
              />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 2, fill: '#f59e0b' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7-Day Weather Forecast Strip */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <h3 className="font-semibold text-slate-100 mb-1">7-Day Meteorological Outlook</h3>
        <p className="text-xs text-slate-400 mb-4">
          Daily high/low temperature forecasts incorporated into the AI demand regression pipeline.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {(weatherData?.daily_forecast || []).map((day, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-800/40 p-3 flex flex-col items-center text-center space-y-1 hover:border-slate-700 transition-colors"
            >
              <span className="text-xs text-slate-400">{day.date}</span>
              <span className="text-2xl my-1">{day.icon}</span>
              <span className="text-xs font-semibold text-slate-200 truncate w-full">{day.condition}</span>
              <div className="flex items-center gap-1.5 text-xs pt-1">
                <span className="text-amber-400 font-bold">{day.temp_max}°</span>
                <span className="text-slate-500">/</span>
                <span className="text-cyan-400">{day.temp_min}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weather Scenarios Comparison & Manual Override */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Comparative Scenarios Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-3">
          <h3 className="font-semibold text-slate-100">
            Comparative Demand Under Different Weather Conditions
          </h3>
          <p className="text-xs text-slate-400">
            Empirical consumption response modeled on regional cooling multipliers and degree-day coefficients.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Weather Condition</th>
                  <th className="py-2.5 px-3">Temp Range</th>
                  <th className="py-2.5 px-3">Load Factor</th>
                  <th className="py-2.5 px-3">Est. Daily kWh</th>
                  <th className="py-2.5 px-3 rounded-r-lg">HVAC Duty Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {(analysisData?.weather_scenarios_comparison || []).map((sc, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-medium text-slate-200">{sc.condition}</td>
                    <td className="py-2.5 px-3">{sc.temperature_range}</td>
                    <td className="py-2.5 px-3 font-semibold text-amber-400">{sc.cooling_multiplier}x</td>
                    <td className="py-2.5 px-3 text-cyan-400">{sc.estimated_daily_kwh} kWh</td>
                    <td className="py-2.5 px-3 text-slate-400">{sc.air_conditioning_duty_cycle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manual Temperature Simulation Fallback */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <SlidersHorizontal className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold text-slate-100">Manual Temperature Override</h3>
          </div>
          <p className="text-xs text-slate-400">
            If external internet/APIs are restricted, or you wish to simulate extreme heatwaves, enter manual temperature.
          </p>

          <form onSubmit={handleApplyManualTemp} className="space-y-3">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Simulated Temperature (°C)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="55"
                placeholder="e.g. 36.5"
                value={manualTempInput}
                onChange={(e) => setManualTempInput(e.target.value)}
                className="w-full text-sm rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all"
            >
              Apply Simulated Weather
            </button>
          </form>

          <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Data Integrity Notice:</span>
            <span>
              Live observations are fetched via Open-Meteo. Manual overrides are visibly flagged and do not overwrite verified historical records.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherInsightsPage;

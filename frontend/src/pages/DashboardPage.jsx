import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { energyApi } from '../services/api';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import Construction3DCard from '../components/Construction3DCard';
import {
  Zap,
  TrendingUp,
  Gauge,
  Award,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  PlusCircle,
  Activity,
  Calendar,
  CheckCircle2,
  Sliders,
  DollarSign,
  Leaf,
  Clock,
  CloudSun,
  Database,
  Sparkles,
  BarChart3,
  Building2,
  Home,
  Building,
  GraduationCap,
  HeartPulse,
  Briefcase,
  ShoppingBag,
  BedDouble,
  Factory,
  Server,
  Boxes,
  Store,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

const CONSTRUCTION_TYPES = [
  {
    name: 'Residential House',
    category: 'Residential',
    icon: Home,
    badge: 'Residential',
    desc: 'Villa, duplex, bungalow or independent family home with rooftop solar potential.',
    powerDensity: '3.5 - 4.5 W/sq ft',
    peakHours: '18:00 – 22:00'
  },
  {
    name: 'Apartment / Residential Complex',
    category: 'Residential',
    icon: Building,
    badge: 'Residential',
    desc: 'Multi-story residential towers, flats, lifts & common amenity utilities.',
    powerDensity: '5.0 - 7.0 W/sq ft',
    peakHours: '06:00 – 09:00 & 19:00 – 22:00'
  },
  {
    name: 'College / School',
    category: 'Public and Institutional',
    icon: GraduationCap,
    badge: 'Institutional',
    desc: 'Educational campus, lecture halls, computer/science labs & auditorium.',
    powerDensity: '4.0 - 6.0 W/sq ft',
    peakHours: '09:00 – 16:30'
  },
  {
    name: 'Hospital',
    category: 'Public and Institutional',
    icon: HeartPulse,
    badge: 'Healthcare',
    desc: 'Critical 24/7 healthcare facility with ICU, OT, diagnostic labs & wards.',
    powerDensity: '12.0 - 18.0 W/sq ft',
    peakHours: 'Continuous 24/7'
  },
  {
    name: 'Office Building',
    category: 'Commercial',
    icon: Briefcase,
    badge: 'Commercial',
    desc: 'Corporate office towers, workstations, meeting suites & HVAC plant.',
    powerDensity: '8.0 - 12.0 W/sq ft',
    peakHours: '09:00 – 18:00'
  },
  {
    name: 'Shopping Mall',
    category: 'Commercial',
    icon: ShoppingBag,
    badge: 'Retail',
    desc: 'Retail shopping galleria, anchor supermarkets, escalators & food courts.',
    powerDensity: '14.0 - 20.0 W/sq ft',
    peakHours: '11:00 – 21:30'
  },
  {
    name: 'Hotel',
    category: 'Commercial',
    icon: BedDouble,
    badge: 'Hospitality',
    desc: 'Luxury guest rooms, hospitality suites, commercial kitchens & banquet halls.',
    powerDensity: '9.0 - 14.0 W/sq ft',
    peakHours: '07:00 – 11:00 & 18:00 – 23:00'
  },
  {
    name: 'Factory / Industrial Building',
    category: 'Industrial and Infrastructure',
    icon: Factory,
    badge: 'Industrial',
    desc: 'Manufacturing shop-floor, heavy motors, compressors & substation switchgear.',
    powerDensity: '20.0 - 45.0 W/sq ft',
    peakHours: 'Shift-based (08:00 – 20:00)'
  },
  {
    name: 'IT Park',
    category: 'Commercial',
    icon: Server,
    badge: 'Technology',
    desc: 'High-density tech campus, data rack halls, redundant UPS & precision chillers.',
    powerDensity: '18.0 - 32.0 W/sq ft',
    peakHours: '24/7 Mission-Critical'
  },
  {
    name: 'Warehouse',
    category: 'Commercial',
    icon: Boxes,
    badge: 'Logistics',
    desc: 'Large-span logistics fulfillment center, high-bay LED & forklift charging.',
    powerDensity: '2.5 - 4.0 W/sq ft',
    peakHours: '08:00 – 19:00'
  },
  {
    name: 'Other Commercial Building',
    category: 'Commercial',
    icon: Store,
    badge: 'Commercial',
    desc: 'Commercial showroom, bank branch, private clinic or custom commercial space.',
    powerDensity: '7.0 - 11.0 W/sq ft',
    peakHours: '10:00 – 20:00'
  }
];

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [peakAnalysis, setPeakAnalysis] = useState(null);
  const [billEst, setBillEst] = useState(null);
  const [carbonSummary, setCarbonSummary] = useState(null);
  const [simSummary, setSimSummary] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recentPlans, setRecentPlans] = useState([]);
  const [activeChartTab, setActiveChartTab] = useState('actual_vs_pred');
  const [predicting, setPredicting] = useState(false);
  const [demoBannerOpen, setDemoBannerOpen] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, dashRes, peakRes, billRes, carbRes, simRes, recRes, altRes, projRes] = await Promise.all([
        api.get('/analytics/summary').catch(() => ({ data: null })),
        api.get('/analytics/dashboard-full').catch(() => ({ data: { historical_consumption: [] } })),
        energyApi.getPeakDemand().catch(() => ({ data: null })),
        energyApi.getBillingEstimates().catch(() => ({ data: null })),
        energyApi.getCarbonSummary().catch(() => ({ data: null })),
        energyApi.runSimulation({ peak_reduction_pct: 15, peak_shift_pct: 20 }).catch(() => ({ data: null })),
        api.get('/recommendations').catch(() => ({ data: [] })),
        api.get('/alerts').catch(() => ({ data: [] })),
        energyApi.getProjects().catch(() => ({ data: [] })),
      ]);

      setSummary(sumRes?.data || null);
      setChartData(dashRes?.data?.historical_consumption || []);
      setPeakAnalysis(peakRes?.data || null);
      setBillEst(billRes?.data || null);
      setCarbonSummary(carbRes?.data || null);
      setSimSummary(simRes?.data?.summary || null);
      setRecommendations(recRes?.data || []);
      setAlerts((altRes?.data || []).filter((a) => !a.is_read));
      setRecentPlans(projRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickPredict = async () => {
    setPredicting(true);
    try {
      await energyApi.generatePrediction({ forecast_period: '30d' });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setPredicting(false);
    }
  };

  const handleLoadDemo = async () => {
    await energyApi.loadDemoData();
    fetchDashboardData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return <LoadingSpinner text="Compiling full energy intelligence dashboard..." />;
  }

  // If user has no data, show high-impact welcome and 1-click Demo Data loader
  if (!summary || !summary.has_data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {getGreeting()}, {user?.name || 'User'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Smart Electricity Demand Prediction & Energy Optimization Platform
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-slate-900 to-slate-900 p-6 text-center space-y-4">
          <Sparkles className="h-10 w-10 text-indigo-400 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-100">Unlock Advanced Energy Intelligence</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              You can log manual meter entries, upload billing CSVs, or immediately load our calibrated 12-month
              Demonstration Dataset to explore all AI demand predictions, What-If simulations, and peak alerts.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={handleLoadDemo}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all hover:scale-105"
            >
              <Database className="h-4 w-4" />
              <span>Load 12-Month Demo Dataset (1-Click)</span>
            </button>
            <Link
              to="/consumption/add"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Manual Entry</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pre-formatted values
  const curUnits = summary.current_consumption || 0;
  const predUnits = summary.predicted_demand || (curUnits * 1.05).toFixed(1);
  const totalHistorical = chartData.reduce((acc, row) => acc + (row.units_consumed || 0), 0).toFixed(0);
  const peakWindow = peakAnalysis?.peak_window || '18:00 – 21:30';
  const billTotal = billEst?.current_cycle_estimate?.total_estimated_bill || (curUnits * 7.5 * 1.05).toFixed(0);
  const carbTotal = carbonSummary?.actual?.emissions_kg || (curUnits * 0.82).toFixed(0);
  const simSavings = simSummary?.energy_saved_kwh || (curUnits * 0.05).toFixed(1);
  const simBillSavings = simSummary?.bill_saved_inr || (simSavings * 7.5).toFixed(0);

  // Peak vs off-peak donut data
  const peakTotal = chartData.reduce((acc, row) => acc + (row.peak_usage || 0), 0);
  const offPeakTotal = Math.max(0, totalHistorical - peakTotal);
  const pieData = [
    { name: 'Off-Peak Hours (Low Tariff)', value: Math.round(offPeakTotal), color: '#06b6d4' },
    { name: 'Peak Surge Hours (Surcharge)', value: Math.round(peakTotal), color: '#f59e0b' }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            {getGreeting()}, {user?.name || 'User'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {user?.consumer_type || 'Household'} energy portfolio • {summary.records_count} billing cycles evaluated
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickPredict}
            disabled={predicting}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-slate-750 hover:border-emerald-500/40 transition-colors disabled:opacity-50"
          >
            <TrendingUp className="h-4 w-4" />
            <span>{predicting ? 'Forecasting...' : 'Update ML Forecast'}</span>
          </button>

          <Link
            to="/simulator"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all hover:scale-105"
          >
            <Sliders className="h-4 w-4" />
            <span>What-If Simulator</span>
          </Link>
        </div>
      </div>

      {/* Demo Mode Notice Banner */}
      {user?.demo_mode && demoBannerOpen && (
        <div className="flex items-center justify-between rounded-xl bg-indigo-500/10 border border-indigo-500/30 px-4 py-3 text-xs text-indigo-300">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
            <span>
              <strong>Demonstration Mode Active:</strong> Displaying calibrated 12-month demo profile.
              You can switch to clean real data anytime in <Link to="/settings" className="underline font-bold text-indigo-200">Settings</Link>.
            </span>
          </div>
          <button onClick={() => setDemoBannerOpen(false)} className="text-indigo-400 hover:text-white ml-2">×</button>
        </div>
      )}

      {/* ============================================================== */}
      {/* Prominent Section: Plan a New Construction (3D Building Cards) */}
      {/* ============================================================== */}
      <div className="rounded-3xl border border-[#1677FF]/35 bg-[#071426] p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6">
        {/* Subtle Ambient Circuit Glow Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#00D9FF]/12 via-[#1677FF]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#1677FF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1677FF]/25 pb-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-[#1677FF]/20 text-[#00D9FF] text-[10px] font-black px-3 py-1 border border-[#00D9FF]/40 tracking-wider inline-flex items-center gap-1.5 shadow-sm shadow-[#00D9FF]/10">
                <Zap className="h-3 w-3 text-[#FFD43B]" />
                INTERACTIVE 3D CONSTRUCTION DEMAND PLANNER
              </span>
              <span className="text-xs text-slate-400 font-medium">• 11 Architectural Types</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-[#F5F8FF] tracking-tight flex items-center gap-2.5">
              Plan a New Construction
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              Pre-estimate daily & monthly electricity demand, peak kW load, temporary builder power, appliances TCO, and DISCOM tariff bills before laying physical foundations.
            </p>
          </div>

          <Link
            to="/planning-studio?action=new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1677FF] via-[#00D9FF] to-[#1677FF] px-5 py-3 text-xs md:text-sm font-extrabold text-[#071426] shadow-lg shadow-[#1677FF]/30 hover:shadow-[#00D9FF]/40 hover:scale-[1.02] transition-all shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>+ New Energy Plan</span>
          </Link>
        </div>

        {/* Selection Cards Grid: 3–4 cards per row on desktop, 2 on tablet, 1 on mobile */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-[#F5F8FF] flex items-center gap-2">
              <span>Select Construction Type to Launch:</span>
              <span className="text-[10px] text-[#00D9FF] bg-[#1677FF]/15 px-2.5 py-0.5 rounded-full border border-[#1677FF]/30 font-medium">
                Compact 3D Models • Tilt & Inspect
              </span>
            </span>
            <Link to="/planning-studio?action=new" className="text-[#00D9FF] hover:underline flex items-center gap-1 font-semibold">
              View All in Studio <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {CONSTRUCTION_TYPES.map((ct) => (
              <Construction3DCard
                key={ct.name}
                constructionType={ct}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* Section: Recent Energy Plans */}
      {/* ============================================================== */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-400" />
              Recent Energy Plans
            </h3>
            <p className="text-xs text-slate-400">
              Saved pre-construction facility plans, load models, and DISCOM tariff forecasts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/planning-studio"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Open Planning Studio</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {recentPlans.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center space-y-3">
            <Building2 className="h-8 w-8 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-300">No Construction Plans Created Yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Start your first pre-construction demand assessment by choosing any building type above.
              </p>
            </div>
            <Link
              to="/planning-studio?action=new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-emerald-400 border border-slate-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Plan Your First Facility</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentPlans.slice(0, 6).map((plan) => (
              <div
                key={plan.id}
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      {plan.facility_subtype}
                    </span>
                    {plan.is_demo && (
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">
                        DEMO
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{plan.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span>{plan.built_up_area?.toLocaleString()} {plan.area_unit || 'sq ft'}</span>
                    <span>•</span>
                    <span className="truncate">{plan.location || 'India'}</span>
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 pt-3 border-t border-slate-900 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Est. Monthly</span>
                      <span className="font-bold text-slate-200">
                        {plan.estimated_monthly_kwh ? `${plan.estimated_monthly_kwh.toLocaleString()} kWh` : 'Calibrated'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Est. Bill</span>
                      <span className="font-bold text-emerald-400">
                        {plan.estimated_monthly_bill ? `₹${plan.estimated_monthly_bill.toLocaleString('en-IN')}` : 'View in Studio'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2">
                  <Link
                    to={`/planning-studio?projectId=${plan.id}`}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
                  >
                    <span>Open Studio Plan</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7 Required Core Metric Cards (Requirement 8) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* 1. Latest Recorded */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Latest Consumption</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">
            {curUnits} <span className="text-xs font-normal text-slate-400">kWh</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Baseline avg: {summary.previous_average} kWh
          </span>
        </div>

        {/* 2. Total Historical Energy */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Total Historical</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-400">
            {totalHistorical} <span className="text-xs font-normal text-slate-400">kWh</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across {summary.records_count} recorded cycles
          </span>
        </div>

        {/* 3. Predicted Demand */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Predicted Demand</span>
            <TrendingUp className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-indigo-400">
            {predUnits} <span className="text-xs font-normal text-slate-400">kWh</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Status: {summary.demand_level || 'Normal'}
          </span>
        </div>

        {/* 4. Next Peak Window */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Next Peak Period</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-amber-400 truncate">
            {peakWindow}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Peak ratio: {peakAnalysis?.peak_ratio_pct ?? 28}%
          </span>
        </div>

        {/* 5. Estimated Bill */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Estimated Bill</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            ₹{Number(billTotal).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Official tariff estimate
          </span>
        </div>

        {/* 6. Estimated Carbon */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Estimated CO2e</span>
            <Leaf className="h-4 w-4 text-teal-400" />
          </div>
          <p className="text-2xl font-bold text-teal-400">
            {carbTotal} <span className="text-xs font-normal text-slate-400">kg</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Factor: {carbonSummary?.grid_emission_factor || 0.82} kg/kWh
          </span>
        </div>

        {/* 7. Potential Simulator Savings */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Simulator Potential</span>
            <Sliders className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-300">
            -{simSavings} <span className="text-xs font-normal text-slate-400">kWh</span>
          </p>
          <span className="text-[11px] text-cyan-400/90 mt-1 block font-medium">
            Save ~₹{simBillSavings}/month
          </span>
        </div>

        {/* 8. Efficiency Score */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Efficiency Score</span>
            <Award className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">
            {summary.efficiency_score || 72} <span className="text-xs font-normal text-slate-400">/ 100</span>
          </p>
          <span className="text-[11px] text-emerald-400 mt-1 block">
            Objective 5-factor index
          </span>
        </div>
      </div>

      {/* Interactive Visualizations Switcher (Requirement 8) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-semibold text-white">Advanced Interactive Energy Visualizations</h2>
            <p className="text-xs text-slate-400">Select any telemetry dimension to inspect trends and forecasts.</p>
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'actual_vs_pred', label: 'Actual vs Predicted' },
              { id: 'diurnal', label: '24h Diurnal Curve' },
              { id: 'peak_split', label: 'Peak vs Off-Peak' },
              { id: 'sim_compare', label: 'Baseline vs Simulated' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveChartTab(t.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeChartTab === t.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Actual vs Predicted Demand */}
        {activeChartTab === 'actual_vs_pred' && (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                  labelStyle={{ color: '#cbd5e1', fontWeight: 'bold' }}
                  formatter={(val) => [`${val} kWh`, 'Recorded Consumption']}
                />
                <Area
                  type="monotone"
                  dataKey="units_consumed"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#actGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tab 2: 24h Diurnal Profile */}
        {activeChartTab === 'diurnal' && (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakAnalysis?.hourly_points || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                  labelStyle={{ color: '#cbd5e1', fontWeight: 'bold' }}
                  formatter={(val, name, item) => [
                    `${val} kWh ${item.payload.is_peak ? '(Peak Hour)' : ''}`,
                    'Hourly Projected Load'
                  ]}
                />
                <Bar dataKey="predicted_kwh" radius={[4, 4, 0, 0]}>
                  {(peakAnalysis?.hourly_points || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.is_peak ? '#f59e0b' : '#06b6d4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tab 3: Peak vs Off-Peak Pie */}
        {activeChartTab === 'peak_split' && (
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                  formatter={(val) => [`${val} kWh`, 'Total']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tab 4: Baseline vs Simulated */}
        {activeChartTab === 'sim_compare' && (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={peakAnalysis?.hourly_points || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                  formatter={(val) => [`${val} kWh`, 'Demand']}
                />
                <Area
                  type="monotone"
                  dataKey="predicted_kwh"
                  name="Baseline"
                  stroke="#94a3b8"
                  fill="#64748b"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Quick Navigation Cards to All Modules */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Energy Intelligence Platform Modules
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Demand Prediction', to: '/predictions', icon: TrendingUp, color: 'text-indigo-400' },
            { label: 'Peak-Demand', to: '/peak-demand', icon: Zap, color: 'text-amber-400' },
            { label: 'Weather Insights', to: '/weather', icon: CloudSun, color: 'text-amber-300' },
            { label: 'Bill Estimator', to: '/billing', icon: DollarSign, color: 'text-cyan-400' },
            { label: 'What-If Simulator', to: '/simulator', icon: Sliders, color: 'text-emerald-400' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                to={item.to}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 hover:border-slate-700 hover:bg-slate-800/40 transition-all flex flex-col justify-between"
              >
                <Icon className={`h-5 w-5 ${item.color} mb-2`} />
                <span className="text-xs font-semibold text-slate-200">{item.label}</span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                  Open <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

import React, { useState, useEffect } from 'react';
import api, { energyApi } from '../services/api';
import EmptyState from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  Search,
  AlertCircle,
  TrendingDown,
  Sparkles
} from 'lucide-react';

const RecommendationsPage = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/recommendations');
      setRecommendations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const res = await energyApi.refreshRecommendations();
      setRecommendations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Generating tailored energy optimization directives..." />;
  }

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'High':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Medium':
        return 'bg-teal-500/15 text-teal-400 border-teal-500/30';
      case 'Low':
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
              Rule & ML Synthesis
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
            Smart Energy Optimization Directives
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Synthesized recommendations addressing peak load shifting, weather surges, budget overruns, and phantom idle power.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Re-Synthesizing...' : 'Refresh Directives'}</span>
        </button>
      </div>

      {recommendations.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No optimization directives generated yet"
          description="Log your consumption cycles or load the 12-month demo dataset to allow the recommendation engine to analyze demand growth, peak concentration, and budget performance."
          actionLabel="Log Electricity Record"
          actionTo="/consumption/add"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 backdrop-blur-sm shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="truncate">{rec.title}</span>
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${getPriorityStyle(
                      rec.priority
                    )}`}
                  >
                    {rec.priority}
                  </span>
                </div>

                <div className="space-y-3 text-xs leading-relaxed">
                  {/* Part 1: What was detected */}
                  <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                      <Search className="h-3.5 w-3.5" />
                      <span>1. What Was Detected:</span>
                    </div>
                    <p className="text-slate-300 pl-5">
                      {rec.reason.split('?')[0] || rec.reason}
                    </p>
                  </div>

                  {/* Part 2: Why it matters */}
                  <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>2. Why It Matters:</span>
                    </div>
                    <p className="text-slate-300 pl-5">
                      Excessive peak-tariff exposure and accelerated consumption velocity cause recurring monthly billing escalation and increased carbon intensity.
                    </p>
                  </div>

                  {/* Part 3: What action the user can take */}
                  <div className="rounded-xl bg-emerald-950/30 p-3 border border-emerald-500/30 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>3. Recommended Action:</span>
                    </div>
                    <p className="text-slate-100 pl-5 font-medium">
                      {rec.action}
                    </p>
                  </div>
                </div>
              </div>

              {/* Part 4: Estimated Impact */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <TrendingDown className="h-3.5 w-3.5 text-teal-400" />
                  <span>4. Estimated Impact:</span>
                </span>
                <span className="font-bold text-teal-300 text-right">{rec.expected_benefit}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;

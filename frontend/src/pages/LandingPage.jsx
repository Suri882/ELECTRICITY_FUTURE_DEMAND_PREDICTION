import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Shield,
  FileText,
  BarChart2,
  CheckCircle2,
  ArrowRight,
  Cpu,
  Layers,
  Database,
  Lock,
  Building2,
  Sparkles,
} from 'lucide-react';

const LandingPage = () => {
  const steps = [
    { title: 'DATA INPUT', desc: 'Manual logs or seamless CSV batch import' },
    { title: 'DATA PROCESSING', desc: 'Validation, imputation & temporal feature engineering' },
    { title: 'CONSUMPTION ANALYSIS', desc: 'Moving averages & time-of-day baseline profiling' },
    { title: 'ML DEMAND PREDICTION', desc: 'Ridge & polynomial regression forecasting' },
    { title: 'ANOMALY DETECTION', desc: 'Multi-factor Z-score & peak ratio outlier detection' },
    { title: 'ENERGY INTELLIGENCE', desc: 'Dynamic 0–100 efficiency scoring & tariff modeling' },
    { title: 'RECOMMENDATIONS', desc: 'Data-driven load curtailment & off-peak shifting' },
    { title: 'ALERTS', desc: 'Proactive Firebase push & in-app event notifications' },
    { title: 'REPORTS', desc: 'Automated executive PDF energy audit generation' },
  ];

  const features = [
    {
      icon: TrendingUp,
      title: 'Machine Learning Demand Prediction',
      desc: 'Predict future electricity consumption with calibrated regression models (Ridge, OLS, Polynomial) featuring verified MAE, RMSE, and R² scores.',
    },
    {
      icon: AlertTriangle,
      title: 'Statistical Anomaly Detection',
      desc: 'Identify unusual surges and high-draw equipment runtimes using statistical deviations without relying on physical smart meters.',
    },
    {
      icon: Lightbulb,
      title: 'Energy Efficiency Scoring (0–100)',
      desc: 'Comprehensive composite scoring evaluated across consumption trend, demand growth, peak usage ratio, budget compliance, and anomaly frequency.',
    },
    {
      icon: BarChart2,
      title: 'Tariff & Cost Intelligence',
      desc: 'Configurable multi-tier tariff calculation, cost variances, and proactive budget threshold monitoring to avoid monthly overruns.',
    },
    {
      icon: FileText,
      title: 'Auditable PDF Reports',
      desc: 'Instant one-click compilation of comprehensive energy audit reports with telemetry breakdowns, prediction benchmarks, and recommendations.',
    },
    {
      icon: Shield,
      title: 'Role-Based Governance',
      desc: 'Granular user telemetry isolation, JWT authentication, and centralized admin monitoring portal for system activity.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/20">
              <Zap className="h-5 w-5 text-slate-950 font-bold" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              ElectroWise
              <span className="hidden sm:inline-block rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                PLATFORM
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/planning-studio"
              className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Planning Studio</span>
            </Link>
            <Link
              to="/login"
              className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 px-4 py-2 rounded-lg transition-all shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>ElectroWise: Smart Energy Demand, Construction Planning & Cost Intelligence</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl max-w-4xl mx-auto leading-tight">
            Plan Construction Power. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Predict Electrical Demand.
            </span> <br />
            Optimize Energy Costs.
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
            The next-generation intelligence platform for individuals, builders, engineers, and enterprises.
            Model temporary construction loads, equipment TCO, DISCOM slab tariffs, and solar/EV microgrids.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/planning-studio"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all hover:scale-105"
            >
              <Building2 className="h-5 w-5" />
              <span>Launch Planning Studio</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-6 py-3.5 text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Sign In to Dashboard
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto border border-slate-800 rounded-2xl bg-slate-900/60 p-6 backdrop-blur-sm">
            <div>
              <div className="text-2xl font-bold text-emerald-400">0 Hardware</div>
              <div className="text-xs text-slate-400 mt-1">Pure Software Intelligence</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">Scikit-learn</div>
              <div className="text-xs text-slate-400 mt-1">Calibrated ML Regressors</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-teal-400">0–100 Score</div>
              <div className="text-xs text-slate-400 mt-1">Multi-Factor Efficiency</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cyan-400">Audit PDFs</div>
              <div className="text-xs text-slate-400 mt-1">ReportLab Generation</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Flowchart */}
      <section className="py-20 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              End-to-End Pipeline
            </h2>
            <h3 className="text-3xl font-bold text-white mt-2">How It Works</h3>
            <p className="text-sm text-slate-400 mt-3">
              Telemetry progresses through validation, statistical modeling, machine learning regression,
              and intelligent recommendation dispatch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((st, idx) => (
              <div
                key={st.title}
                className="relative rounded-2xl border border-slate-800 bg-slate-900/80 p-5 hover:border-emerald-500/40 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20">
                    {idx + 1}
                  </span>
                  <h4 className="text-sm font-bold text-white tracking-wide">{st.title}</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pl-10">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Capabilities
            </h2>
            <h3 className="text-3xl font-bold text-white mt-2">
              Comprehensive Energy Analytics & Optimization
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-700 transition-all hover:bg-slate-900/90"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-5">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">{f.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 bg-slate-900/40 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">
            Engineered With Modern Enterprise Technologies
          </h4>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              'React.js',
              'Vite',
              'Tailwind CSS',
              'FastAPI',
              'SQLAlchemy',
              'MySQL',
              'Scikit-learn',
              'Pandas & NumPy',
              'Recharts',
              'Firebase Cloud Messaging',
              'ReportLab PDF',
              'JWT Security',
            ].map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-slate-800 bg-slate-900 px-4 py-1.5 text-xs font-medium text-slate-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-8 bg-slate-950 text-center text-xs text-slate-500">
        <p>© 2026 Smart Electricity Demand Prediction & Energy Optimization Platform. All rights reserved.</p>
        <p className="mt-1">Registered Problem Statement: Electricity Demand Predictor.</p>
      </footer>
    </div>
  );
};

export default LandingPage;

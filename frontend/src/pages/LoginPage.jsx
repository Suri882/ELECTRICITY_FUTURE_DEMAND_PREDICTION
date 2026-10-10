import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Zap,
  Lock,
  Mail,
  User,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Activity,
  Cpu
} from 'lucide-react';

/**
 * Energy Intelligence — Premium Electricity-Themed Login & Authentication Interface
 *
 * Theme Palette:
 * - Background: #071426 (High-Voltage Dark Navy)
 * - Card Surface: rgba(16, 36, 61, 0.85) (Glassmorphism Surface)
 * - Electric Blue: #1677FF
 * - Cyan Glow: #00D9FF
 * - Voltage Spark: #FFD43B
 * - Premium White Text: #F5F8FF
 *
 * Architecture & Features:
 * - Unified login for all registered users (separate admin login removed)
 * - Any registered user gains immediate platform access without admin approval
 * - Interactive Show/Hide password toggles with accessible controls
 * - Remember Me persistence in localStorage
 * - Quick Forgot Password navigation
 * - In-card Create Account & Sign In toggle for friction-free onboarding
 * - Full Name, Email Address, and Password registration flow
 * - Official Tagline: “Predict Demand. Optimize Energy. Power the Future.”
 * - Circuit traces, SVG power busbars, and animated electric flow
 */
const LoginPage = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Mode: 'login' or 'register'
  const [mode, setMode] = useState('login');

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Create Account State (Name, Email, Password)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status & UI Feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Load remembered credentials on mount
  useEffect(() => {
    const savedEmail =
      localStorage.getItem('energy_intelligence_remembered_email') ||
      localStorage.getItem('electrowise_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Calculate password strength for registration
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Unset', color: 'bg-slate-700', text: 'text-slate-400' };
    if (pass.length < 6) return { score: 1, label: 'Low Voltage', color: 'bg-rose-500', text: 'text-rose-400' };
    if (pass.length < 8 || !/\d/.test(pass)) return { score: 2, label: 'Moderate', color: 'bg-amber-400', text: 'text-amber-400' };
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) {
      return { score: 4, label: 'High Surge (Optimal)', color: 'bg-[#00D9FF]', text: 'text-[#00D9FF]' };
    }
    return { score: 3, label: 'Strong', color: 'bg-emerald-400', text: 'text-emerald-400' };
  };

  const regStrength = getPasswordStrength(regPassword);

  // Handle Login Submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      // Remember me handling
      if (rememberMe) {
        localStorage.setItem('energy_intelligence_remembered_email', cleanEmail);
      } else {
        localStorage.removeItem('energy_intelligence_remembered_email');
        localStorage.removeItem('electrowise_remembered_email');
      }

      const loggedUser = await login(cleanEmail, password);
      setSuccess('Grid connection authenticated! Loading your intelligence dashboard...');

      setTimeout(() => {
        if (loggedUser.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }, 500);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        'Invalid email or password. Please verify your credentials and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Create Account Submission (Name, Email, Password)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();

    if (!cleanName) {
      setError('Please provide your full name.');
      return;
    }
    if (!cleanEmail) {
      setError('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const newUser = await register({
        name: cleanName,
        email: cleanEmail,
        password: regPassword,
        confirm_password: regPassword,
        consumer_type: 'Household'
      });

      setSuccess('Account provisioned successfully! Granting immediate dashboard access...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 600);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        'Account registration failed. An account with this email may already exist.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#071426] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-[#00D9FF]/30 selection:text-[#00D9FF]">
      {/* ============================================================== */}
      {/* Background Electricity & High-Voltage Circuit Visuals          */}
      {/* ============================================================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft Radial Ambient Energy Glows */}
        <div className="absolute -top-36 -left-36 w-[560px] h-[560px] bg-[#1677FF]/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-36 -right-36 w-[620px] h-[620px] bg-[#00D9FF]/12 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[#071426] rounded-full opacity-60" />

        {/* High-Voltage Circuit Grid Background SVG */}
        <svg
          className="absolute inset-0 w-full h-full opacity-25"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="electricity-grid-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1677FF" strokeWidth="0.6" strokeOpacity="0.4" />
              <circle cx="0" cy="0" r="1.5" fill="#00D9FF" fillOpacity="0.7" />
            </pattern>
            <linearGradient id="lightning-arc-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#1677FF" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#00D9FF" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#electricity-grid-pattern)" />

          {/* Dynamic Ambient Electric Conduits & Lightning Arc Lines */}
          <path
            d="M 30 140 L 260 140 L 330 210 L 620 210"
            fill="none"
            stroke="url(#lightning-arc-gradient)"
            strokeWidth="1.5"
            strokeDasharray="12 8"
            className="animate-electric-flow"
          />
          <path
            d="M 850 680 L 1120 680 L 1190 610 L 1450 610"
            fill="none"
            stroke="url(#lightning-arc-gradient)"
            strokeWidth="1.5"
            strokeDasharray="10 6"
            className="animate-electric-flow"
          />
          <path
            d="M 120 780 L 340 780 L 400 840 L 750 840"
            fill="none"
            stroke="#00D9FF"
            strokeWidth="1"
            strokeOpacity="0.35"
            strokeDasharray="6 4"
          />
        </svg>

        {/* Pulsing Grid Telemetry Nodes */}
        <div className="absolute top-20 left-[18%] w-2 h-2 rounded-full bg-[#00D9FF] shadow-[0_0_12px_#00D9FF] animate-pulse" />
        <div className="absolute bottom-24 right-[16%] w-2.5 h-2.5 rounded-full bg-[#FFD43B] shadow-[0_0_15px_#FFD43B] animate-pulse" />
        <div className="absolute top-1/3 right-[10%] w-2 h-2 rounded-full bg-[#1677FF] shadow-[0_0_10px_#1677FF] animate-pulse" />
      </div>

      {/* ============================================================== */}
      {/* Brand Header: Logo, Title & Tagline                            */}
      {/* ============================================================== */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-3">
        {/* Subtle System Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10243D]/90 border border-[#1677FF]/40 text-[11px] font-semibold text-[#00D9FF] shadow-inner tracking-wider uppercase mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] animate-ping" />
          <Activity className="h-3 w-3 text-[#00D9FF]" />
          <span>Grid Sync Active • 50.0 Hz</span>
        </div>

        {/* Energy Intelligence Brand Logo */}
        <Link to="/" className="inline-flex items-center gap-3.5 group">
          <div className="relative flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#1677FF] via-[#00D9FF] to-[#1677FF] shadow-[0_0_28px_rgba(0,217,255,0.45)] group-hover:scale-105 transition-all duration-300">
            <Zap className="h-7 w-7 text-[#071426] fill-[#071426] stroke-[2]" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D9FF] opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#FFD43B] border-2 border-[#071426]" />
            </span>
          </div>
          <div className="text-left">
            <span className="text-2xl font-black tracking-tight text-[#F5F8FF] block leading-none">
              ENERGY <span className="text-[#00D9FF]">INTELLIGENCE</span>
            </span>
            <span className="text-[10px] font-bold tracking-widest text-[#1677FF] uppercase">
              Smart Demand & Grid Optimization
            </span>
          </div>
        </Link>

        {/* Required Tagline */}
        <p className="text-xs sm:text-sm font-medium text-slate-300 tracking-wide pt-1">
          “Predict Demand. Optimize Energy. Power the Future.”
        </p>
      </div>

      {/* ============================================================== */}
      {/* Glass-Style Login / Registration Card                          */}
      {/* ============================================================== */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="relative rounded-3xl border border-[#1677FF]/35 bg-[#10243D]/85 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,217,255,0.12),0_20px_50px_rgba(7,20,38,0.95)] overflow-hidden">
          {/* Top Edge Neon Cyan Glow Line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00D9FF] to-transparent shadow-[0_0_10px_#00D9FF]" />

          {/* Mode Switch Tabs: Sign In / Create Account */}
          <div className="flex rounded-xl bg-[#071426]/90 p-1 border border-[#1677FF]/35 mb-6">
            <button
              type="button"
              id="login-tab-btn"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-[#1677FF] to-[#00D9FF] text-[#071426] shadow-md shadow-[#1677FF]/30'
                  : 'text-slate-400 hover:text-[#F5F8FF]'
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              id="register-tab-btn"
              onClick={() => {
                setMode('register');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-[#1677FF] to-[#00D9FF] text-[#071426] shadow-md shadow-[#1677FF]/30'
                  : 'text-slate-400 hover:text-[#F5F8FF]'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {/* Success Alert Box */}
          {success && (
            <div
              role="status"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <span className="leading-relaxed font-medium">{success}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 1: SIGN IN FORM                                         */}
          {/* ============================================================ */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email Address */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#1677FF]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-[#1677FF]/35 bg-[#071426]/90 py-2.5 pl-10 pr-4 text-sm text-[#F5F8FF] placeholder-slate-500 focus:border-[#00D9FF] focus:outline-none focus:ring-1 focus:ring-[#00D9FF] shadow-inner transition-colors"
                    placeholder="engineer@energyintel.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    id="forgot-password-link"
                    className="text-xs font-semibold text-[#00D9FF] hover:underline transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#1677FF]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#1677FF]/35 bg-[#071426]/90 py-2.5 pl-10 pr-11 text-sm text-[#F5F8FF] placeholder-slate-500 focus:border-[#00D9FF] focus:outline-none focus:ring-1 focus:ring-[#00D9FF] shadow-inner transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    id="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-[#00D9FF] transition-colors focus:outline-none cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Option */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    id="remember-me-checkbox"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[#1677FF]/40 bg-[#071426] text-[#00D9FF] focus:ring-[#00D9FF] focus:ring-offset-0 transition-colors accent-[#00D9FF] cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 font-medium">Remember Me</span>
                </label>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#00D9FF]" />
                  <span>Encrypted Session</span>
                </span>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                id="login-submit-btn"
                disabled={loading}
                className="voltage-shimmer-btn w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1677FF] via-[#00D9FF] to-[#1677FF] py-3 text-sm font-extrabold text-[#071426] shadow-lg shadow-[#1677FF]/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#071426] border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating Grid Credentials...</span>
                  </span>
                ) : (
                  <>
                    <Zap className="h-4 w-4 stroke-[2.5]" />
                    <span>Login</span>
                    <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ============================================================ */}
          {/* TAB 2: CREATE ACCOUNT FORM (NAME, EMAIL, PASSWORD)          */}
          {/* ============================================================ */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#1677FF]">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full rounded-xl border border-[#1677FF]/35 bg-[#071426]/90 py-2.5 pl-10 pr-4 text-sm text-[#F5F8FF] placeholder-slate-500 focus:border-[#00D9FF] focus:outline-none focus:ring-1 focus:ring-[#00D9FF] shadow-inner transition-colors"
                    placeholder="e.g. Ramesh Patel"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#1677FF]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full rounded-xl border border-[#1677FF]/35 bg-[#071426]/90 py-2.5 pl-10 pr-4 text-sm text-[#F5F8FF] placeholder-slate-500 focus:border-[#00D9FF] focus:outline-none focus:ring-1 focus:ring-[#00D9FF] shadow-inner transition-colors"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Password (min. 6 characters)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#1677FF]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#1677FF]/35 bg-[#071426]/90 py-2.5 pl-10 pr-11 text-sm text-[#F5F8FF] placeholder-slate-500 focus:border-[#00D9FF] focus:outline-none focus:ring-1 focus:ring-[#00D9FF] shadow-inner transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    id="toggle-reg-password-btn"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-[#00D9FF] transition-colors focus:outline-none cursor-pointer"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Voltage / Security Level Indicator */}
                {regPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Security Voltage:</span>
                      <span className={`font-bold ${regStrength.text}`}>{regStrength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#071426] rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            regStrength.score >= step ? regStrength.color : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Create Account Submit Button */}
              <button
                type="submit"
                id="register-submit-btn"
                disabled={loading}
                className="voltage-shimmer-btn w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1677FF] via-[#00D9FF] to-[#1677FF] py-3 text-sm font-extrabold text-[#071426] shadow-lg shadow-[#1677FF]/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#071426] border-t-transparent rounded-full animate-spin" />
                    <span>Provisioning Platform Account...</span>
                  </span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 stroke-[2.5]" />
                    <span>Create Account</span>
                    <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-1">
                Immediate access granted upon registration. No administrative approval required.
              </p>
            </form>
          )}

          {/* Quick Switch Alternative */}
          <div className="mt-6 pt-4 border-t border-[#1677FF]/20 text-center">
            {mode === 'login' ? (
              <p className="text-xs text-slate-400">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  id="switch-to-create-account"
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className="font-bold text-[#00D9FF] hover:underline cursor-pointer ml-1"
                >
                  Create Account
                </button>
                {' '}or visit{' '}
                <Link to="/register" className="text-slate-300 hover:text-white underline font-semibold">
                  Full Registration
                </Link>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  id="switch-to-login"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="font-bold text-[#00D9FF] hover:underline cursor-pointer ml-1"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Security & System Info Footer */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Cpu className="h-3 w-3 text-[#1677FF]" />
            AI Demand Engine v2.4
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-[#00D9FF]" />
            256-Bit Encrypted
          </span>
          <span>•</span>
          <span>Single Sign-On Ready</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Zap,
  Lock,
  Mail,
  User,
  Phone,
  Building2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

/**
 * Energy Intelligence — Registration Page
 *
 * Theme Colors:
 * - Background: #071426 (Dark Navy)
 * - Card Surface: #10243D
 * - Electric Blue: #1677FF
 * - Energy Cyan: #00D9FF
 * - Power Yellow: #FFD43B
 * - Main Text: #F5F8FF
 */
const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    consumer_type: 'Household',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const newUser = await register(formData);
      setSuccess('Account created successfully! Loading your dashboard...');
      setTimeout(() => {
        if (newUser.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }, 500);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        'Registration failed. Please check your information and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#071426] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-[#00D9FF]/30 selection:text-[#00D9FF]">
      {/* Background Electricity Visuals */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#1677FF]/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-[#00D9FF]/12 rounded-full blur-[150px]" />

        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="electricity-grid-reg" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1677FF" strokeWidth="0.7" strokeOpacity="0.4" />
              <circle cx="0" cy="0" r="1.5" fill="#00D9FF" fillOpacity="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#electricity-grid-reg)" />
        </svg>
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-3">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#1677FF] via-[#00D9FF] to-[#1677FF] shadow-[0_0_25px_rgba(0,217,255,0.4)] group-hover:scale-105 transition-all duration-300">
            <Zap className="h-7 w-7 text-[#071426] stroke-[2.5]" />
          </div>
          <div className="text-left">
            <span className="text-xl font-black tracking-tight text-[#F5F8FF] block leading-none">
              ENERGY <span className="text-[#00D9FF]">INTELLIGENCE</span>
            </span>
            <span className="text-[10px] font-bold tracking-wider text-[#1677FF] uppercase">
              Smart Demand Platform
            </span>
          </div>
        </Link>
        <p className="text-xs sm:text-sm font-medium text-slate-300/90 tracking-wide">
          “Predict Demand. Optimize Energy. Power the Future.”
        </p>
      </div>

      {/* Glass Card */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-lg z-10">
        <div className="relative rounded-3xl border border-[#1677FF]/35 bg-[#10243D]/85 backdrop-blur-xl p-6 sm:p-8 shadow-[0_0_40px_rgba(0,217,255,0.15),0_20px_50px_rgba(7,20,38,0.95)] overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00D9FF] to-transparent" />

          <div className="mb-6 border-b border-[#1677FF]/25 pb-4">
            <h2 className="text-lg font-bold text-[#F5F8FF]">Create New Account</h2>
            <p className="text-xs text-slate-400 mt-1">
              Join to access demand forecasting, What-If simulator, and construction planning.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#1677FF]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#1677FF]/30 bg-[#071426]/90 py-2.5 pl-10 pr-4 text-sm text-[#F5F8FF] placeholder-slate-500 focus:border-[#00D9FF] focus:outline-none focus:ring-1 focus:ring-[#00D9FF] transition-colors"
                  placeholder="e.g. Ramesh Patel"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#1677FF]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#1677FF]/30 bg-[#071426]/90 py-2.5 pl-10 pr-4 text-sm text-[#F5F8FF] placeholder-slate-500 focus:border-[#00D9FF] focus:outline-none focus:ring-1 focus:ring-[#00D9FF] transition-colors"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Phone (Optional)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#1677FF]">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#1677FF]/30 bg-[#071426]/90 py-2.5 pl-10 pr-4 text-sm text-[#F5F8FF] placeholder-slate-500 focus:border-[#00D9FF] focus:outline-none focus:ring-1 focus:ring-[#00D9FF] transition-colors"
                    placeholder="9876543210"
                  />
                </div>
              </div>
            </div>

            {/* Consumer Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Facility / Consumer Category
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#1677FF]">
                  <Building2 className="h-4 w-4" />
                </div>
                <select
                  name="consumer_type"
                  value={formData.consumer_type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#1677FF]/30 bg-[#071426]/90 py-2.5 pl-10 pr-4 text-sm text-[#F5F8FF] focus:border-[#00D9FF] focus:outline-none focus:ring-1 focus:ring-[#00D9FF] transition-colors"
                >
                  <option value="Household">Household / Residential</option>
                  <option value="Commercial">Commercial / Office</option>
                  <option value="Industrial">Industrial / Factory</option>
                  <option value="Institutional">College / Institutional</option>
                  <option value="Agriculture">Agriculture / Solar Farm</option>
                </select>
              </div>
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#1677FF]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#1677FF]/30 bg-[#071426]/90 py-2.5 pl-10 pr-10 text-sm text-[#F5F8FF] placeholder-slate-500 focus:border-[#00D9FF] focus:outline-none focus:ring-1 focus:ring-[#00D9FF] transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-[#00D9FF]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#1677FF]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirm_password"
                    required
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#1677FF]/30 bg-[#071426]/90 py-2.5 pl-10 pr-10 text-sm text-[#F5F8FF] placeholder-slate-500 focus:border-[#00D9FF] focus:outline-none focus:ring-1 focus:ring-[#00D9FF] transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-[#00D9FF]"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1677FF] via-[#00D9FF] to-[#1677FF] py-3 text-sm font-extrabold text-[#071426] shadow-lg shadow-[#1677FF]/30 hover:shadow-[#00D9FF]/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 mt-4"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#071426] border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 stroke-[2.5]" />
                  <span>Register & Access Platform</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#1677FF]/20 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[#00D9FF] hover:underline ml-1">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

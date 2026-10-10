import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Lock, Mail, AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

/**
 * Energy Intelligence — Password Recovery Page
 *
 * Theme Colors:
 * - Background: #071426 (Dark Navy)
 * - Card Surface: #10243D
 * - Electric Blue: #1677FF
 * - Energy Cyan: #00D9FF
 * - Main Text: #F5F8FF
 */
const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must contain at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });
      setSuccess(res.data.message || 'Password reset successfully! Redirecting to sign in...');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to reset password. Please check your email address.';
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
              Security & Credentials
            </span>
          </div>
        </Link>
        <p className="text-xs sm:text-sm font-medium text-slate-300/90 tracking-wide">
          “Predict Demand. Optimize Energy. Power the Future.”
        </p>
      </div>

      {/* Glass Card */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="relative rounded-3xl border border-[#1677FF]/35 bg-[#10243D]/85 backdrop-blur-xl p-6 sm:p-8 shadow-[0_0_40px_rgba(0,217,255,0.15),0_20px_50px_rgba(7,20,38,0.95)] overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00D9FF] to-transparent" />

          <div className="mb-6 border-b border-[#1677FF]/25 pb-4">
            <h2 className="text-lg font-bold text-[#F5F8FF]">Reset Your Password</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your registered email and choose a new secure password.
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
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Registered Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#1677FF]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#1677FF]/30 bg-[#071426]/90 py-2.5 pl-10 pr-4 text-sm text-[#F5F8FF] placeholder-slate-500 focus:border-[#00D9FF] focus:outline-none focus:ring-1 focus:ring-[#00D9FF] transition-colors"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                New Password (min. 6 characters)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#1677FF]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#1677FF]/30 bg-[#071426]/90 py-2.5 pl-10 pr-11 text-sm text-[#F5F8FF] placeholder-slate-500 focus:border-[#00D9FF] focus:outline-none focus:ring-1 focus:ring-[#00D9FF] transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-[#00D9FF]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#1677FF]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#1677FF]/30 bg-[#071426]/90 py-2.5 pl-10 pr-4 text-sm text-[#F5F8FF] placeholder-slate-500 focus:border-[#00D9FF] focus:outline-none focus:ring-1 focus:ring-[#00D9FF] transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1677FF] via-[#00D9FF] to-[#1677FF] py-3 text-sm font-extrabold text-[#071426] shadow-lg shadow-[#1677FF]/30 hover:shadow-[#00D9FF]/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#071426] border-t-transparent rounded-full animate-spin" />
                  Updating Password...
                </span>
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#1677FF]/20 text-center">
            <Link to="/login" className="text-xs font-bold text-[#00D9FF] hover:underline">
              ← Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

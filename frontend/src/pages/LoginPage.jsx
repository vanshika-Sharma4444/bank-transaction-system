import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../services/authService';
import { Landmark, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMsg('Please provide both email address and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMsg(getAuthErrorMessage(err, 'login'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full glass-card rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <Landmark className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Sign In to Finora</h2>
          <p className="text-xs text-slate-400">Access your secure digital banking portal</p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 gradient-btn text-slate-950 font-bold py-3.5 rounded-xl text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        {/* Footer Redirect */}
        <div className="text-center pt-2 text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-400 font-semibold hover:underline">
            Register here
          </Link>
        </div>

      </div>
    </div>
  );
};

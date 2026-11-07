import React from 'react';
import { Link } from 'react-router-dom';
import {
  Landmark,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Lock,
  Zap,
  Globe,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-24 py-8">
      
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-12 pb-16 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Digital Banking Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Institutional-Grade Banking <br className="hidden sm:block" />
            <span className="gradient-text">Engineered for Tomorrow</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Experience ultra-fast, double-entry ledger transactions, idempotent payment processing, and real-time liquidity tracking with Finora Banking.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto gradient-btn text-slate-950 font-extrabold px-8 py-4 rounded-xl text-base flex items-center justify-center space-x-3 shadow-xl shadow-emerald-500/25"
              >
                <span>Launch Banking Portal</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto gradient-btn text-slate-950 font-extrabold px-8 py-4 rounded-xl text-base flex items-center justify-center space-x-3 shadow-xl shadow-emerald-500/25"
                >
                  <span>Open Demo Account</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-200 font-semibold text-base hover:bg-slate-800 transition-colors"
                >
                  Sign In to Account
                </Link>
              </>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-slate-900 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl glass-card text-center">
              <div className="text-2xl font-extrabold text-white">100%</div>
              <div className="text-xs text-slate-400 mt-1">ACID Ledger Accuracy</div>
            </div>
            <div className="p-4 rounded-2xl glass-card text-center">
              <div className="text-2xl font-extrabold text-emerald-400">&lt; 100ms</div>
              <div className="text-xs text-slate-400 mt-1">Settlement Latency</div>
            </div>
            <div className="p-4 rounded-2xl glass-card text-center">
              <div className="text-2xl font-extrabold text-white">256-Bit</div>
              <div className="text-xs text-slate-400 mt-1">JWT Cookie Encryption</div>
            </div>
            <div className="p-4 rounded-2xl glass-card text-center">
              <div className="text-2xl font-extrabold text-emerald-400">Idempotent</div>
              <div className="text-xs text-slate-400 mt-1">Duplicate Protection</div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Interactive Preview */}
      <section id="preview" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">State-of-the-Art Banking Dashboard</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">Designed for clarity, real-time analytics, and instant double-entry accounting.</p>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Landmark className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Primary Checking Account</h3>
                <span className="text-xs text-slate-400 font-mono">ACC-••••-8942 · ACTIVE</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Available Liquidity</span>
              <div className="text-3xl font-extrabold text-emerald-400">₹ 2,45,850.00</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Monthly Credits</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-white">+ ₹ 75,000.00</div>
              <span className="text-[10px] text-emerald-400 mt-1 inline-block">12 incoming transfers</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Monthly Debits</span>
                <TrendingUp className="w-4 h-4 text-rose-400 rotate-180" />
              </div>
              <div className="text-xl font-bold text-white">- ₹ 24,150.00</div>
              <span className="text-[10px] text-rose-400 mt-1 inline-block">8 outgoing transfers</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Security Rating</span>
                <ShieldCheck className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-xl font-bold text-sky-400">100% Protected</div>
              <span className="text-[10px] text-slate-400 mt-1 inline-block">Session Token Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Enterprise Capabilities</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">Built for High Integrity Banking</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card glass-card-hover rounded-2xl p-8 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Layers className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Double-Entry Ledger</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every financial transfer generates balanced CREDIT and DEBIT immutable ledger entries in MongoDB sessions, ensuring balance integrity.
            </p>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-8 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-sky-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Idempotency Guarantee</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Unique client-generated idempotency keys prevent duplicate payments and accidental double debits even under network retries.
            </p>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-8 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white">JWT & Token Blacklisting</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Stateless authentication combined with MongoDB token blacklisting guarantees total session control upon user logout.
            </p>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-3xl p-8 sm:p-12 border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Security Architecture</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Bank-Grade Protection Standard</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Finora Banking strictly isolates backend permissions, enforces active status verification on source and destination accounts, and encrypts credentials with bcrypt hashing.
            </p>
            <ul className="space-y-3">
              {[
                'Atomic MongoDB Session Transactions',
                'Strict System User Privilege Guard Middleware',
                'Client-Side Account Masking & Data Sanitization',
                'Downloadable Signed Transaction PDF Receipts',
              ].map((item, idx) => (
                <li key={idx} className="flex items-center space-x-3 text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold text-slate-300">System Privilege Monitor</span>
              <span className="text-xs text-emerald-400 font-mono">ACTIVE</span>
            </div>
            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-900 text-emerald-400 border border-emerald-500/20">
                [AUTH] HTTP-Only Cookie Verified
              </div>
              <div className="p-3 rounded-lg bg-slate-900 text-slate-300 border border-slate-800">
                [LEDGER] Immutable double-entry trigger validated
              </div>
              <div className="p-3 rounded-lg bg-slate-900 text-sky-400 border border-sky-500/20">
                [SESSION] MongoDB Transaction Session Committed
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

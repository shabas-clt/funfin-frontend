import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || '/admin/dashboard';

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Email and password are required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/admin-auth/login', formData);
      login(res.token, res.admin);
      navigate(from, { replace: true });
    } catch (err) {
      const message = typeof err === 'string' ? err : 'Invalid email or password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-black">
      {/* Left panel — branding, hidden on small screens */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative flex-col justify-between overflow-hidden">
        {/* Gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#1a1550] to-[#0d0d1a]" />

        {/* Decorative blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-[420px] h-[420px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-60px] right-[-60px] w-[340px] h-[340px] bg-violet-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[80px]" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <img
              src="/branding/logo-dark.png"
              alt="FunFin"
              className="h-12 w-auto object-contain"
            />
          </div>
        </div>

        <div className="relative z-10 px-12 pb-16">
          <div className="mb-8">
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
              Admin Panel
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Control Centre
              </span>
            </h1>
            <p className="mt-4 text-slate-400 text-base leading-relaxed max-w-sm">
              Manage students, courses, mentors, and platform analytics from a single unified interface.
            </p>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Active Courses', val: '120+' },
              { label: 'Students', val: '72K' },
              { label: 'Revenue', val: '₹80L+' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2"
              >
                <span className="text-white font-bold text-sm">{stat.val}</span>
                <span className="text-slate-400 text-xs">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tag */}
        <div className="relative z-10 px-10 pb-6 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-500">Secured admin access — FunFin LMS</span>
        </div>
      </div>

      {/* Right panel — sign in form */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 lg:px-12 py-10 bg-black">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 self-start">
          <img
            src="/branding/logo-dark.png"
            alt="FunFin"
            className="h-10 w-auto object-contain"
          />
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1.5">
              Sign in to access your admin dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[13px] font-medium text-slate-400 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@funfin.com"
                  className="w-full bg-neutral-900 border border-neutral-800 text-white text-sm pl-10 pr-4 py-3 rounded-xl placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-medium text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-neutral-900 border border-neutral-800 text-white text-sm pl-10 pr-12 py-3 rounded-xl placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              id="signin-submit"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-xl transition-all duration-200 mt-2 shadow-lg shadow-indigo-600/20"
            >
              {isLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign in
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-slate-600 text-center mt-8 leading-relaxed">
            Access is restricted to authorized admin accounts only.
            <br />
            Contact your system administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}

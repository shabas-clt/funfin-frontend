import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import { signInSchema } from '@/lib/validation/schemas';
import { applyServerErrors } from '@/lib/validation/serverErrors';

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const from = location.state?.from?.pathname || '/admin/dashboard';

  const form = useForm({
    resolver: yupResolver(signInSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
  } = form;

  const onSubmit = async (values) => {
    setServerError('');
    clearErrors('root');
    try {
      const res = await api.post('/admin-auth/login', values);
      login(res.token, res.admin);
      navigate(from, { replace: true });
    } catch (err) {
      const fallback = applyServerErrors(form, err, 'Invalid email or password');
      if (fallback) {
        setServerError(fallback);
        toast.error(fallback);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0f2f5] dark:bg-[#0f0f0f] px-4 py-10 transition-colors">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden transition-colors">
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400" />

        <div className="px-8 py-8">
          <div className="flex justify-center mb-6">
            <img
              src="/branding/logo-light.png"
              alt="FunFin"
              className="h-14 w-auto object-contain block dark:hidden"
            />
            <img
              src="/branding/logo-dark.png"
              alt="FunFin"
              className="h-14 w-auto object-contain hidden dark:block"
            />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-1">
            Admin Login
          </h2>
          <p className="text-sm text-slate-500 text-center mb-7">
            Sign in to your admin account
          </p>

          {serverError && (
            <div className="mb-5 flex items-start gap-2.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm rounded-xl px-4 py-3">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@funfin.com"
                aria-invalid={errors.email ? 'true' : 'false'}
                className={`w-full bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white text-sm px-4 py-3 rounded-xl border transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.email
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600'
                }`}
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-500 dark:text-rose-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  className={`w-full bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white text-sm px-4 py-3 pr-11 rounded-xl border transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.password
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600'
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-500 dark:text-rose-400">{errors.password.message}</p>
              )}
            </div>

            <button
              id="signin-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-xl transition-all duration-150 mt-1"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <p className="text-xs text-slate-500 dark:text-slate-600 text-center mt-7">
            Restricted to authorized admin accounts only.
          </p>
        </div>
      </div>
    </div>
  );
}

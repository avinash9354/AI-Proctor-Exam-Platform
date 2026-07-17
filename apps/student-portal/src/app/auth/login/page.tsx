'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Shield, Mail, Lock, Eye, EyeOff, ArrowRight,
  GraduationCap, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/apiClient';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof schema>;

type RoleMode = 'student' | 'admin';

const DEMO: Record<RoleMode, { email: string; password: string; label: string }> = {
  student: { email: 'student1@examplatform.com', password: 'Student@1234', label: 'Student' },
  admin:   { email: 'admin@examplatform.com',   password: 'Admin@1234',   label: 'Admin'   },
};

export default function UnifiedLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [mode, setMode] = useState<RoleMode>('student');
  const [showPassword, setShowPassword] = useState(false);

  // Pre-select admin tab if coming from admin dashboard redirect
  useEffect(() => {
    if (searchParams.get('role') === 'admin') setMode('admin');
  }, [searchParams]);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } =
    useForm<LoginForm>({ resolver: zodResolver(schema) });

  const switchMode = (next: RoleMode) => {
    setMode(next);
    reset();
    setShowPassword(false);
  };

  const fillDemo = () => {
    setValue('email', DEMO[mode].email);
    setValue('password', DEMO[mode].password);
  };

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await apiClient.post('/auth/login', data);
      const { user, accessToken, refreshToken } = res.data.data;

      if (mode === 'admin' && !['admin', 'super_admin', 'teacher'].includes(user.role)) {
        toast.error('Access denied. Admin or Teacher account required.');
        return;
      }
      if (mode === 'student' && !['student'].includes(user.role)) {
        toast.error('Please use the Admin/Teacher tab for this account.');
        return;
      }

      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome, ${user.name}! 🎉`);

      if (['admin', 'super_admin', 'teacher'].includes(user.role)) {
        // Pass auth via URL params to admin dashboard callback page
        // (localStorage is NOT shared between different ports)
        const params = new URLSearchParams({
          token: accessToken,
          refresh: refreshToken || '',
          user: btoa(JSON.stringify(user)),
        });
        window.location.href = `http://localhost:3001/auth/callback?${params.toString()}`;
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed';
      toast.error(message);
    }
  };

  const isAdmin = mode === 'admin';

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'radial-gradient(ellipse at 60% 40%, #0d1b40 0%, #0a0e1a 70%)' }}
    >
      <div className="w-full max-w-md">
        {/* ── Logo ─────────────────────────────────── */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, #4c7ef3 0%, #7c3aed 100%)',
              boxShadow: '0 0 48px rgba(76,126,243,0.45)',
            }}
          >
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold gradient-text tracking-tight">ExamGuard</h1>
          <p className="text-[#8892b0] mt-1 text-sm">AI-Powered Secure Examination Platform</p>
        </div>

        {/* ── Role Switcher ─────────────────────────── */}
        <div
          className="flex rounded-2xl p-1 mb-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {(['student', 'admin'] as RoleMode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              id={`tab-${m}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
              style={
                mode === m
                  ? {
                      background: 'linear-gradient(135deg, #4c7ef3 0%, #7c3aed 100%)',
                      color: '#fff',
                      boxShadow: '0 4px 20px rgba(76,126,243,0.35)',
                    }
                  : { color: '#8892b0' }
              }
            >
              {m === 'student'
                ? <><GraduationCap className="w-4 h-4" /> Student</>
                : <><Users className="w-4 h-4" /> Admin / Teacher</>}
            </button>
          ))}
        </div>

        {/* ── Card ──────────────────────────────────── */}
        <div
          className="rounded-2xl p-7"
          style={{
            background: 'rgba(15,22,41,0.85)',
            border: '1px solid rgba(76,126,243,0.18)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 8px 48px rgba(0,0,0,0.5)',
          }}
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#e8eaf6]">
              {isAdmin ? 'Admin / Teacher Sign In' : 'Student Sign In'}
            </h2>
            {!isAdmin && (
              <p className="text-sm text-[#8892b0] mt-1">
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" className="text-[#4c7ef3] hover:underline font-medium">
                  Create one
                </Link>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5568]" />
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder={isAdmin ? 'admin@examplatform.com' : 'student@example.com'}
                  className="input pl-10"
                  id="login-email"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5568]" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input pl-10 pr-10"
                  id="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5568] hover:text-[#8892b0] transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              id="login-submit-btn"
              className="btn-primary w-full py-3 gap-2 mt-2"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div
            className="mt-5 p-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#8892b0]">Demo Credentials</p>
              <button
                onClick={fillDemo}
                id="fill-demo-btn"
                className="text-xs text-[#4c7ef3] hover:text-[#7c3aed] transition-colors font-medium"
              >
                Auto-fill →
              </button>
            </div>
            <div className="space-y-1 text-xs text-[#4a5568]">
              <p>
                <span className="text-[#4c7ef3]">{DEMO[mode].email}</span>
              </p>
              <p>Password: <span className="text-[#a0aec0]">{DEMO[mode].password}</span></p>
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-[#4a5568] mt-6">
          {isAdmin
            ? 'Students should use the Student tab to sign in.'
            : 'Admin & Teachers should switch to the Admin / Teacher tab.'}
        </p>
      </div>
    </div>
  );
}

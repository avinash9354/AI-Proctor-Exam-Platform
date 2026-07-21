'use client';
import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Shield, Mail, Lock, Eye, EyeOff, ArrowRight,
  Sparkles, CheckCircle2, AlertTriangle, ExternalLink, GraduationCap, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/apiClient';
import { signInWithGoogleFirebase, isFirebaseConfigured } from '@/lib/firebase';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof schema>;

type RoleMode = 'student' | 'admin';

function UnifiedLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [mode, setMode] = useState<RoleMode>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [firebaseErrorModal, setFirebaseErrorModal] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('role') === 'admin') setMode('admin');
  }, [searchParams]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<LoginForm>({ resolver: zodResolver(schema) });

  const switchMode = (next: RoleMode) => {
    setMode(next);
    reset();
    setShowPassword(false);
  };

  const handleDemoLogin = () => {
    if (mode === 'admin') {
      const demoUser = {
        id: 'demo-admin-usr',
        email: 'admin@demo.com',
        name: 'Demo Teacher / Admin',
        role: 'admin',
      };
      setAuth(demoUser, 'demo-jwt-token', 'demo-jwt-refresh');
      toast.success('Entering Demo Mode as Admin/Teacher! 🎉');
      const params = new URLSearchParams({
        token: 'demo-jwt-token',
        refresh: 'demo-jwt-refresh',
        user: btoa(JSON.stringify(demoUser)),
      });
      const adminUrl = process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL || 'http://localhost:3001';
      window.location.href = `${adminUrl}/auth/callback?${params.toString()}`;
    } else {
      const demoUser = {
        id: 'demo-student-usr',
        email: 'student@demo.com',
        name: 'Demo Student',
        role: 'student',
        rollNumber: 'DEMO-2026',
      };
      setAuth(demoUser, 'demo-jwt-token', 'demo-jwt-refresh');
      toast.success('Entering Demo Mode as Student! 🎉');
      router.push('/dashboard');
    }
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
        const params = new URLSearchParams({
          token: accessToken,
          refresh: refreshToken || '',
          user: btoa(JSON.stringify(user)),
        });
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL || 'http://localhost:3001';
        window.location.href = `${adminUrl}/auth/callback?${params.toString()}`;
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: unknown } }; code?: string; message?: string };
      const isNetworkError = !axiosErr.response || axiosErr.code === 'ERR_NETWORK' || axiosErr.message === 'Network Error';
      if (isNetworkError) {
        toast.error('Backend server offline. Auto-launching in Demo Mode! ⚡');
        handleDemoLogin();
        return;
      }
      const rawError = axiosErr?.response?.data?.error;
      const message = typeof rawError === 'string' ? rawError : (rawError ? JSON.stringify(rawError) : 'Login failed');
      toast.error(message);
    }
  };

  const isAdmin = mode === 'admin';

  const handleFirebaseGoogleLogin = async () => {
    if (!isFirebaseConfigured()) {
      setShowFirebaseModal(true);
      return;
    }
    setIsFirebaseLoading(true);
    try {
      const cred = await signInWithGoogleFirebase();
      const fbUser = cred.user;
      if (!fbUser || !fbUser.email) {
        toast.error('Could not retrieve email from Google Account.');
        setIsFirebaseLoading(false);
        return;
      }

      const payload = {
        email: fbUser.email,
        name: fbUser.displayName || fbUser.email.split('@')[0],
        firebaseUid: fbUser.uid,
        photoUrl: fbUser.photoURL || undefined,
        role: mode,
      };

      const res = await apiClient.post('/auth/firebase-login', payload);
      const { user, accessToken, refreshToken } = res.data.data;

      if (mode === 'admin' && !['admin', 'super_admin', 'teacher'].includes(user.role)) {
        toast.error('Access denied. Admin or Teacher account required.');
        setIsFirebaseLoading(false);
        return;
      }
      if (mode === 'student' && !['student'].includes(user.role)) {
        toast.error('Please use the Admin/Teacher tab for this account.');
        setIsFirebaseLoading(false);
        return;
      }

      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome, ${user.name}! 🎉`);

      if (['admin', 'super_admin', 'teacher'].includes(user.role)) {
        const params = new URLSearchParams({
          token: accessToken,
          refresh: refreshToken || '',
          user: btoa(JSON.stringify(user)),
        });
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL || 'http://localhost:3001';
        window.location.href = `${adminUrl}/auth/callback?${params.toString()}`;
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      console.error('Firebase login error:', err);
      const rawError = (err as { response?: { data?: { error?: unknown } }; message?: unknown })?.response?.data?.error || (err as { message?: unknown })?.message;
      const message = typeof rawError === 'string' ? rawError : (rawError ? JSON.stringify(rawError) : 'Firebase Google sign-in failed');
      toast.error(message);
      if (
        typeof message === 'string' &&
        (message.includes('auth/internal-error') ||
          message.includes('auth/operation-not-allowed') ||
          message.includes('auth/unauthorized-domain'))
      ) {
        setFirebaseErrorModal(message);
      }
    } finally {
      setIsFirebaseLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden"
      style={{
        backgroundColor: '#f8f6f0',
        backgroundImage: 'radial-gradient(#e5e0d8 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Soft warm orange ambient glow */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Split Card Container */}
      <div className="w-full max-w-[1040px] grid grid-cols-1 lg:grid-cols-12 rounded-2xl sm:rounded-3xl md:rounded-[2.25rem] overflow-hidden shadow-2xl shadow-orange-950/10 border border-gray-200/80 bg-white relative z-10 animate-fadeIn">

        {/* ── Left Dark Half (Brand & Command Center) ──────────────── */}
        <div className="lg:col-span-6 bg-[#060814] p-6 sm:p-8 md:p-12 flex flex-col justify-between min-h-[380px] sm:min-h-[440px] lg:min-h-[460px] relative overflow-hidden text-white">
          {/* Subtle concentric circular wireframe art in background */}
          <div className="absolute -top-24 -right-24 w-[420px] h-[420px] border border-orange-500/10 rounded-full pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-[320px] h-[320px] border border-orange-500/10 rounded-full pointer-events-none" />
          <div className="absolute -top-2 -right-2 w-[220px] h-[220px] border border-orange-500/15 rounded-full pointer-events-none" />

          {/* Top Brand & Subtitle */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#f97316] to-[#ea580c] flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight leading-none">ExamGuard</h2>
              <span className="text-[11px] font-semibold tracking-widest uppercase text-orange-400 mt-1 block">
                {isAdmin ? 'ADMIN CONTROL' : 'STUDENT PORTAL'}
              </span>
            </div>
          </div>

          {/* Middle Hero Statement */}
          <div className="my-auto py-8 relative z-10">
            <span className="text-xs font-bold tracking-widest uppercase text-[#f97316] block mb-3">
              {isAdmin ? 'SECURE OPERATIONS' : 'INTELLIGENT PROCTORING'}
            </span>
            <h1 className="text-3xl md:text-[38px] font-extrabold text-white tracking-tight leading-[1.15] mb-4">
              {isAdmin
                ? 'Every exam signal, in one calm command center.'
                : 'Your AI-powered secure examination environment.'}
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              {isAdmin
                ? 'Real-time proctoring feeds, AI integrity risk scores, and automated proctor oversight across all active exams.'
                : 'Experience seamless AI proctoring with 360° integrity monitoring, instant verification, and calm focus.'}
            </p>
          </div>

          {/* Bottom Feature Tags */}
          <div className="flex flex-wrap gap-2 pt-4 relative z-10">
            {isAdmin ? (
              <>
                <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
                  Live monitoring
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
                  Risk review
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
                  Exam scheduling
                </span>
              </>
            ) : (
              <>
                <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
                  AI Face Tracking
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
                  360° Anti-Cheat
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
                  Instant Results
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── Right White Half (Login Form & Switcher) ────────────── */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-8 md:p-12 flex flex-col justify-center relative">

          {/* Top Role Mode Switcher Tabs */}
          <div className="flex bg-gray-100/90 p-1.5 rounded-2xl mb-8 border border-gray-200/60">
            <button
              type="button"
              onClick={() => switchMode('student')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs md:text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'student'
                ? 'bg-white text-gray-900 shadow-md font-bold'
                : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Portal</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode('admin')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs md:text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'admin'
                ? 'bg-white text-gray-900 shadow-md font-bold'
                : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              <Users className="w-4 h-4" />
              <span>Admin & Teacher</span>
            </button>
          </div>

          {/* Subheader & Icon */}
          <div className="mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#ea580c] mb-4 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#ea580c] block mb-1">
              DASHBOARD ACCESS
            </span>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              Welcome back
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Open the deployed demo dashboard directly, sign in via Google Firebase, or enter your registered credentials.
            </p>
          </div>

          {/* Firebase Google Sign-In Button */}
          <button
            type="button"
            onClick={handleFirebaseGoogleLogin}
            disabled={isFirebaseLoading || isSubmitting}
            className="w-full py-3 px-4 mb-5 rounded-xl flex items-center justify-center gap-3 font-semibold text-gray-700 bg-white border border-gray-200/90 shadow-sm hover:bg-gray-50 hover:border-gray-300 active:scale-[0.99] transition-all text-sm"
          >
            {isFirebaseLoading ? (
              <span className="w-5 h-5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.3 8.9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                  <path fill="#FBBC05" d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7.1C.6 9.1 0 10.7 0 12.3s.6 3.2 1.6 5.2l3.7-2.7z" />
                  <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16.3C3.5 20.1 7.4 23.5 12 23.5z" />
                </svg>
                <span>Sign in with Google </span>
              </>
            )}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">OR WITH EMAIL</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  id="login-email"
                  placeholder={isAdmin ? 'admin@examplatform.com' : 'student@example.com'}
                  className="w-full py-3 pl-10 pr-4 rounded-xl text-sm text-gray-900 bg-gray-50/70 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ea580c] focus:bg-white transition-all"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  placeholder="••••••••"
                  className="w-full py-3 pl-10 pr-10 rounded-xl text-sm text-gray-900 bg-gray-50/70 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ea580c] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              id="login-submit-btn"
              className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 disabled:opacity-50 mt-2 text-sm"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Instant Demo Mode Button (exact same style as screenshot orange button) */}
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-3 px-6 rounded-xl font-bold text-[#ea580c] bg-[#fff7ed] hover:bg-[#ffedd5] border border-orange-200 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm mt-1"
            >
              <span>Enter demo dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Create Account Prominent Card */}
          <div className="mt-6 p-4 rounded-2xl bg-orange-50/70 border border-orange-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="text-center sm:text-left">
              <span className="font-bold text-gray-900 text-xs md:text-sm block">Don&apos;t have an account?</span>
              <span className="text-[11px] md:text-xs text-gray-600">Register now to access the student portal</span>
            </div>
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#ea580c] hover:bg-[#c2410c] active:scale-[0.99] transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>Create Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-center text-[11px] text-gray-400 mt-4">
            Demo mode stores the session only in this browser.
          </p>
        </div>

      </div>

      {/* ── Firebase Guidance Modal ──────────────────── */}
      {showFirebaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full p-6 rounded-2xl bg-white border border-gray-200 shadow-2xl space-y-4 text-gray-900">
            <div className="flex items-center gap-3 text-[#ea580c]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold">Firebase Keys Required</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              To enable live Google Sign-In via Firebase, copy your Firebase credentials from{' '}
              <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-[#ea580c] hover:underline font-semibold">
                console.firebase.google.com
              </a>{' '}
              and add them to <code className="bg-gray-100 px-1.5 py-0.5 rounded text-orange-600">.env.local</code>:
            </p>
            <div className="bg-gray-900 p-3 rounded-xl font-mono text-xs text-gray-300 overflow-x-auto space-y-1">
              <div>NEXT_PUBLIC_FIREBASE_API_KEY=&quot;your_key&quot;</div>
              <div>NEXT_PUBLIC_FIREBASE_PROJECT_ID=&quot;your_project_id&quot;</div>
            </div>
            <p className="text-xs text-gray-500">
              You can also continue using Email/Password authentication or click &quot;Enter demo dashboard&quot; right now!
            </p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowFirebaseModal(false)}
                className="py-2 px-5 bg-[#ea580c] text-white rounded-xl text-sm font-semibold shadow-md shadow-orange-500/20"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Firebase Error Guidance Modal ───────────── */}
      {firebaseErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-lg w-full p-6 rounded-2xl bg-white border border-orange-200 shadow-2xl space-y-4 text-left text-gray-900">
            <div className="flex items-center gap-3 text-[#ea580c] border-b border-gray-100 pb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-lg font-bold">Google Sign-In Setup Required</h3>
                <p className="text-xs text-gray-500 font-mono">{firebaseErrorModal}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
              <p className="font-semibold text-gray-900">Why did this occur?</p>
              <p>
                The error occurs when your Firebase API key is connected, but <strong>Google Sign-In</strong> is not yet enabled inside your Firebase Console project.
              </p>

              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-2 text-xs text-gray-800">
                <p className="font-bold text-[#ea580c]">⚡ How to fix in 3 quick steps:</p>
                <ol className="list-decimal list-inside space-y-1.5 font-medium">
                  <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-[#ea580c] hover:underline font-bold">console.firebase.google.com</a> &amp; select your project.</li>
                  <li>Navigate to <strong>Authentication</strong> &rarr; <strong>Sign-in method</strong> tab.</li>
                  <li>Click <strong>Add new provider</strong> &rarr; Select <strong>Google</strong> &rarr; Toggle <strong>Enable</strong> &amp; click <strong>Save</strong>.</li>
                </ol>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setFirebaseErrorModal(null)}
                className="py-2.5 px-6 bg-[#ea580c] text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/25"
              >
                Got it! I will check Firebase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UnifiedLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-700 font-mono">Loading...</div>}>
      <UnifiedLoginContent />
    </Suspense>
  );
}

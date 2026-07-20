'use client';
import { useState, useEffect, Suspense } from 'react';
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
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL || 'http://localhost:3001';
        window.location.href = `${adminUrl}/auth/callback?${params.toString()}`;
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const rawError = (err as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
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

          {/* ── Firebase Google Sign-In Button ───────── */}
          <button
            type="button"
            onClick={handleFirebaseGoogleLogin}
            disabled={isFirebaseLoading || isSubmitting}
            className="w-full py-3 px-4 mb-4 rounded-xl flex items-center justify-center gap-3 font-semibold text-[#e8eaf6] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            }}
          >
            {isFirebaseLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.3 8.9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                  <path fill="#FBBC05" d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7.1C.6 9.1 0 10.7 0 12.3s.6 3.2 1.6 5.2l3.7-2.7z" />
                  <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16.3C3.5 20.1 7.4 23.5 12 23.5z" />
                </svg>
                <span>Sign in with Google (Firebase)</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-[#8892b0] font-medium">OR CONTINUE WITH EMAIL</span>
            <div className="flex-1 h-px bg-white/10" />
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
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-[#4a5568] mt-6">
          {isAdmin
            ? 'Students should use the Student tab to sign in.'
            : 'Admin & Teachers should switch to the Admin / Teacher tab.'}
        </p>

        {/* Firebase Setup Modal */}
        {showFirebaseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="max-w-md w-full p-6 rounded-2xl bg-[#0f1629] border border-[#4c7ef3]/30 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-amber-400">
                <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-bold text-white">Firebase Keys Required</h3>
              </div>
              <p className="text-sm text-[#a0aec0] leading-relaxed">
                To enable live Google Sign-In via Firebase, copy your Firebase credentials from{' '}
                <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-[#4c7ef3] hover:underline font-semibold">
                  console.firebase.google.com
                </a>{' '}
                and add them to <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-300">apps/student-portal/.env.local</code>:
              </p>
              <div className="bg-black/40 p-3 rounded-lg font-mono text-xs text-[#8892b0] overflow-x-auto border border-white/5 space-y-1">
                <div>NEXT_PUBLIC_FIREBASE_API_KEY=&quot;your_key&quot;</div>
                <div>NEXT_PUBLIC_FIREBASE_PROJECT_ID=&quot;your_project_id&quot;</div>
                <div>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=&quot;...&quot;</div>
              </div>
              <p className="text-xs text-[#8892b0]">
                You can also continue using standard email/password authentication right now while setting up your Firebase console!
              </p>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowFirebaseModal(false)}
                  className="btn-primary px-5 py-2 text-sm font-semibold"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Firebase Error Guidance Modal */}
        {firebaseErrorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="max-w-lg w-full p-6 rounded-2xl bg-[#0f1629] border-2 border-amber-500/50 shadow-2xl space-y-4 text-left">
              <div className="flex items-center gap-3 text-amber-400 border-b border-white/10 pb-3">
                <svg className="w-7 h-7 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="text-lg font-bold text-white">Firebase Google Sign-In Setup Required</h3>
                  <p className="text-xs text-amber-300 font-mono">{firebaseErrorModal}</p>
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-[#a0aec0] leading-relaxed">
                <p className="font-semibold text-white">Why did this error occur?</p>
                <p>
                  The error <code className="bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded text-xs">auth/internal-error</code> occurs when your Firebase API key is connected, but <strong>Google Sign-In</strong> is not yet enabled inside your Firebase Console project (<code className="text-[#4c7ef3]">ai-proctor-exam-platform</code>).
                </p>

                <div className="bg-black/50 p-4 rounded-xl border border-white/10 space-y-2 text-xs">
                  <p className="font-bold text-amber-400">⚡ How to fix in 3 quick steps:</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-[#e8eaf6]">
                    <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-[#4c7ef3] hover:underline font-semibold">console.firebase.google.com</a> &amp; select your project.</li>
                    <li>Navigate to <strong>Authentication</strong> &rarr; <strong>Sign-in method</strong> tab.</li>
                    <li>Click <strong>Add new provider</strong> &rarr; Select <strong>Google</strong> &rarr; Toggle <strong>Enable</strong> &rarr; Select your <strong>Project support email</strong> &amp; click <strong>Save</strong>.</li>
                  </ol>
                </div>

                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
                  <p className="text-xs font-semibold text-emerald-400 mb-1">💡 Immediate Alternative (Real Database Sign-In):</p>
                  <p className="text-xs text-[#8892b0]">
                    You don&apos;t have to wait! You can log in right now using standard Email/Password accounts from your database:
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="bg-black/40 p-1.5 rounded border border-white/5 text-[#e8eaf6]">
                      <span className="text-emerald-300 font-sans font-bold">Student Account:</span><br/>
                      student1@examplatform.com<br/>
                      Pass: Student@1234
                    </div>
                    <div className="bg-black/40 p-1.5 rounded border border-white/5 text-[#e8eaf6]">
                      <span className="text-emerald-300 font-sans font-bold">Admin Account:</span><br/>
                      admin@examplatform.com<br/>
                      Pass: Admin@1234
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setFirebaseErrorModal(null)}
                  className="btn-primary px-6 py-2.5 text-sm font-semibold shadow-lg shadow-[#4c7ef3]/30"
                >
                  Got it! I will check Firebase / Use Email
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnifiedLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white font-mono">Loading...</div>}>
      <UnifiedLoginContent />
    </Suspense>
  );
}

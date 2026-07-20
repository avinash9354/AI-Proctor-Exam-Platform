'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { authClient } from '@/lib/apiClient';
import { signInWithGoogleFirebase, isFirebaseConfigured } from '@/lib/firebase';
import { Shield, Lock, Mail, ArrowRight, Eye, EyeOff, GraduationCap, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';

type RoleMode = 'student' | 'admin';

function CombinedLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAdminAuthStore();

  const [mode, setMode] = useState<RoleMode>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'student' || roleParam === 'admin') {
      setMode(roleParam as RoleMode);
    }
  }, [searchParams]);

  const switchMode = (nextMode: RoleMode) => {
    setMode(nextMode);
    setError('');
    setEmail('');
    setPassword('');
  };

  const handleDemoLogin = () => {
    if (mode === 'admin') {
      const demoUser = {
        id: 'demo-admin-1',
        email: email || 'admin@demo.com',
        name: 'Demo Teacher / Admin',
        role: 'admin',
        department: 'Computer Science',
      };
      setAuth(demoUser, 'demo-jwt-access-token', 'demo-jwt-refresh-token');
      toast.success('Entering Demo Mode as Admin/Teacher! 🎉');
      router.replace('/dashboard');
    } else {
      const demoUser = {
        id: 'demo-student-1',
        email: email || 'student@demo.com',
        name: 'Demo Student',
        role: 'student',
      };
      toast.success('Redirecting to Student Portal Demo...');
      const studentUrl = process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL || 'http://localhost:3000';
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && studentUrl.includes('localhost')) {
        toast.error('Note: Student Portal URL not set in Netlify Environment Variables. Please set NEXT_PUBLIC_STUDENT_PORTAL_URL.');
      } else {
        window.location.href = `${studentUrl}/auth/login?role=student`;
      }
    }
  };

  const handleFirebaseGoogleLogin = async () => {
    if (!isFirebaseConfigured()) {
      setShowFirebaseModal(true);
      return;
    }
    setIsFirebaseLoading(true);
    setError('');
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

      const res = await authClient.post('/auth/firebase-login', payload);
      const { user, accessToken, refreshToken } = res.data.data;

      if (mode === 'admin') {
        if (!['admin', 'super_admin', 'teacher'].includes(user.role)) {
          setError('Access denied. Admin or Teacher account required.');
          setIsFirebaseLoading(false);
          return;
        }
        setAuth(user, accessToken, refreshToken || '');
        toast.success(`Welcome, ${user.name}! 🎉`);
        router.replace('/dashboard');
      } else {
        const studentUrl = process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL || 'http://localhost:3000';
        window.location.href = `${studentUrl}/auth/login?role=student`;
      }
    } catch (err: any) {
      console.error('Firebase login error:', err);
      const rawMsg = err.response?.data?.error || err.message || 'Firebase Google sign-in failed';
      setError(typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg));
    } finally {
      setIsFirebaseLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await authClient.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = res.data.data;

      if (mode === 'admin') {
        if (!['admin', 'super_admin', 'teacher'].includes(user.role)) {
          setError('Access denied. Admin or Teacher account required.');
          setIsLoading(false);
          return;
        }
        setAuth(user, accessToken, refreshToken || '');
        toast.success(`Welcome, ${user.name}! 🎉`);
        router.replace('/dashboard');
      } else {
        const studentUrl = process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL || 'http://localhost:3000';
        window.location.href = `${studentUrl}/auth/login?role=student`;
      }
    } catch (err: any) {
      const isNetworkError = !err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error';
      if (isNetworkError) {
        toast.error('Backend server unreachable. Auto-launching in Demo Mode! ⚡');
        handleDemoLogin();
        return;
      }
      const rawMsg = err.response?.data?.error || err.message || 'Login failed';
      setError(typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg));
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #0f1629 0%, #0a0e1a 100%)' }}
    >
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4c7ef3]/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#8b5cf6]/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#4c7ef3] to-[#8b5cf6] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#4c7ef3]/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ExamGuard Portal</h1>
          <p className="text-sm text-[#8892b0] mt-1">Unified AI-Proctoring & Exam Management</p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 mb-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
          <button
            type="button"
            onClick={() => switchMode('student')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
              mode === 'student'
                ? 'bg-gradient-to-r from-[#4c7ef3] to-[#3a68d8] text-white shadow-md'
                : 'text-[#8892b0] hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('admin')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
              mode === 'admin'
                ? 'bg-gradient-to-r from-[#4c7ef3] to-[#3a68d8] text-white shadow-md'
                : 'text-[#8892b0] hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Admin / Teacher</span>
          </button>
        </div>

        {/* Login Card */}
        <div
          className="rounded-2xl p-7 shadow-2xl transition-all"
          style={{
            background: 'rgba(15, 22, 41, 0.85)',
            border: '1px solid rgba(76, 126, 243, 0.18)',
            backdropFilter: 'blur(24px)',
          }}
        >
          <div className="mb-5 text-center">
            <h2 className="text-lg font-bold text-white">
              {mode === 'admin' ? 'Admin / Teacher Sign In' : 'Student Sign In'}
            </h2>
            <p className="text-xs text-[#8892b0] mt-0.5">
              {mode === 'admin'
                ? 'Access live monitoring, risk review, and settings'
                : 'Take AI-proctored exams and view your results'}
            </p>
          </div>

          {/* Firebase Google Login Button */}
          <button
            type="button"
            onClick={handleFirebaseGoogleLogin}
            disabled={isFirebaseLoading || isLoading}
            className="w-full py-3 px-4 mb-4 rounded-xl flex items-center justify-center gap-3 font-semibold text-white transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
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
                <span className="text-sm">Sign in with Google (Firebase)</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-[#8892b0] font-bold tracking-wider uppercase">OR EMAIL & PASSWORD</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8892b0] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5568]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === 'admin' ? 'admin@examplatform.com' : 'student@example.com'}
                  className="w-full py-3 pl-10 pr-4 rounded-xl text-sm text-white placeholder-[#4a5568] focus:outline-none focus:ring-2 focus:ring-[#4c7ef3] transition-all"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8892b0] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5568]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-3 pl-10 pr-10 rounded-xl text-sm text-white placeholder-[#4a5568] focus:outline-none focus:ring-2 focus:ring-[#4c7ef3] transition-all"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a5568] hover:text-[#8892b0] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isFirebaseLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#4c7ef3] to-[#3a68d8] hover:from-[#5a8bf8] hover:to-[#4c7ef3] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#4c7ef3]/25 disabled:opacity-50 mt-2 text-sm"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as {mode === 'admin' ? 'Admin / Teacher' : 'Student'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-medium text-xs text-[#10b981] transition-all duration-300 hover:bg-[#10b981]/10 border border-[#10b981]/30"
            >
              ⚡ Instant Demo Login ({mode === 'admin' ? 'Admin' : 'Student'} Mode - No Backend Needed)
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#4a5568] mt-6">
          Authorized personnel only. All login activities are securely encrypted.
        </p>
      </div>

      {/* Firebase Setup Modal if not configured */}
      {showFirebaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-md rounded-2xl p-6 relative border border-[#4c7ef3]/30 shadow-2xl"
            style={{ background: '#0f1629' }}
          >
            <button
              onClick={() => setShowFirebaseModal(false)}
              className="absolute right-4 top-4 text-[#8892b0] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#4c7ef3]" /> Firebase Setup Required
            </h3>
            <p className="text-xs text-[#8892b0] mb-4">
              To use Google Sign-In, please add your Firebase credentials in your Netlify Environment Variables:
            </p>
            <div className="bg-black/50 p-3 rounded-xl border border-white/10 space-y-1.5 font-mono text-[11px] text-[#e8eaf6] mb-4">
              <p>NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key</p>
              <p>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain</p>
              <p>NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project</p>
            </div>
            <p className="text-xs text-emerald-400 mb-4 font-semibold">
              💡 Or click &quot;Instant Demo Login&quot; above to log in immediately right now!
            </p>
            <button
              onClick={() => setShowFirebaseModal(false)}
              className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-[#4c7ef3] hover:bg-[#3a68d8] transition-all"
            >
              Got it, I will use Email / Demo Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CombinedLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center text-white text-sm">Loading ExamGuard Portal...</div>}>
      <CombinedLoginContent />
    </Suspense>
  );
}


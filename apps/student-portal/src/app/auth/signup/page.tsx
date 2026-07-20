'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, User, Hash, Building, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/apiClient';
import { signInWithGoogleFirebase, isFirebaseConfigured } from '@/lib/firebase';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rollNumber: z.string().optional(),
  department: z.string().optional(),
  semester: z.coerce.number().int().min(1).max(12).optional(),
});

type SignupForm = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [firebaseErrorModal, setFirebaseErrorModal] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: SignupForm) => {
    try {
      const res = await apiClient.post('/auth/signup', { ...data, role: 'student' });
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Welcome to ExamGuard!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (status === 409 || (typeof message === 'string' && message.includes('Email already registered'))) {
        try {
          toast.loading('Checking existing account...');
          const loginRes = await apiClient.post('/auth/login', { email: data.email, password: data.password });
          toast.dismiss();
          const { user, accessToken, refreshToken } = loginRes.data.data;
          setAuth(user, accessToken, refreshToken);
          toast.success(`Welcome back, ${user.name}!`);
          router.push('/dashboard');
          return;
        } catch {
          toast.dismiss();
          toast.error('Email already registered. Please sign in or enter correct password.');
          router.push('/auth/login');
          return;
        }
      }
      toast.error(typeof message === 'string' ? message : 'Signup failed');
    }
  };

  const handleFirebaseGoogleSignup = async () => {
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
        role: 'student',
      };

      const res = await apiClient.post('/auth/firebase-login', payload);
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome to ExamGuard via Firebase, ${user.name}! 🎉`);
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Firebase signup error:', err);
      const rawError = (err as { response?: { data?: { error?: unknown } }; message?: unknown })?.response?.data?.error || (err as { message?: unknown })?.message;
      const message = typeof rawError === 'string' ? rawError : (rawError ? JSON.stringify(rawError) : 'Firebase Google sign-up failed');
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-mesh">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4c7ef3] to-[#7c3aed] flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Create Account</h1>
          <p className="text-sm text-[#8892b0] mt-1">ExamGuard Student Portal</p>
        </div>

        <div className="card-glow">
          <p className="text-sm text-[#8892b0] mb-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#4c7ef3] hover:underline font-medium">Sign in</Link>
          </p>

          {/* ── Firebase Google Sign-Up Button ───────── */}
          <button
            type="button"
            onClick={handleFirebaseGoogleSignup}
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
                <span>Sign up with Google (Firebase)</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-[#8892b0] font-medium">OR REGISTER WITH EMAIL</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5568]" />
                <input {...register('name')} placeholder="Your full name" className="input pl-10" id="name" />
              </div>
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5568]" />
                <input {...register('email')} type="email" placeholder="student@example.com" className="input pl-10" id="signup-email" />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5568]" />
                <input {...register('password')} type="password" placeholder="Min 8 characters" className="input pl-10" id="signup-password" />
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Roll Number</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5568]" />
                  <input {...register('rollNumber')} placeholder="CS2024001" className="input pl-10" id="roll-number" />
                </div>
              </div>
              <div>
                <label className="label">Semester</label>
                <input {...register('semester')} type="number" min={1} max={12} placeholder="6" className="input" id="semester" />
              </div>
            </div>

            <div>
              <label className="label">Department</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5568]" />
                <input {...register('department')} placeholder="Computer Science" className="input pl-10" id="department" />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 gap-2" id="signup-submit">
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>

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
                You can also continue using standard email/password registration right now while setting up your Firebase console!
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
                    You don&apos;t have to wait! You can sign up / log in right now using standard Email/Password accounts:
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

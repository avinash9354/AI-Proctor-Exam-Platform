'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { authClient } from '@/lib/apiClient';
import { Shield, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const { setAuth } = useAdminAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDemoLogin = () => {
    const demoUser = {
      id: 'demo-admin-1',
      email: email || 'admin@demo.com',
      name: 'Demo Teacher / Admin',
      role: 'admin',
      department: 'Computer Science',
    };
    setAuth(demoUser, 'demo-jwt-access-token', 'demo-jwt-refresh-token');
    router.replace('/dashboard');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await authClient.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = res.data.data;

      if (!['admin', 'super_admin', 'teacher'].includes(user.role)) {
        setError('Access denied. Admin or Teacher account required.');
        setIsLoading(false);
        return;
      }

      setAuth(user, accessToken, refreshToken || '');
      router.replace('/dashboard');
    } catch (err: any) {
      const isNetworkError = !err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error';
      if (isNetworkError) {
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
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#4c7ef3] to-[#8b5cf6] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#4c7ef3]/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin & Teacher Portal</h1>
          <p className="text-sm text-[#8892b0] mt-1">AI-Proctor Exam Management System</p>
        </div>

        {/* Login Card */}
        <div
          className="rounded-2xl p-7 shadow-2xl"
          style={{
            background: 'rgba(15, 22, 41, 0.85)',
            border: '1px solid rgba(76, 126, 243, 0.18)',
            backdropFilter: 'blur(24px)',
          }}
        >
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
                  placeholder="admin@examplatform.com"
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
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#4c7ef3] to-[#3a68d8] hover:from-[#5a8bf8] hover:to-[#4c7ef3] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#4c7ef3]/25 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-medium text-xs text-[#10b981] transition-all duration-300 hover:bg-[#10b981]/10 border border-[#10b981]/30"
            >
              ⚡ Instant Demo Login (No Backend Needed)
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#4a5568] mt-6">
          Authorized personnel only. All access is logged and monitored.
        </p>
      </div>
    </div>
  );
}

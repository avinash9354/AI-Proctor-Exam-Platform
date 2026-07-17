'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { Shield } from 'lucide-react';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAdminAuthStore();
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const token = searchParams.get('token');
      const refresh = searchParams.get('refresh');
      const userEncoded = searchParams.get('user');

      if (!token || !userEncoded) {
        setError('Invalid login session. Please login again.');
        setTimeout(() => { window.location.href = 'http://localhost:3000/auth/login?role=admin'; }, 2000);
        return;
      }

      const user = JSON.parse(atob(userEncoded));

      // Verify admin/teacher role
      if (!['admin', 'super_admin', 'teacher'].includes(user.role)) {
        setError('Access denied. Admin or Teacher account required.');
        setTimeout(() => { window.location.href = 'http://localhost:3000/auth/login?role=admin'; }, 2000);
        return;
      }

      // Set admin auth store — same origin so it works
      setAuth(user, token, refresh || '');

      // Redirect to dashboard
      router.replace('/dashboard');
    } catch {
      setError('Login failed. Please try again.');
      setTimeout(() => { window.location.href = 'http://localhost:3000/auth/login?role=admin'; }, 2000);
    }
  }, [searchParams, setAuth, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #0f1629 0%, #0a0e1a 100%)' }}
    >
      <div className="text-center space-y-4">
        {error ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-[#4a5568] text-xs">Redirecting back to login…</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 border-2 border-[#4c7ef3] border-t-transparent rounded-full animate-spin mx-auto" />
            <div>
              <p className="text-[#e8eaf6] font-semibold">Signing you in…</p>
              <p className="text-[#4a5568] text-xs mt-1">Setting up your admin session</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminAuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0e1a' }}>
        <div className="w-10 h-10 border-2 border-[#4c7ef3] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}

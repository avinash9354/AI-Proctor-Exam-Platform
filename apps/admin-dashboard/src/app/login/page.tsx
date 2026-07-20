'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Admin Dashboard login now redirects to the unified login page on Student Portal
export default function AdminLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    // Redirect to unified login on student portal with admin tab pre-selected
    const studentPortalUrl = process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL || 'http://localhost:3000';
    window.location.replace(`${studentPortalUrl}/auth/login?role=admin`);
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #0f1629 0%, #0a0e1a 100%)' }}
    >
      <div className="text-center">
        <div
          className="w-12 h-12 border-2 border-[#4c7ef3] border-t-transparent rounded-full animate-spin mx-auto mb-4"
        />
        <p className="text-[#8892b0] text-sm">Redirecting to login…</p>
      </div>
    </div>
  );
}

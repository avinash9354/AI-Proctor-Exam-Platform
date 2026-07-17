'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { AdminSidebar } from '@/components/layout/AdminSidebar';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated);
  useEffect(() => { if (!isAuthenticated) router.replace('/login'); }, [isAuthenticated, router]);
  if (!isAuthenticated) return null;
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 ml-64 min-h-screen overflow-auto">{children}</main>
    </div>
  );
}

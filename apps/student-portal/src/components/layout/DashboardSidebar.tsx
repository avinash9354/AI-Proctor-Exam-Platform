'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/apiClient';
import {
  LayoutDashboard, BookOpen, Clock, CheckCircle,
  Shield, LogOut, User, History, Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/exams', icon: BookOpen, label: 'My Exams' },
  { href: '/dashboard/history', icon: History, label: 'Exam History' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth, accessToken } = useAuthStore();

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout', {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {}
    clearAuth();
    toast.success('Logged out');
    router.push('/');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 glass border-r border-[#1e2d50] flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-[#1e2d50]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4c7ef3] to-[#7c3aed] flex items-center justify-center transition-transform group-hover:scale-105">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold gradient-text block">ExamGuard</span>
            <span className="text-[10px] text-[#4a5568] uppercase tracking-widest">Student Portal</span>
          </div>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-[#1e2d50]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4c7ef3]/20 to-[#7c3aed]/20 border border-[#1e2d50] flex items-center justify-center text-sm font-bold text-[#4c7ef3]">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#e8eaf6] truncate">{user?.name}</p>
            {user?.rollNumber && (
              <p className="text-[11px] text-[#4a5568]">{user.rollNumber}</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(active ? 'nav-item-active' : 'nav-item')}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-[#1e2d50]">
        <button
          onClick={handleLogout}
          className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
          id="logout-btn"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

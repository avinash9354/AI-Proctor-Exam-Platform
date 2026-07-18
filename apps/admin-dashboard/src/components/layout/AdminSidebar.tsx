'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import {
  Shield, LayoutDashboard, Monitor, AlertTriangle, BookOpen,
  Users, BarChart2, FileText, Settings, LogOut, Bell, ClipboardList,
  GraduationCap, HelpCircle, Calendar, Key, Video, Activity, Server, User
} from 'lucide-react';
import clsx from 'clsx';

const NAV = [
  // Main & Proctoring
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview', section: 'Proctoring & Monitoring' },
  { href: '/dashboard/monitoring', icon: Monitor, label: 'Live Monitoring' },
  { href: '/dashboard/alerts', icon: AlertTriangle, label: 'AI Alerts' },
  { href: '/dashboard/risk-analysis', icon: Activity, label: 'Risk Analysis' },
  { href: '/dashboard/recordings', icon: Video, label: 'Recordings & Evidence' },

  // Academic & Content
  { href: '/dashboard/exams', icon: BookOpen, label: 'Exam Management', section: 'Academic & Users' },
  { href: '/dashboard/question-bank', icon: HelpCircle, label: 'Question Bank' },
  { href: '/dashboard/scheduler', icon: Calendar, label: 'Exam Scheduler' },
  { href: '/dashboard/students', icon: Users, label: 'Students' },
  { href: '/dashboard/teachers', icon: GraduationCap, label: 'Teachers' },

  // Analytics & Logs
  { href: '/dashboard/analytics', icon: BarChart2, label: 'Analytics', section: 'Intelligence & Audit' },
  { href: '/dashboard/reports', icon: FileText, label: 'Reports' },
  { href: '/dashboard/audit', icon: ClipboardList, label: 'Audit Logs' },

  // Administration
  { href: '/dashboard/roles', icon: Key, label: 'Roles & Permissions', section: 'System & Configuration' },
  { href: '/dashboard/system-status', icon: Server, label: 'System Health' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAdminAuthStore();

  const handleLogout = () => { clearAuth(); router.push('/login'); };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col border-r border-[#1e2d50] bg-[#0a0e1a] z-40">
      <div className="p-5 border-b border-[#1e2d50]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4c7ef3] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-[#4c7ef3]/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold gradient-text block text-sm">ExamGuard</span>
            <span className="text-[10px] text-[#4a5568] uppercase tracking-widest font-semibold">Admin Console</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-[#1e2d50] hover:bg-[#111827]/40 transition-colors">
        <Link href="/dashboard/profile" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4c7ef3]/30 to-[#7c3aed]/30 flex items-center justify-center text-xs font-bold text-[#4c7ef3] group-hover:scale-105 transition-transform">
            {user?.name?.charAt(0) || <User className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#e8eaf6] truncate group-hover:text-[#4c7ef3] transition-colors">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] text-[#4a5568] capitalize">{user?.role?.replace('_', ' ') || 'Super Admin'}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto custom-scrollbar">
        {NAV.map(({ href, icon: Icon, label, section }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <div key={href}>
              {section && (
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#4a5568] px-3 pt-4 pb-1">
                  {section}
                </div>
              )}
              <Link href={href} className={clsx(active ? 'nav-item-active' : 'nav-item')}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#1e2d50]">
        <button onClick={handleLogout} className="nav-item w-full text-red-400 hover:bg-red-900/20" id="admin-logout">
          <LogOut className="w-4 h-4" /><span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

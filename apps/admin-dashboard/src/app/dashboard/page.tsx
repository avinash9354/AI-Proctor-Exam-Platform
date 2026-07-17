'use client';
import { useQuery } from '@tanstack/react-query';
import { examClient } from '@/lib/apiClient';
import Link from 'next/link';
import {
  Users, BookOpen, AlertTriangle, Monitor, ArrowRight,
  TrendingUp, CheckCircle, Clock, ShieldAlert,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const { data: monitoringData } = useQuery({
    queryKey: ['monitoring', 'summary'],
    queryFn: () => examClient.get('/admin/sessions?limit=100').then((r) => r.data.data),
    refetchInterval: 15_000,
  });

  const sessions = monitoringData?.sessions || [];
  const activeCount = sessions.length;
  const highRiskCount = sessions.filter((s: Record<string, unknown>) => s.riskLevel === 'orange' || s.riskLevel === 'red').length;
  const blockedCount = sessions.filter((s: Record<string, unknown>) => s.isBlocked as boolean).length;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e8eaf6]">
            Platform <span className="gradient-text">Overview</span>
          </h1>
          <p className="text-[#8892b0] mt-1 text-sm">Real-time examination proctoring and system metrics</p>
        </div>

        <Link href="/dashboard/monitoring" className="btn-primary gap-2">
          <Monitor className="w-4 h-4" /> Go to Live Monitoring <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: <Monitor className="w-5 h-5" />, label: 'Active Sessions', value: activeCount, color: 'text-[#4c7ef3]' },
          { icon: <AlertTriangle className="w-5 h-5" />, label: 'High Risk Alerts', value: highRiskCount, color: 'text-orange-400' },
          { icon: <ShieldAlert className="w-5 h-5" />, label: 'Blocked Sessions', value: blockedCount, color: 'text-red-400' },
          { icon: <CheckCircle className="w-5 h-5" />, label: 'System Health', value: '100% OK', color: 'text-emerald-400' },
        ].map((stat, i) => (
          <div key={i} className="card p-5">
            <div className={`${stat.color} mb-3`}>{stat.icon}</div>
            <div className="text-2xl font-bold text-[#e8eaf6]">{stat.value}</div>
            <div className="text-xs text-[#8892b0] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Links / Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-bold text-[#e8eaf6] mb-4 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-[#4c7ef3]" /> Active Live Sessions Summary
          </h2>
          {sessions.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#8892b0]">
              No active exam sessions currently running.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((s: Record<string, unknown>) => (
                <div key={s.id as string} className="flex items-center justify-between p-3 rounded-xl bg-[#0f1629] border border-[#1e2d50]">
                  <div>
                    <p className="text-sm font-semibold text-[#e8eaf6]">{((s.student as Record<string, unknown>)?.name as string) || 'Student'}</p>
                    <p className="text-xs text-[#8892b0]">{((s.exam as Record<string, unknown>)?.title as string) || 'Exam'}</p>
                  </div>
                  <span className={`badge risk-${s.riskLevel || 'green'}`}>
                    Risk: {s.riskScore as number}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-base font-bold text-[#e8eaf6] mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#7c3aed]" /> Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/exams" className="p-4 rounded-xl bg-[#0f1629] border border-[#1e2d50] hover:border-[#4c7ef3]/50 transition-all text-center">
              <BookOpen className="w-6 h-6 text-[#4c7ef3] mx-auto mb-2" />
              <span className="text-xs font-semibold text-[#e8eaf6] block">Manage Exams</span>
            </Link>
            <Link href="/dashboard/students" className="p-4 rounded-xl bg-[#0f1629] border border-[#1e2d50] hover:border-[#4c7ef3]/50 transition-all text-center">
              <Users className="w-6 h-6 text-[#7c3aed] mx-auto mb-2" />
              <span className="text-xs font-semibold text-[#e8eaf6] block">Students</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

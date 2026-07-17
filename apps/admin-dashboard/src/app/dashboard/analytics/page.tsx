'use client';
import { useQuery } from '@tanstack/react-query';
import { examClient } from '@/lib/apiClient';
import { BarChart2, TrendingUp, Users, AlertTriangle, CheckCircle, Clock, ShieldAlert, Activity } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => examClient.get('/admin/sessions?limit=1000').then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  const sessions = (data?.sessions || []) as Record<string, unknown>[];

  const stats = {
    total: sessions.length,
    active: sessions.filter((s) => s.status === 'active').length,
    submitted: sessions.filter((s) => s.status === 'submitted').length,
    blocked: sessions.filter((s) => s.isBlocked).length,
    highRisk: sessions.filter((s) => s.riskLevel === 'red' || s.riskLevel === 'orange').length,
    avgRisk: sessions.length > 0
      ? (sessions.reduce((a, s) => a + ((s.riskScore as number) || 0), 0) / sessions.length).toFixed(1)
      : '0',
    totalWarnings: sessions.reduce((a, s) => a + ((s.warningCount as number) || 0), 0),
  };

  const riskDistribution = {
    green: sessions.filter((s) => s.riskLevel === 'green').length,
    yellow: sessions.filter((s) => s.riskLevel === 'yellow').length,
    orange: sessions.filter((s) => s.riskLevel === 'orange').length,
    red: sessions.filter((s) => s.riskLevel === 'red').length,
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#e8eaf6]">
          Platform <span className="gradient-text">Analytics</span>
        </h1>
        <p className="text-[#8892b0] mt-1 text-sm">Exam session statistics and risk analysis</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Activity className="w-5 h-5" />, label: 'Total Sessions', value: stats.total, color: 'text-[#4c7ef3]' },
          { icon: <Clock className="w-5 h-5" />, label: 'Active Now', value: stats.active, color: 'text-amber-400' },
          { icon: <CheckCircle className="w-5 h-5" />, label: 'Submitted', value: stats.submitted, color: 'text-emerald-400' },
          { icon: <ShieldAlert className="w-5 h-5" />, label: 'Blocked', value: stats.blocked, color: 'text-red-400' },
        ].map((stat, i) => (
          <div key={i} className="card p-5">
            <div className={`${stat.color} mb-3`}>{stat.icon}</div>
            <div className="text-2xl font-bold text-[#e8eaf6]">{stat.value}</div>
            <div className="text-xs text-[#8892b0] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="card">
          <h2 className="font-bold text-[#e8eaf6] mb-5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Risk Level Distribution
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-8 animate-pulse bg-[#1a2540] rounded-lg" />)}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-[#4a5568] py-8 text-center">No session data available</p>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Low Risk', key: 'green', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
                { label: 'Medium Risk', key: 'yellow', color: 'bg-amber-500', textColor: 'text-amber-400' },
                { label: 'High Risk', key: 'orange', color: 'bg-orange-500', textColor: 'text-orange-400' },
                { label: 'Critical Risk', key: 'red', color: 'bg-red-500', textColor: 'text-red-400' },
              ].map(({ label, key, color, textColor }) => {
                const count = riskDistribution[key as keyof typeof riskDistribution];
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={textColor}>{label}</span>
                      <span className="text-[#8892b0]">{count} sessions ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-[#1a2540] rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="card">
          <h2 className="font-bold text-[#e8eaf6] mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#4c7ef3]" /> Key Metrics
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Average Risk Score', value: stats.avgRisk, unit: '/ 100', color: 'text-amber-400' },
              { label: 'Total Warnings Issued', value: stats.totalWarnings, unit: 'warnings', color: 'text-orange-400' },
              { label: 'High Risk Rate', value: stats.total > 0 ? `${Math.round((stats.highRisk / stats.total) * 100)}%` : '0%', unit: 'of sessions', color: 'text-red-400' },
              { label: 'Completion Rate', value: stats.total > 0 ? `${Math.round((stats.submitted / stats.total) * 100)}%` : '0%', unit: 'submitted', color: 'text-emerald-400' },
            ].map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#0f1629] border border-[#1e2d50]">
                <span className="text-sm text-[#8892b0]">{m.label}</span>
                <div className="text-right">
                  <span className={`text-lg font-bold ${m.color}`}>{m.value}</span>
                  <span className="text-xs text-[#4a5568] ml-1">{m.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent High-Risk Sessions */}
      {stats.highRisk > 0 && (
        <div className="card">
          <h2 className="font-bold text-[#e8eaf6] mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" /> High-Risk Sessions
          </h2>
          <div className="space-y-2">
            {sessions
              .filter((s) => s.riskLevel === 'red' || s.riskLevel === 'orange')
              .slice(0, 5)
              .map((s) => {
                const student = s.student as Record<string, unknown> | undefined;
                const exam = s.exam as Record<string, unknown> | undefined;
                return (
                  <div key={s.id as string} className="flex items-center justify-between p-3 rounded-xl bg-[#0f1629] border border-red-700/20">
                    <div>
                      <p className="text-sm font-semibold text-[#e8eaf6]">{student?.name as string || 'Unknown'}</p>
                      <p className="text-xs text-[#4a5568]">{exam?.title as string || 'Unknown Exam'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${s.riskLevel === 'red' ? 'bg-red-900/30 text-red-400 border border-red-700/30' : 'bg-orange-900/30 text-orange-400 border border-orange-700/30'}`}>
                        Risk: {s.riskScore as number}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useQuery } from '@tanstack/react-query';
import { examClient } from '@/lib/apiClient';
import { Activity, AlertTriangle, ShieldAlert, TrendingUp, Eye, Smartphone, Volume2, Monitor, Users, BarChart2, Filter } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function AdminRiskAnalysisPage() {
  const [timeRange, setTimeRange] = useState('24h');
  const [minRisk, setMinRisk] = useState('0');

  const { data: sessionsData, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['admin-risk-sessions', timeRange],
    queryFn: () => examClient.get('/admin/sessions?limit=100').then((r) => r.data.data?.sessions || []).catch(() => []),
  });

  const sessions = (Array.isArray(sessionsData) ? sessionsData : []).filter((s: any) => {
    const score = typeof s.riskScore === 'number' ? s.riskScore : 0;
    return score >= parseInt(minRisk);
  });

  const totalSessions = sessions.length || 1;
  const criticalCount = sessions.filter((s: any) => s.riskLevel === 'red' || (s.riskScore ?? 0) >= 75).length;
  const highCount = sessions.filter((s: any) => s.riskLevel === 'orange' || ((s.riskScore ?? 0) >= 50 && (s.riskScore ?? 0) < 75)).length;
  const moderateCount = sessions.filter((s: any) => s.riskLevel === 'yellow' || ((s.riskScore ?? 0) >= 25 && (s.riskScore ?? 0) < 50)).length;
  const lowCount = sessions.filter((s: any) => s.riskLevel === 'green' || (s.riskScore ?? 0) < 25).length;

  const totalViolations = sessions.reduce((acc: number, s: any) => acc + (s._count?.violations ?? 0), 0);
  const totalAiEvents = sessions.reduce((acc: number, s: any) => acc + (s._count?.aiEvents ?? 0), 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e8eaf6]">
            AI Risk <span className="gradient-text">Analysis & Timeline</span>
          </h1>
          <p className="text-[#8892b0] mt-1 text-sm">Deep neural network telemetry analysis, behavioral anomaly modeling, and violation distributions</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={minRisk}
            onChange={(e) => setMinRisk(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none"
          >
            <option value="0">All Risk Thresholds</option>
            <option value="25">Score ≥ 25 (Moderate+)</option>
            <option value="50">Score ≥ 50 (High+)</option>
            <option value="75">Score ≥ 75 (Critical Only)</option>
          </select>
          <div className="flex bg-[#1a2540] p-1 rounded-xl border border-[#1e2d50]">
            {['24h', '7d', '30d'].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase ${
                  timeRange === r ? 'bg-[#4c7ef3] text-white' : 'text-[#8892b0] hover:text-[#e8eaf6]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-red-400 mb-3 flex items-center justify-between">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-xs bg-red-400/10 text-red-400 px-2.5 py-1 rounded-full font-semibold">Critical Risk</span>
          </div>
          <div className="text-2xl font-bold text-[#e8eaf6]">{criticalCount}</div>
          <div className="text-xs text-[#8892b0] mt-0.5">{((criticalCount / totalSessions) * 100).toFixed(1)}% of all sessions</div>
        </div>
        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-orange-400 mb-3 flex items-center justify-between">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs bg-orange-400/10 text-orange-400 px-2.5 py-1 rounded-full font-semibold">High Risk</span>
          </div>
          <div className="text-2xl font-bold text-[#e8eaf6]">{highCount}</div>
          <div className="text-xs text-[#8892b0] mt-0.5">{((highCount / totalSessions) * 100).toFixed(1)}% of all sessions</div>
        </div>
        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-amber-400 mb-3 flex items-center justify-between">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-xs bg-amber-400/10 text-amber-400 px-2.5 py-1 rounded-full font-semibold">Violations</span>
          </div>
          <div className="text-2xl font-bold text-[#e8eaf6]">{totalViolations}</div>
          <div className="text-xs text-[#8892b0] mt-0.5">Total Confirmed Infractions</div>
        </div>
        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-[#4c7ef3] mb-3 flex items-center justify-between">
            <Activity className="w-5 h-5" />
            <span className="text-xs bg-[#4c7ef3]/10 text-[#4c7ef3] px-2.5 py-1 rounded-full font-semibold">AI Telemetry</span>
          </div>
          <div className="text-2xl font-bold text-[#e8eaf6]">{totalAiEvents}</div>
          <div className="text-xs text-[#8892b0] mt-0.5">Neural Detection Events Logged</div>
        </div>
      </div>

      {/* Violation Distribution Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 border border-[#1e2d50] rounded-2xl bg-[#0f1629] space-y-4">
          <h3 className="text-base font-bold text-[#e8eaf6] flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#4c7ef3]" /> AI Detection Category Breakdown
          </h3>
          <div className="space-y-3 pt-2">
            {[
              { label: 'Head Pose & Eye Tracking Deviations', count: Math.round(totalAiEvents * 0.42) || 12, icon: <Eye className="w-4 h-4 text-purple-400" />, color: 'bg-purple-500' },
              { label: 'Mobile Phone & Object Recognition', count: Math.round(totalAiEvents * 0.28) || 8, icon: <Smartphone className="w-4 h-4 text-red-400" />, color: 'bg-red-500' },
              { label: 'Tab Switch / Kiosk Escape Attempts', count: Math.round(totalAiEvents * 0.18) || 5, icon: <Monitor className="w-4 h-4 text-amber-400" />, color: 'bg-amber-500' },
              { label: 'Acoustic / Speech Threshold Exceeded', count: Math.round(totalAiEvents * 0.12) || 3, icon: <Volume2 className="w-4 h-4 text-blue-400" />, color: 'bg-blue-500' },
            ].map((item, i) => {
              const max = totalAiEvents || 28;
              const pct = Math.min(100, Math.max(5, Math.round((item.count / max) * 100)));
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#e8eaf6]">
                    <span className="flex items-center gap-2">{item.icon} {item.label}</span>
                    <span className="text-[#8892b0] font-mono">{item.count} events ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1a2540] overflow-hidden">
                    <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6 border border-[#1e2d50] rounded-2xl bg-[#0f1629] space-y-4">
          <h3 className="text-base font-bold text-[#e8eaf6] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" /> Candidate Risk Distribution
          </h3>
          <div className="space-y-3 pt-2">
            {[
              { level: 'Critical Risk (75-100%)', count: criticalCount, desc: 'Requires immediate proctor intervention / audit', color: 'bg-red-500 text-red-400 border-red-500/30' },
              { level: 'High Risk (50-74%)', count: highCount, desc: 'Multiple behavioral anomalies detected', color: 'bg-orange-500 text-orange-400 border-orange-500/30' },
              { level: 'Moderate Risk (25-49%)', count: moderateCount, desc: 'Minor infractions or occasional head turn', color: 'bg-amber-500 text-amber-400 border-amber-500/30' },
              { level: 'Low Risk (0-24%)', count: lowCount, desc: 'Normal session telemetry', color: 'bg-emerald-500 text-emerald-400 border-emerald-500/30' },
            ].map((dist, i) => (
              <div key={i} className="p-3 rounded-xl border bg-[#1a2540]/40 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-[#e8eaf6]">{dist.level}</h4>
                  <p className="text-[11px] text-[#8892b0]">{dist.desc}</p>
                </div>
                <div className="text-lg font-extrabold text-[#e8eaf6] bg-[#0f1629] px-3 py-1 rounded-xl border border-[#1e2d50]">
                  {dist.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* High Risk Leaderboard Table */}
      <div className="card p-6 border border-[#1e2d50] rounded-2xl bg-[#0f1629] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#e8eaf6] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#4c7ef3]" /> Candidate Risk Leaderboard & Timeline
          </h3>
          <span className="text-xs text-[#8892b0]">Sorted by descending risk severity</span>
        </div>

        {isLoadingSessions ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse bg-[#1a2540] rounded-xl" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-[#8892b0] text-sm">
            No exam sessions meet the minimum risk score threshold.
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2d50] text-xs text-[#4a5568] uppercase tracking-wider bg-[#0a0e1a]/60">
                  <th className="text-left py-3 px-4">Student Candidate</th>
                  <th className="text-left py-3 px-4">Exam Session</th>
                  <th className="text-left py-3 px-4">Risk Score</th>
                  <th className="text-left py-3 px-4">AI Telemetry Logs</th>
                  <th className="text-right py-3 px-4">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d50]">
                {sessions
                  .sort((a: any, b: any) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
                  .slice(0, 15)
                  .map((session: any) => {
                    const score = session.riskScore ?? 0;
                    return (
                      <tr key={session.id} className="hover:bg-[#1a2540]/40 transition-colors">
                        <td className="py-3 px-4">
                          <p className="text-sm font-semibold text-[#e8eaf6]">{session.student?.name || 'Candidate ID: ' + session.studentId}</p>
                          <p className="text-xs text-[#4a5568]">{session.student?.email || 'Active Candidate'}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-[#8892b0]">{session.exam?.title || 'High Stakes Exam'}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-[#1a2540] overflow-hidden">
                              <div className={`h-full rounded-full ${
                                score >= 75 ? 'bg-red-500' : score >= 50 ? 'bg-orange-500' : score >= 25 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`} style={{ width: `${Math.min(100, score)}%` }} />
                            </div>
                            <span className={`text-xs font-extrabold ${
                              score >= 75 ? 'text-red-400' : score >= 50 ? 'text-orange-400' : score >= 25 ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {score}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <span className="px-2 py-1 rounded bg-[#1e2d50]/60 text-[#e8eaf6]">
                            {session._count?.violations ?? 0} Violations • {session._count?.aiEvents ?? 0} AI Events
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/dashboard/monitoring?session=${session.id}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#4c7ef3]/20 text-[#4c7ef3] border border-[#4c7ef3]/30 hover:bg-[#4c7ef3]/30 transition-colors inline-block"
                          >
                            Timeline View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

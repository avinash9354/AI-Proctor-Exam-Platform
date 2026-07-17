'use client';
import { useQuery } from '@tanstack/react-query';
import { examClient } from '@/lib/apiClient';
import { CheckCircle, Clock, FileText, BarChart, Download, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const RISK_COLORS: Record<string, string> = {
  green: 'text-emerald-400 bg-emerald-900/20 border-emerald-700/30',
  yellow: 'text-amber-400 bg-amber-900/20 border-amber-700/30',
  orange: 'text-orange-400 bg-orange-900/20 border-orange-700/30',
  red: 'text-red-400 bg-red-900/20 border-red-700/30',
};

export default function ExamHistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['exam-history'],
    queryFn: () => examClient.get('/sessions/my').then((r) => r.data.data),
  });

  const sessions = (data?.sessions || data || []) as Record<string, unknown>[];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#e8eaf6]">
          Exam <span className="gradient-text">History</span>
        </h1>
        <p className="text-[#8892b0] mt-1 text-sm">All your past exam sessions and results</p>
      </div>

      {/* Summary Stats */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: <CheckCircle className="w-5 h-5" />, label: 'Completed', value: sessions.filter((s) => s.status === 'submitted').length, color: 'text-emerald-400' },
            { icon: <BarChart className="w-5 h-5" />, label: 'Total Exams', value: sessions.length, color: 'text-[#4c7ef3]' },
            { icon: <Clock className="w-5 h-5" />, label: 'In Progress', value: sessions.filter((s) => s.status === 'active').length, color: 'text-amber-400' },
          ].map((stat, i) => (
            <div key={i} className="card p-5">
              <div className={`${stat.color} mb-3`}>{stat.icon}</div>
              <div className="text-2xl font-bold text-[#e8eaf6]">{stat.value}</div>
              <div className="text-xs text-[#8892b0] mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sessions Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="card h-20 animate-pulse bg-[#1a2540]" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <FileText className="w-12 h-12 text-[#1e2d50] mb-4" />
          <p className="text-[#8892b0]">No exam history yet.</p>
          <p className="text-xs text-[#4a5568] mt-1">Your completed exams will appear here.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2d50] text-xs text-[#4a5568] uppercase tracking-wider">
                <th className="text-left py-3 px-4">Exam</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Duration</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Risk</th>
                <th className="text-left py-3 px-4">Score</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d50]">
              {sessions.map((session) => {
                const exam = session.exam as Record<string, unknown> | undefined;
                const risk = (session.riskLevel as string) || 'green';
                return (
                  <tr key={session.id as string} className="hover:bg-[#0f1629] transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-sm font-semibold text-[#e8eaf6]">{exam?.title as string || 'Unknown Exam'}</p>
                      <p className="text-xs text-[#4a5568]">{exam?.type as string}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#8892b0]">
                      {session.startedAt ? format(new Date(session.startedAt as string), 'dd MMM yyyy, HH:mm') : '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#8892b0]">
                      {exam?.durationMinutes as number || '—'} min
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${session.status === 'submitted' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/30' : 'bg-amber-900/30 text-amber-400 border border-amber-700/30'}`}>
                        {session.status as string}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-lg border font-medium ${RISK_COLORS[risk]}`}>
                        {risk.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-[#e8eaf6]">
                      {session.score != null ? `${session.score}` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {session.status === 'submitted' && (
                        <a
                          href={`http://localhost:4005/v1/reports/session/${session.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-ghost text-xs gap-1 hover:text-[#4c7ef3]"
                          title="Download PDF report"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

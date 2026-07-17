'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { examClient } from '@/lib/apiClient';
import { FileText, Download, Search, RefreshCw, Filter } from 'lucide-react';
import { format } from 'date-fns';

const REPORT_SERVICE_URL = process.env.NEXT_PUBLIC_REPORT_URL || 'http://localhost:4005';

export default function AdminReportsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-sessions-reports'],
    queryFn: () => examClient.get('/admin/sessions?limit=100').then((r) => r.data.data),
  });

  const sessions = ((data?.sessions || []) as Record<string, unknown>[])
    .filter((s) => s.status === 'submitted')
    .filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      const student = s.student as Record<string, unknown> | undefined;
      const exam = s.exam as Record<string, unknown> | undefined;
      return (
        (student?.name as string)?.toLowerCase().includes(q) ||
        (exam?.title as string)?.toLowerCase().includes(q)
      );
    });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e8eaf6]">
            Exam <span className="gradient-text">Reports</span>
          </h1>
          <p className="text-[#8892b0] mt-1 text-sm">Download proctoring PDF reports for submitted sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50]">
            <Search className="w-4 h-4 text-[#4a5568]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports..."
              className="bg-transparent text-sm text-[#e8eaf6] outline-none w-44 placeholder:text-[#4a5568]"
              id="report-search"
            />
          </div>
          <button onClick={() => refetch()} className="btn-ghost gap-1 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      <div className="card p-4 bg-blue-900/10 border border-blue-700/20">
        <p className="text-sm text-blue-300">
          📄 Reports are generated as PDFs and include session summary, risk score, warnings, and evidence timeline. Only <strong>submitted</strong> sessions appear here.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="card h-20 animate-pulse bg-[#1a2540]" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <FileText className="w-12 h-12 text-[#1e2d50] mb-4" />
          <p className="text-[#8892b0]">{search ? 'No reports match your search.' : 'No submitted sessions to report yet.'}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2d50] text-xs text-[#4a5568] uppercase tracking-wider">
                <th className="text-left py-3 px-4">Student</th>
                <th className="text-left py-3 px-4">Exam</th>
                <th className="text-left py-3 px-4">Submitted</th>
                <th className="text-left py-3 px-4">Risk</th>
                <th className="text-left py-3 px-4">Warnings</th>
                <th className="text-left py-3 px-4">Score</th>
                <th className="py-3 px-4">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d50]">
              {sessions.map((s) => {
                const student = s.student as Record<string, unknown> | undefined;
                const exam = s.exam as Record<string, unknown> | undefined;
                const risk = (s.riskLevel as string) || 'green';
                const riskColor = { green: 'text-emerald-400', yellow: 'text-amber-400', orange: 'text-orange-400', red: 'text-red-400' }[risk] || 'text-emerald-400';
                return (
                  <tr key={s.id as string} className="hover:bg-[#0f1629] transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-sm font-semibold text-[#e8eaf6]">{student?.name as string || 'Unknown'}</p>
                      <p className="text-xs text-[#4a5568]">{student?.email as string}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-[#e8eaf6]">{exam?.title as string || 'Unknown'}</p>
                      <p className="text-xs text-[#4a5568] capitalize">{exam?.type as string}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#8892b0]">
                      {s.submittedAt ? format(new Date(s.submittedAt as string), 'dd MMM yyyy HH:mm') : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-bold ${riskColor}`}>{risk.toUpperCase()}</span>
                      <span className="text-xs text-[#4a5568] ml-1">({s.riskScore as number || 0})</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#8892b0]">{(s.warningCount as number) || 0}</td>
                    <td className="py-3 px-4 text-sm font-bold text-[#e8eaf6]">{s.score != null ? s.score as number : '—'}</td>
                    <td className="py-3 px-4">
                      <a
                        href={`${REPORT_SERVICE_URL}/v1/reports/session/${s.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary text-xs gap-1 py-1.5 px-3"
                        id={`download-report-${s.id}`}
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </a>
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

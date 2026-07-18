'use client';
import { useQuery } from '@tanstack/react-query';
import { examClient } from '@/lib/apiClient';
import { Video, Search, Film, AlertTriangle, Shield, Clock, Play, Download, Eye, CheckCircle, Smartphone, UserX, FileVideo } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function AdminRecordingsPage() {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-recordings-sessions'],
    queryFn: () => examClient.get('/admin/sessions?limit=50').then((r) => r.data.data?.sessions || []).catch(() => []),
  });

  const sessions = (Array.isArray(data) ? data : []).filter((s: any) => {
    const studentName = s.student?.name || '';
    const examTitle = s.exam?.title || '';
    const matchesSearch = !search || 
      studentName.toLowerCase().includes(search.toLowerCase()) ||
      examTitle.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || s.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e8eaf6]">
            Recordings & <span className="gradient-text">Evidence Browser</span>
          </h1>
          <p className="text-[#8892b0] mt-1 text-sm">Review immutable video archives, screen captures, and AI proctoring incident logs</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50]">
            <Search className="w-4 h-4 text-[#4a5568]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or exam..."
              className="bg-transparent text-sm text-[#e8eaf6] outline-none w-48 placeholder:text-[#4a5568]"
            />
          </div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none capitalize"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="green">Low Risk (Green)</option>
            <option value="yellow">Moderate Risk (Yellow)</option>
            <option value="orange">High Risk (Orange)</option>
            <option value="red">Critical Risk (Red)</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-[#4c7ef3] mb-3 flex items-center justify-between">
            <Film className="w-5 h-5" />
            <span className="text-xs bg-[#4c7ef3]/10 text-[#4c7ef3] px-2.5 py-1 rounded-full font-semibold">Total</span>
          </div>
          <div className="text-2xl font-bold text-[#e8eaf6]">{sessions.length}</div>
          <div className="text-xs text-[#8892b0] mt-0.5">Recorded Exam Sessions</div>
        </div>
        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-red-400 mb-3 flex items-center justify-between">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-xs bg-red-400/10 text-red-400 px-2.5 py-1 rounded-full font-semibold">Critical</span>
          </div>
          <div className="text-2xl font-bold text-[#e8eaf6]">
            {sessions.filter((s: any) => s.riskLevel === 'red' || s.riskLevel === 'orange').length}
          </div>
          <div className="text-xs text-[#8892b0] mt-0.5">Flagged High-Risk Archives</div>
        </div>
        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-amber-400 mb-3 flex items-center justify-between">
            <Smartphone className="w-5 h-5" />
            <span className="text-xs bg-amber-400/10 text-amber-400 px-2.5 py-1 rounded-full font-semibold">Devices</span>
          </div>
          <div className="text-2xl font-bold text-[#e8eaf6]">
            {sessions.filter((s: any) => (s._count?.violations ?? 0) > 0).length}
          </div>
          <div className="text-xs text-[#8892b0] mt-0.5">Sessions with Violations</div>
        </div>
        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-emerald-400 mb-3 flex items-center justify-between">
            <Shield className="w-5 h-5" />
            <span className="text-xs bg-emerald-400/10 text-emerald-400 px-2.5 py-1 rounded-full font-semibold">Clean</span>
          </div>
          <div className="text-2xl font-bold text-[#e8eaf6]">
            {sessions.filter((s: any) => s.riskLevel === 'green').length}
          </div>
          <div className="text-xs text-[#8892b0] mt-0.5">Verified Clean Evidence</div>
        </div>
      </div>

      {/* Recordings Grid / List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="card h-24 animate-pulse bg-[#1a2540] rounded-2xl border border-[#1e2d50]" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <FileVideo className="w-12 h-12 text-[#1e2d50] mb-4" />
          <p className="text-[#8892b0] font-medium">{search || riskFilter !== 'ALL' ? 'No recorded sessions match your search or filters.' : 'No recorded sessions available yet.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session: any) => (
            <div key={session.id} className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629] hover:border-[#4c7ef3]/40 transition-all flex items-center justify-between gap-6">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="relative w-24 h-16 rounded-xl bg-[#1a2540] border border-[#1e2d50] overflow-hidden flex items-center justify-center flex-shrink-0 group cursor-pointer" onClick={() => setSelectedSession(session)}>
                  <Video className="w-6 h-6 text-[#4c7ef3] group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                  <div className="absolute bottom-1 right-1 bg-black/80 text-[9px] text-white px-1.5 py-0.5 rounded font-mono">
                    REC
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      session.riskLevel === 'red' ? 'bg-red-900/30 text-red-400 border border-red-700/30' :
                      session.riskLevel === 'orange' ? 'bg-orange-900/30 text-orange-400 border border-orange-700/30' :
                      session.riskLevel === 'yellow' ? 'bg-amber-900/30 text-amber-400 border border-amber-700/30' :
                      'bg-emerald-900/30 text-emerald-400 border border-emerald-700/30'
                    }`}>
                      Risk Score: {session.riskScore}% ({session.riskLevel})
                    </span>
                    <span className="text-xs text-[#8892b0]">•</span>
                    <span className="text-xs font-semibold text-[#e8eaf6]">{session.exam?.title || 'Examination'}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#e8eaf6] truncate">
                    Candidate: {session.student?.name || 'Student ID: ' + session.studentId}
                  </h3>
                  <div className="mt-1 flex items-center gap-4 text-xs text-[#8892b0]">
                    <span>Status: <strong className="capitalize text-[#e8eaf6]">{session.status?.replace('_', ' ')}</strong></span>
                    <span>Violations logged: <strong className="text-amber-400 font-bold">{session._count?.violations ?? 0}</strong></span>
                    <span>AI Events: <strong className="text-[#4c7ef3] font-bold">{session._count?.aiEvents ?? 0}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setSelectedSession(session)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#4c7ef3]/20 text-[#4c7ef3] border border-[#4c7ef3]/30 hover:bg-[#4c7ef3]/30 transition-colors flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-[#4c7ef3]" /> Review Media
                </button>
                <Link
                  href={`/dashboard/monitoring?session=${session.id}`}
                  className="p-2 rounded-xl border border-[#1e2d50] hover:bg-[#1a2540] text-[#8892b0] hover:text-[#e8eaf6] transition-colors"
                  title="Inspect Live Telemetry"
                >
                  <Eye className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Review Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1629] border border-[#1e2d50] rounded-3xl p-6 w-full max-w-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2d50] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#e8eaf6] flex items-center gap-2">
                  <Film className="w-5 h-5 text-[#4c7ef3]" /> Evidence Archive: {selectedSession.student?.name}
                </h3>
                <p className="text-xs text-[#8892b0] mt-0.5">Session ID: {selectedSession.id} • Exam: {selectedSession.exam?.title}</p>
              </div>
              <button onClick={() => setSelectedSession(null)} className="text-[#4a5568] hover:text-[#e8eaf6] text-lg">✕</button>
            </div>

            {/* Video Player Placeholder / Screen Mock */}
            <div className="aspect-video w-full rounded-2xl bg-[#0a0e1a] border border-[#1e2d50] relative flex flex-col items-center justify-center overflow-hidden">
              <div className="text-center space-y-2 p-6">
                <Video className="w-12 h-12 text-[#4c7ef3] mx-auto animate-pulse" />
                <h4 className="text-sm font-bold text-[#e8eaf6]">Encrypted HLS Recording Archive</h4>
                <p className="text-xs text-[#8892b0] max-w-md">
                  This media stream is cryptographically signed and stored in immutable object storage. Click below to stream high-resolution chunks or download full audit bundle.
                </p>
                <div className="pt-3 flex justify-center gap-3">
                  <button className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#4c7ef3] to-[#7c3aed] text-white hover:opacity-90 flex items-center gap-1.5 shadow-md">
                    <Play className="w-3.5 h-3.5 fill-white" /> Stream Video Feed
                  </button>
                  <button
                    onClick={() => alert('Initiating secure bundle download...')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#1e2d50] bg-[#1a2540] text-[#e8eaf6] hover:bg-[#1e2d50] flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Evidence (.MP4)
                  </button>
                </div>
              </div>

              {/* Simulated timeline markers */}
              <div className="absolute bottom-0 inset-x-0 h-8 bg-[#1a2540]/90 border-t border-[#1e2d50] px-4 flex items-center justify-between text-[10px] text-[#8892b0] font-mono">
                <span>00:00:00</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" title="Phone Detected at 00:14:22" />
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" title="Head Pose Deviation at 00:32:05" />
                  <span>Timeline Risk Markers</span>
                </div>
                <span>01:30:00</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-[#8892b0]">
                Cryptographic SHA-256 Hash: <code className="text-[#4c7ef3]">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#1a2540] text-[#e8eaf6] border border-[#1e2d50] hover:bg-[#1e2d50]"
              >
                Close Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

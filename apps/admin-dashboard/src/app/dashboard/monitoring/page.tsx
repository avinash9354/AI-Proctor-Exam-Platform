'use client';
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { examClient } from '@/lib/apiClient';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { MonitoringTile } from '@/components/monitoring/MonitoringTile';
import { AlertsPanel } from '@/components/monitoring/AlertsPanel';
import { EvidenceCard } from '@/components/monitoring/EvidenceCard';
import { io, Socket } from 'socket.io-client';
import {
  Monitor, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Users, AlertTriangle, Activity, Eye,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const FILTERS = [
  { value: '', label: 'All Active' },
  { value: 'high_risk', label: '🔴 High Risk' },
  { value: 'phone_detected', label: '📱 Phone' },
  { value: 'multiple_faces', label: '👥 Multiple Faces' },
  { value: 'warnings', label: '⚠️ Warnings' },
];

export default function LiveMonitoringPage() {
  const [filter, setFilter] = useState('');
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursors, setCursors] = useState<string[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<unknown[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const user = useAdminAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['monitoring', 'sessions', filter, cursor],
    queryFn: () =>
      examClient.get(`/admin/sessions?filter=${filter}&${cursor ? `cursor=${cursor}&` : ''}limit=30`)
        .then((r) => r.data.data),
    refetchInterval: 10_000, // refresh every 10s
  });

  // ── WebSocket connection ────────────────────────────────────────────────────
  useEffect(() => {
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4004';
    const sock = io(WS_URL, { transports: ['websocket'] });
    setSocket(sock);

    sock.on('connect', () => {
      // Subscribe to all active exams (simplified — in production, join per-exam)
      sock.emit('join:exam', 'global');
    });

    sock.on('admin:notification', (notification: unknown) => {
      const n = notification as { type: string; payload: Record<string, unknown> };
      if (n.type === 'ai_alert' || n.type === 'session_blocked') {
        setAlerts((prev) => [n, ...prev.slice(0, 49)]); // keep last 50
        if (n.type === 'session_blocked') {
          toast.error(`🔴 Session blocked: ${n.payload.studentName}`, { duration: 6000 });
        }
      }
      // Invalidate monitoring query to refresh tile data
      queryClient.invalidateQueries({ queryKey: ['monitoring'] });
    });

    sock.on('admin:high_priority', (event: unknown) => {
      toast.error('🚨 HIGH PRIORITY ALERT — Check monitoring grid', { duration: 8000 });
    });

    return () => { sock.disconnect(); };
  }, [queryClient]);

  const handleNextPage = () => {
    if (data?.nextCursor) {
      setCursors((prev) => [...prev, cursor!]);
      setCursor(data.nextCursor);
    }
  };

  const handlePrevPage = () => {
    const prev = [...cursors];
    const prevCursor = prev.pop();
    setCursors(prev);
    setCursor(prevCursor);
  };

  const sessions = data?.sessions || [];
  const hasNext = !!data?.nextCursor;
  const hasPrev = cursors.length > 0;
  const page = cursors.length + 1;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Main monitoring area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <div className="glass border-b border-[#1e2d50] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-[#4c7ef3]" />
            <h1 className="text-lg font-bold text-[#e8eaf6]">Live Monitoring</h1>
            <span className="badge bg-[#4c7ef3]/20 text-[#4c7ef3] border border-[#4c7ef3]/30">
              {sessions.length} active
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter chips */}
            <div className="flex items-center gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setFilter(f.value); setCursor(undefined); setCursors([]); }}
                  className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', {
                    'bg-[#4c7ef3] text-white': filter === f.value,
                    'bg-[#1a2540] text-[#8892b0] hover:bg-[#1e2d50]': filter !== f.value,
                  })}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button onClick={() => refetch()} className="btn-ghost gap-1 text-xs" title="Refresh">
              <RefreshCw className={clsx('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="glass border-b border-[#1e2d50] px-6 py-2 flex items-center gap-6 text-xs">
          {[
            { icon: <Users className="w-3.5 h-3.5" />, label: 'Active Students', value: sessions.length, color: 'text-[#4c7ef3]' },
            { icon: <AlertTriangle className="w-3.5 h-3.5" />, label: 'High Risk', value: sessions.filter((s: Record<string, unknown>) => s.riskLevel === 'orange' || s.riskLevel === 'red').length, color: 'text-red-400' },
            { icon: <Activity className="w-3.5 h-3.5" />, label: 'Warnings', value: sessions.reduce((a: number, s: Record<string, unknown>) => a + (s.warningCount as number), 0), color: 'text-amber-400' },
            { icon: <Eye className="w-3.5 h-3.5" />, label: 'Alerts (live)', value: alerts.length, color: 'text-purple-400' },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className={stat.color}>{stat.icon}</span>
              <span className="text-[#8892b0]">{stat.label}:</span>
              <span className="font-bold text-[#e8eaf6]">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="grid grid-cols-3 xl:grid-cols-5 gap-3">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="card aspect-video animate-pulse bg-[#1a2540]" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Monitor className="w-12 h-12 text-[#1e2d50] mb-4" />
              <p className="text-[#8892b0]">No active exam sessions</p>
              <p className="text-xs text-[#4a5568] mt-1">Sessions will appear here when exams are in progress</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 xl:grid-cols-5 gap-3">
              {sessions.map((session: Record<string, unknown>) => (
                <MonitoringTile
                  key={session.id as string}
                  session={session}
                  isSelected={selectedSession === session.id}
                  onClick={() => setSelectedSession(selectedSession === session.id ? null : session.id as string)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {(hasNext || hasPrev) && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button onClick={handlePrevPage} disabled={!hasPrev} className="btn-secondary gap-1 disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-xs text-[#4a5568]">Page {page}</span>
              <button onClick={handleNextPage} disabled={!hasNext} className="btn-secondary gap-1 disabled:opacity-30">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel: Alerts + Evidence ── */}
      <div className="w-80 border-l border-[#1e2d50] flex flex-col overflow-hidden">
        {selectedSession ? (
          <EvidenceCard sessionId={selectedSession} onClose={() => setSelectedSession(null)} />
        ) : (
          <AlertsPanel alerts={alerts} onSelectSession={setSelectedSession} />
        )}
      </div>
    </div>
  );
}

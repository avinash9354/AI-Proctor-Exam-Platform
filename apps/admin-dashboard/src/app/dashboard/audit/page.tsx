'use client';
import { useState } from 'react';
import { ClipboardList, RefreshCw, Filter, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { examClient } from '@/lib/apiClient';
import { format } from 'date-fns';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  FOCUS_LOSS: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
  FACE_NOT_DETECTED: <XCircle className="w-3.5 h-3.5 text-red-400" />,
  MULTIPLE_FACES: <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />,
  PHONE_DETECTED: <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />,
  AUDIO_ANOMALY: <Info className="w-3.5 h-3.5 text-blue-400" />,
  EXAM_SUBMITTED: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
  EXAM_STARTED: <CheckCircle className="w-3.5 h-3.5 text-[#4c7ef3]" />,
  SESSION_BLOCKED: <XCircle className="w-3.5 h-3.5 text-red-400" />,
};

export default function AdminAuditPage() {
  const [eventFilter, setEventFilter] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-events', eventFilter],
    queryFn: () => examClient.get(`/ai/events${eventFilter ? `?eventType=${eventFilter}` : ''}`)
      .then((r) => r.data.data)
      .catch(() => ({ events: [] })),
    refetchInterval: 15_000,
  });

  const events = (data?.events || data || []) as Record<string, unknown>[];

  const EVENT_TYPES = ['FOCUS_LOSS', 'FACE_NOT_DETECTED', 'MULTIPLE_FACES', 'PHONE_DETECTED', 'AUDIO_ANOMALY', 'SESSION_BLOCKED'];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e8eaf6]">
            Audit <span className="gradient-text">Logs</span>
          </h1>
          <p className="text-[#8892b0] mt-1 text-sm">All AI events, violations, and system actions</p>
        </div>
        <button onClick={() => refetch()} className="btn-ghost gap-1 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setEventFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!eventFilter ? 'bg-[#4c7ef3] text-white' : 'bg-[#1a2540] text-[#8892b0] hover:bg-[#1e2d50]'}`}
        >
          All Events
        </button>
        {EVENT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setEventFilter(eventFilter === t ? '' : t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${eventFilter === t ? 'bg-[#4c7ef3] text-white' : 'bg-[#1a2540] text-[#8892b0] hover:bg-[#1e2d50]'}`}
          >
            {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="card h-16 animate-pulse bg-[#1a2540]" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <ClipboardList className="w-12 h-12 text-[#1e2d50] mb-4" />
          <p className="text-[#8892b0]">No audit events found.</p>
          <p className="text-xs text-[#4a5568] mt-1">Events will appear here as exams run and AI detects activity.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-[#1e2d50]">
            {events.map((event, i) => {
              const session = event.session as Record<string, unknown> | undefined;
              const student = session?.student as Record<string, unknown> | undefined;
              return (
                <div key={i} className="flex items-start gap-3 p-4 hover:bg-[#0f1629] transition-colors">
                  <div className="mt-0.5 flex-shrink-0">
                    {EVENT_ICONS[event.eventType as string] || <Info className="w-3.5 h-3.5 text-[#4a5568]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#e8eaf6]">
                        {(event.eventType as string)?.replace(/_/g, ' ')}
                      </span>
                      {(event.confidence as number) != null && (
                        <span className="text-xs text-[#4a5568]">
                          {((event.confidence as number) * 100).toFixed(0)}% confidence
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#8892b0] mt-0.5">
                      Student: <span className="text-[#e8eaf6]">{student?.name as string || 'Unknown'}</span>
                      {' '} · Source: <span className="text-[#4c7ef3]">{event.source as string}</span>
                    </p>
                  </div>
                  <div className="text-xs text-[#4a5568] flex-shrink-0">
                    {event.timestamp ? format(new Date(event.timestamp as string), 'dd MMM HH:mm:ss') : '—'}
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

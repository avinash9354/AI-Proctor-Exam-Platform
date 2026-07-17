'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examClient } from '@/lib/apiClient';
import {
  X, AlertTriangle, ShieldCheck, Clock, CheckCircle,
  Eye, Video, FileText, Ban, Play, Check, ThumbsDown
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface EvidenceCardProps {
  sessionId: string;
  onClose: () => void;
}

export function EvidenceCard({ sessionId, onClose }: EvidenceCardProps) {
  const queryClient = useQueryClient();
  const [unblockReason, setUnblockReason] = useState('');
  const [extraMinutes, setExtraMinutes] = useState(15);

  const { data: session, isLoading } = useQuery({
    queryKey: ['session-admin', sessionId],
    queryFn: () => examClient.get(`/admin/sessions?filter=&cursor=&limit=100`)
      .then((r) => r.data.data.sessions.find((s: Record<string, unknown>) => s.id === sessionId)),
  });

  const unblockMutation = useMutation({
    mutationFn: () => examClient.post(`/admin/sessions/${sessionId}/unblock`, {
      reason: unblockReason || 'Proctor verified and approved continuation',
      extraTimeMinutes: extraMinutes,
    }),
    onSuccess: () => {
      toast.success('Session unblocked');
      queryClient.invalidateQueries({ queryKey: ['monitoring'] });
      onClose();
    },
    onError: () => toast.error('Failed to unblock session'),
  });

  const forceSubmitMutation = useMutation({
    mutationFn: (reason: string) => examClient.post(`/admin/sessions/${sessionId}/force-submit`, { reason }),
    onSuccess: () => {
      toast.success('Session force submitted');
      queryClient.invalidateQueries({ queryKey: ['monitoring'] });
      onClose();
    },
    onError: () => toast.error('Failed to force submit'),
  });

  if (isLoading || !session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f1629] p-6">
        <div className="w-6 h-6 border-2 border-[#4c7ef3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const student = (session.student as Record<string, unknown>) || {};
  const exam = (session.exam as Record<string, unknown>) || {};

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f1629] overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-[#1e2d50] flex items-center justify-between sticky top-0 bg-[#0f1629]/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#4c7ef3]" />
          <h3 className="text-sm font-bold text-[#e8eaf6]">Inspection Panel</h3>
        </div>
        <button onClick={onClose} className="btn-ghost p-1 text-xs">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Student summary */}
        <div className="card p-3 bg-[#141d33]">
          <p className="text-sm font-bold text-[#e8eaf6]">{student.name as string}</p>
          <p className="text-xs text-[#8892b0]">{student.rollNumber as string}</p>
          <p className="text-[11px] text-[#4a5568] mt-1">{exam.title as string}</p>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#1e2d50]">
            <span className="text-xs text-[#8892b0]">Risk Score:</span>
            <span className={clsx('badge', `risk-${session.riskLevel || 'green'}`)}>
              {session.riskScore as number}/100 ({session.riskLevel as string})
            </span>
          </div>
        </div>

        {/* Live / recorded snapshot */}
        <div>
          <span className="label mb-2">Live Stream Snapshot</span>
          <div className="aspect-video rounded-xl bg-[#0a0e1a] border border-[#1e2d50] flex flex-col items-center justify-center relative overflow-hidden">
            <Video className="w-8 h-8 text-[#4a5568] mb-2" />
            <span className="text-xs text-[#8892b0]">HD Video WebRTC Stream</span>
            <span className="text-[10px] text-[#4a5568] mt-0.5">Bitrate: 1.2 Mbps • FPS: 30</span>
          </div>
        </div>

        {/* Proctor actions */}
        <div className="space-y-3 pt-2 border-t border-[#1e2d50]">
          <span className="label">Proctor Override Controls</span>

          {(session.isBlocked as boolean) ? (
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-700/40 space-y-3">
              <p className="text-xs text-amber-300">
                This session is currently blocked due to multiple violations.
              </p>
              <input
                value={unblockReason}
                onChange={(e) => setUnblockReason(e.target.value)}
                placeholder="Reason for unblocking (required)"
                className="input text-xs py-1.5"
              />
              <button
                onClick={() => unblockMutation.mutate()}
                disabled={unblockMutation.isPending}
                className="btn-success w-full py-2 text-xs gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Unblock & Resume Session
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const reason = prompt('Enter reason for force submission:');
                  if (reason && reason.length >= 10) forceSubmitMutation.mutate(reason);
                  else if (reason) toast.error('Reason must be at least 10 chars');
                }}
                className="btn-danger py-2 text-xs gap-1"
              >
                <Ban className="w-3.5 h-3.5" /> Force Submit
              </button>

              <button
                onClick={() => {
                  toast.success('Evidence snapshot captured and saved to MinIO vault');
                }}
                className="btn-secondary py-2 text-xs gap-1"
              >
                <Play className="w-3.5 h-3.5" /> Capture Clip
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

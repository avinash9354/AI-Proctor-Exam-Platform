'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { examClient } from '@/lib/apiClient';
import { MCQRenderer } from '@/components/exam/MCQRenderer';
import { CodingRenderer } from '@/components/exam/CodingRenderer';
import { SubjectiveRenderer } from '@/components/exam/SubjectiveRenderer';
import { TypingRenderer } from '@/components/exam/TypingRenderer';
import { ExamTimer } from '@/components/exam/ExamTimer';
import { LiveProctorOverlay } from '@/components/exam/LiveProctorOverlay';
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function ExamSessionPage() {
  const { id: examId, sessionId } = useParams<{ id: string; sessionId: string }>();
  const router = useRouter();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const heartbeatRef = useRef<ReturnType<typeof setInterval>>();

  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => examClient.get(`/sessions/${sessionId}`).then((r) => r.data.data),
  });

  const { data: questions } = useQuery({
    queryKey: ['questions', examId],
    queryFn: () => examClient.get(`/exams/${examId}/questions`).then((r) => r.data.data),
  });

  // Heartbeat every 5 seconds
  useEffect(() => {
    heartbeatRef.current = setInterval(() => {
      examClient.post(`/sessions/${sessionId}/heartbeat`, { sessionId, timestamp: new Date().toISOString() }).catch(() => {});
    }, 5000);
    return () => clearInterval(heartbeatRef.current);
  }, [sessionId]);

  // Focus-loss detection (report to backend)
  useEffect(() => {
    const handleBlur = () => {
      setWarningCount((w) => {
        const next = w + 1;
        toast.error(`⚠️ Focus loss detected — Warning ${next}/3`, { duration: 4000 });
        examClient.post('/ai/events', {
          sessionId,
          source: 'browser',
          eventType: 'FOCUS_LOSS',
          confidence: 0.95,
          timestamp: new Date().toISOString(),
        }).catch(() => {});
        return next;
      });
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [sessionId]);

  const saveAnswer = useCallback(async (questionId: string, answer: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    try {
      await examClient.post(`/sessions/${sessionId}/answer`, { questionId, answer });
    } catch { /* silent — will retry on next save */ }
  }, [sessionId]);

  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit your exam? This cannot be undone.')) return;
    setSubmitting(true);
    try {
      await examClient.post(`/sessions/${sessionId}/submit`);
      toast.success('Exam submitted successfully!');
      router.push(`/dashboard/exams/${examId}/results?sessionId=${sessionId}`);
    } catch {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQ = questions?.[currentIdx];
  const answered = Object.keys(answers);
  const total = questions?.length || 0;

  if (!questions || !session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-[#4c7ef3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0e1a]">
      {/* ── Question Navigator Sidebar ── */}
      <div className="w-72 border-r border-[#1e2d50] flex flex-col">
        <div className="p-4 border-b border-[#1e2d50]">
          <ExamTimer
            durationMinutes={session.exam.durationMinutes}
            startedAt={session.startedAt}
            onExpire={handleSubmit}
          />
          <div className="mt-3 text-xs text-[#4a5568]">
            {answered.length}/{total} answered
          </div>
          <div className="progress-track mt-2">
            <div className="progress-bar bg-[#4c7ef3]" style={{ width: `${(answered.length / total) * 100}%` }} />
          </div>
        </div>

        {warningCount > 0 && (
          <div className="mx-3 mt-3 p-3 rounded-xl bg-amber-900/20 border border-amber-700/30">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              {warningCount} Focus Loss Warning{warningCount > 1 ? 's' : ''}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((_: unknown, i: number) => {
              const qId = (questions[i] as Record<string, unknown>).id as string;
              const isAnswered = !!answers[qId];
              const isCurrent = i === currentIdx;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className={clsx(
                    'w-full aspect-square rounded-lg text-xs font-semibold transition-all',
                    isCurrent ? 'bg-[#4c7ef3] text-white' :
                    isAnswered ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/30' :
                    'bg-[#1a2540] text-[#4a5568] hover:bg-[#1e2d50]'
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-[#1e2d50]">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary w-full gap-2"
            id="submit-exam-btn"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting…' : 'Submit Exam'}
          </button>
        </div>
      </div>

      {/* ── Question Display ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Question header */}
        <div className="border-b border-[#1e2d50] px-6 py-3 flex items-center justify-between glass">
          <div className="text-sm text-[#8892b0]">
            Question <span className="text-[#e8eaf6] font-semibold">{currentIdx + 1}</span> of {total}
            {currentQ?.sectionName && <span className="ml-2 badge-blue">{currentQ.sectionName}</span>}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[#4a5568]">
              {currentQ?.marks} {(currentQ?.marks as number) === 1 ? 'mark' : 'marks'}
              {(currentQ?.negativeMarks as number) > 0 && <span className="text-red-400 ml-1">(-{currentQ?.negativeMarks})</span>}
            </span>
          </div>
        </div>

        {/* Question content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentQ && (
            <>
              {(currentQ.type === 'mcq' || currentQ.type === 'msq') && (
                <MCQRenderer
                  question={currentQ}
                  answer={answers[currentQ.id as string]}
                  onAnswer={(a) => saveAnswer(currentQ.id as string, a)}
                  multiSelect={currentQ.type === 'msq'}
                />
              )}
              {currentQ.type === 'coding' && (
                <CodingRenderer
                  question={currentQ}
                  answer={answers[currentQ.id as string]}
                  onAnswer={(a) => saveAnswer(currentQ.id as string, a)}
                />
              )}
              {currentQ.type === 'subjective' && (
                <SubjectiveRenderer
                  question={currentQ}
                  answer={answers[currentQ.id as string] as string}
                  onAnswer={(a) => saveAnswer(currentQ.id as string, a)}
                />
              )}
              {currentQ.type === 'typing' && (
                <TypingRenderer
                  question={currentQ}
                  onComplete={(result) => saveAnswer(currentQ.id as string, result)}
                />
              )}
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="border-t border-[#1e2d50] px-6 py-3 flex justify-between items-center glass">
          <button
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="btn-secondary gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <button
            onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
            disabled={currentIdx === total - 1}
            className="btn-secondary gap-1"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 🔴 Live AI Proctoring & Telemetry Overlay HUD */}
      <LiveProctorOverlay
        sessionId={sessionId}
        onViolation={() => setWarningCount((w) => w + 1)}
      />
    </div>
  );
}

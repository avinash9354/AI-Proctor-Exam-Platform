'use client';
import { useQuery } from '@tanstack/react-query';
import { examClient } from '@/lib/apiClient';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Award, CheckCircle2, AlertTriangle, Clock, FileText, ArrowLeft, ShieldCheck, HelpCircle, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function ExamAttemptScorecardPage() {
  const { id: examId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const router = useRouter();

  const { data: sessionData, isLoading: loadingSession } = useQuery({
    queryKey: ['exam-session-results', sessionId],
    queryFn: () => examClient.get(`/sessions/${sessionId}`).then((r) => r.data.data),
    enabled: !!sessionId,
  });

  const { data: examData, isLoading: loadingExam } = useQuery({
    queryKey: ['exam-details', examId],
    queryFn: () => examClient.get(`/exams/${examId}`).then((r) => r.data.data),
  });

  if (loadingSession || loadingExam) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="w-8 h-8 border-2 border-[#4c7ef3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const exam = examData || sessionData?.exam || { title: 'Exam Assessment', durationMinutes: 60 };
  const session = sessionData || {};
  const submissions = Array.isArray(session.submissions) ? session.submissions : [];
  const score = session.score != null ? session.score : 85;
  const passed = score >= 50;
  const isClean = (session.riskLevel || 'green') === 'green' && (session.warningCount || 0) === 0;

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/results"
          className="flex items-center gap-2 text-sm text-[#8892b0] hover:text-[#e8eaf6] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Results
        </Link>
        <span className="text-xs font-mono text-[#8892b0] bg-[#1a2540] px-3 py-1 rounded-full border border-[#1e2d50]">
          Session ID: {sessionId ? sessionId.slice(0, 12) : 'N/A'}
        </span>
      </div>

      {/* Banner Card */}
      <div className="card p-8 border border-[#1e2d50] rounded-3xl bg-gradient-to-r from-[#0f1629] via-[#16203a] to-[#0a0e1a] shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <span className={`badge px-3 py-1 rounded-full text-xs font-bold uppercase mb-3 inline-block ${
              passed ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40' : 'bg-red-900/40 text-red-400 border border-red-700/40'
            }`}>
              {passed ? 'Examination Passed' : 'Did Not Meet Passing Threshold'}
            </span>
            <h1 className="text-3xl font-extrabold text-[#e8eaf6]">{exam.title}</h1>
            <p className="text-xs text-[#8892b0] mt-1">Official Final Scorecard and Verification Record</p>
          </div>

          <div className="flex items-center gap-6 border-l border-[#1e2d50] pl-6">
            <div className="text-right">
              <div className="text-xs font-bold uppercase text-[#8892b0] tracking-wider">Final Grade Score</div>
              <div className={`text-4xl font-black ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
                {score}%
              </div>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              passed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-red-500 text-white shadow-lg shadow-red-500/30'
            }`}>
              <Award className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-[#4c7ef3] mb-3 flex items-center justify-between">
            <Clock className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold bg-[#4c7ef3]/10 text-[#4c7ef3] px-2 py-0.5 rounded">Duration</span>
          </div>
          <div className="text-2xl font-bold text-[#e8eaf6]">{exam.durationMinutes} Minutes</div>
          <div className="text-xs text-[#8892b0] mt-1">Total Allocated Window</div>
        </div>

        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-purple-400 mb-3 flex items-center justify-between">
            <FileText className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold bg-purple-400/10 text-purple-400 px-2 py-0.5 rounded">Submissions</span>
          </div>
          <div className="text-2xl font-bold text-[#e8eaf6]">{submissions.length} Questions</div>
          <div className="text-xs text-[#8892b0] mt-1">Recorded Answer Responses</div>
        </div>

        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className={`${isClean ? 'text-emerald-400' : 'text-amber-400'} mb-3 flex items-center justify-between`}>
            {isClean ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${isClean ? 'bg-emerald-400/10 text-emerald-400' : 'bg-amber-400/10 text-amber-400'}`}>
              Proctor Status
            </span>
          </div>
          <div className="text-2xl font-bold text-[#e8eaf6]">{isClean ? 'Clean Verification' : 'Reviewed'}</div>
          <div className="text-xs text-[#8892b0] mt-1">{isClean ? 'No behavioral red flags reported' : 'Audited by proctor team'}</div>
        </div>
      </div>

      {/* Submitted Questions Review */}
      <div className="card border border-[#1e2d50] rounded-3xl bg-[#0f1629] overflow-hidden">
        <div className="p-5 border-b border-[#1e2d50] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#e8eaf6] flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#4c7ef3]" /> Submitted Answers Review
          </h2>
          <span className="text-xs text-[#8892b0]">{submissions.length} Recorded Entries</span>
        </div>

        {submissions.length === 0 ? (
          <div className="p-12 text-center text-[#8892b0] text-sm">
            No specific question breakdown available for this session.
          </div>
        ) : (
          <div className="divide-y divide-[#1e2d50]">
            {submissions.map((sub: any, idx: number) => {
              let ansText = sub.answer;
              try {
                if (typeof ansText === 'string') ansText = JSON.parse(ansText);
              } catch {}

              return (
                <div key={sub.id || idx} className="p-5 space-y-2 hover:bg-[#16203a]/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#4c7ef3] uppercase tracking-wider">Question #{idx + 1}</span>
                    <span className="text-xs text-[#8892b0] font-mono">Time Spent: {sub.timeSpentSeconds || 30}s</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] font-mono break-all">
                    {typeof ansText === 'object' ? JSON.stringify(ansText) : String(ansText || 'No Answer Recorded')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

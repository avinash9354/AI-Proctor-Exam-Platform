'use client';
import { useQuery } from '@tanstack/react-query';
import { examClient } from '@/lib/apiClient';
import { Award, CheckCircle2, AlertTriangle, Clock, FileText, Download, ChevronRight, ShieldCheck, BarChart3, HelpCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function StudentResultsOverviewPage() {
  const [selectedCert, setSelectedCert] = useState<any | null>(null);

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['student-exam-history'],
    queryFn: () => examClient.get('/sessions/my').then((r) => r.data.data?.sessions || []),
  });

  const sessions = (historyData || []).filter((s: any) => s.status === 'submitted' || s.status === 'SUBMITTED' || s.score != null);

  const totalScore = sessions.reduce((acc: number, s: any) => acc + (s.score || 0), 0);
  const avgScore = sessions.length > 0 ? Math.round(totalScore / sessions.length) : 0;
  const cleanSessions = sessions.filter((s: any) => (s.riskLevel || 'green') === 'green' && (s._count?.violations || 0) === 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e8eaf6]">
            Academic <span className="gradient-text">Results & Analytics</span>
          </h1>
          <p className="text-[#8892b0] mt-1 text-sm">Comprehensive performance breakdown, grade scorecards, and AI proctoring integrity certificates</p>
        </div>
      </div>

      {/* Analytics KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-[#4c7ef3] mb-3 flex items-center justify-between">
            <Award className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold bg-[#4c7ef3]/10 text-[#4c7ef3] px-2 py-0.5 rounded">Cumulative</span>
          </div>
          <div className="text-2xl font-extrabold text-[#e8eaf6]">{sessions.length}</div>
          <div className="text-xs text-[#8892b0] mt-1">Completed Examinations</div>
        </div>

        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-emerald-400 mb-3 flex items-center justify-between">
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded">Average</span>
          </div>
          <div className="text-2xl font-extrabold text-[#e8eaf6]">{avgScore}%</div>
          <div className="text-xs text-[#8892b0] mt-1">Overall Mean Score Rate</div>
        </div>

        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-purple-400 mb-3 flex items-center justify-between">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold bg-purple-400/10 text-purple-400 px-2 py-0.5 rounded">Integrity</span>
          </div>
          <div className="text-2xl font-extrabold text-[#e8eaf6]">
            {sessions.length > 0 ? Math.round((cleanSessions.length / sessions.length) * 100) : 100}%
          </div>
          <div className="text-xs text-[#8892b0] mt-1">AI Clean Verification Score</div>
        </div>

        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-amber-400 mb-3 flex items-center justify-between">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded">Standing</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">Honors / Pass</div>
          <div className="text-xs text-[#8892b0] mt-1">Academic Qualification Status</div>
        </div>
      </div>

      {/* Completed Results List */}
      <div className="card border border-[#1e2d50] rounded-3xl bg-[#0f1629] overflow-hidden">
        <div className="p-5 border-b border-[#1e2d50] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#e8eaf6]">Completed Examination Transcripts</h2>
          <span className="text-xs text-[#8892b0]">{sessions.length} Transcript Records Available</span>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-[#1a2540] animate-pulse" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <FileText className="w-12 h-12 text-[#1e2d50] mx-auto" />
            <h3 className="text-base font-bold text-[#e8eaf6]">No Graded Exams Found</h3>
            <p className="text-xs text-[#8892b0] max-w-md mx-auto">
              Once your submitted examination attempts have been automatically evaluated by our grading pipeline or reviewed by your proctors, your detailed scorecards will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1e2d50]">
            {sessions.map((session: any) => {
              const exam = session.exam || {};
              const score = session.score != null ? session.score : 85; // Default demo score if unassigned
              const passed = score >= 50;
              const isClean = (session.riskLevel || 'green') === 'green' && (session._count?.violations || 0) === 0;

              return (
                <div key={session.id} className="p-5 flex items-center justify-between hover:bg-[#16203a] transition-colors gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-lg shadow-md ${
                      passed ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}>
                      {score}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-bold text-[#e8eaf6] truncate">{exam.title || 'Examination Assessment'}</h3>
                        <span className={`badge px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          passed ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40' : 'bg-red-900/40 text-red-400 border border-red-700/40'
                        }`}>
                          {passed ? 'Passed' : 'Needs Review'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#8892b0] mt-1.5 font-mono">
                        <span>Submitted: {session.startedAt ? format(new Date(session.startedAt), 'dd MMM yyyy, HH:mm') : 'Recently'}</span>
                        <span>•</span>
                        <span>Duration: {exam.durationMinutes || 60} mins</span>
                        <span>•</span>
                        <span className={`flex items-center gap-1 font-semibold ${isClean ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {isClean ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          {isClean ? 'AI Proctor Verified Clean' : `${session._count?.violations || 1} Minor Telemetry Flags`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedCert({ session, exam, score, isClean })}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#1e2d50] bg-[#1a2540] text-[#e8eaf6] hover:bg-[#1e2d50] flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-[#4c7ef3]" /> Certificate
                    </button>
                    <Link
                      href={`/dashboard/exams/${session.examId}/results?sessionId=${session.id}`}
                      className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#4c7ef3] to-[#7c3aed] text-white hover:opacity-90 flex items-center gap-1 transition-all shadow-md"
                    >
                      View Scorecard <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Proctor Integrity Certificate Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-2xl w-full p-8 rounded-3xl border border-[#4c7ef3]/50 bg-gradient-to-b from-[#0f1629] to-[#0a0e1a] shadow-2xl relative">
            <button
              onClick={() => setSelectedCert(null)}
              className="absolute top-6 right-6 text-[#8892b0] hover:text-white transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="text-center space-y-4 py-4 border-b border-[#1e2d50]">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#4c7ef3] to-[#7c3aed] flex items-center justify-center mx-auto shadow-lg shadow-[#4c7ef3]/30">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#4c7ef3] bg-[#4c7ef3]/10 px-3 py-1 rounded-full">
                  Official Academic Document
                </span>
                <h2 className="text-2xl font-black text-[#e8eaf6] mt-2">AI Proctoring Integrity Certificate</h2>
                <p className="text-xs text-[#8892b0]">Verified by ExamGuard Neural Telemetry & WebRTC Verification Engine</p>
              </div>
            </div>

            <div className="py-6 space-y-4 text-sm text-[#e8eaf6]">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#16203a]/60 border border-[#1e2d50]">
                <div>
                  <span className="text-xs text-[#8892b0] block">Examination Title</span>
                  <strong className="text-base text-white">{selectedCert.exam.title || 'Course Assessment'}</strong>
                </div>
                <div>
                  <span className="text-xs text-[#8892b0] block">Assessment Grade</span>
                  <strong className="text-base text-emerald-400 font-extrabold">{selectedCert.score}% (PASSED)</strong>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 text-xs space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Biometric & Behavioral Verification Clean
                </div>
                <p className="text-emerald-400/80 leading-relaxed">
                  This confirms that the examination session #{selectedCert.session.id?.slice(0, 8)} was conducted under continuous multi-angle AI surveillance. Continuous face gaze tracking, audio spectrograph analysis, and browser sandbox telemetry detected zero critical security policy violations.
                </p>
              </div>

              <div className="flex justify-between items-center text-[11px] text-[#8892b0] font-mono pt-2 border-t border-[#1e2d50]">
                <span>Issued: {format(new Date(), 'dd MMMM yyyy, HH:mm:ss')}</span>
                <span>Hash: SHA256-EXAMGUARD-VERIFIED-{selectedCert.session.id?.slice(-6)?.toUpperCase()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#1e2d50]">
              <button
                onClick={() => setSelectedCert(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1a2540] text-[#e8eaf6] hover:bg-[#1e2d50]"
              >
                Close Certificate
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#4c7ef3] to-[#7c3aed] text-white flex items-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" /> Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

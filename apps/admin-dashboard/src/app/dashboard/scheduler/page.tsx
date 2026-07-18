'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examClient } from '@/lib/apiClient';
import { Calendar as CalendarIcon, Clock, Plus, Search, Shield, Users, BookOpen, AlertCircle, CheckCircle, PlayCircle, Eye } from 'lucide-react';
import { useState } from 'react';
import { format, isAfter, isBefore, addHours } from 'date-fns';
import Link from 'next/link';

export default function AdminSchedulerPage() {
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ALL'>('UPCOMING');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const queryClient = useQueryClient();

  const [newExam, setNewExam] = useState({
    title: '',
    description: 'Scheduled End-of-Semester Proctoring Exam',
    durationMinutes: 90,
    scheduledStart: format(addHours(new Date(), 24), "yyyy-MM-dd'T'HH:mm"),
    scheduledEnd: format(addHours(new Date(), 26), "yyyy-MM-dd'T'HH:mm"),
    passingScore: 60,
    policyConfig: {
      strictMode: true,
      requireWebcam: true,
      requireScreenShare: true,
      allowCalculator: false,
    },
  });

  const { data: examsData = [], isLoading } = useQuery({
    queryKey: ['admin-exams-schedule'],
    queryFn: () => examClient.get('/exams').then((r) => r.data.data).catch(() => []),
  });

  const now = new Date();
  const exams = (Array.isArray(examsData) ? examsData : []).filter((ex: any) => {
    const matchesSearch = !search || ex.title?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    const start = ex.scheduledStart ? new Date(ex.scheduledStart) : new Date(0);
    const end = ex.scheduledEnd ? new Date(ex.scheduledEnd) : new Date(8640000000000000);

    if (statusTab === 'UPCOMING') return isAfter(start, now);
    if (statusTab === 'ACTIVE') return isBefore(start, now) && isAfter(end, now);
    if (statusTab === 'COMPLETED') return isBefore(end, now);
    return true;
  });

  const createMutation = useMutation({
    mutationFn: async (examData: typeof newExam) => {
      const res = await examClient.post('/exams', {
        ...examData,
        scheduledStart: new Date(examData.scheduledStart).toISOString(),
        scheduledEnd: new Date(examData.scheduledEnd).toISOString(),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exams-schedule'] });
      setIsModalOpen(false);
      setErrorMsg('');
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.error || 'Failed to schedule exam');
    },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e8eaf6]">
            Exam <span className="gradient-text">Scheduler & Calendar</span>
          </h1>
          <p className="text-[#8892b0] mt-1 text-sm">Schedule high-stakes examinations, define time windows, and configure automated lockdown policies</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50]">
            <Search className="w-4 h-4 text-[#4a5568]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scheduled exam..."
              className="bg-transparent text-sm text-[#e8eaf6] outline-none w-48 placeholder:text-[#4a5568]"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#4c7ef3] to-[#7c3aed] text-white hover:opacity-90 transition-opacity"
            id="schedule-exam-btn"
          >
            <Plus className="w-4 h-4" /> Schedule Exam
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#1e2d50] pb-2">
        {(['UPCOMING', 'ACTIVE', 'COMPLETED', 'ALL'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              statusTab === tab
                ? 'bg-gradient-to-r from-[#4c7ef3] to-[#7c3aed] text-white shadow-md'
                : 'text-[#8892b0] hover:bg-[#1a2540] hover:text-[#e8eaf6]'
            }`}
          >
            {tab === 'UPCOMING' ? 'Upcoming Sessions' : tab === 'ACTIVE' ? 'Live Now' : tab === 'COMPLETED' ? 'Past / Completed' : 'All Scheduled'}
          </button>
        ))}
      </div>

      {/* Schedule Grid */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="card h-24 animate-pulse bg-[#1a2540] rounded-2xl border border-[#1e2d50]" />)}
        </div>
      ) : exams.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <CalendarIcon className="w-12 h-12 text-[#1e2d50] mb-4" />
          <p className="text-[#8892b0] font-medium">No {statusTab.toLowerCase()} exams found matching your selection.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-[#4c7ef3]/20 text-[#4c7ef3] border border-[#4c7ef3]/30 hover:bg-[#4c7ef3]/30 transition-colors"
          >
            Schedule New Examination
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {exams.map((exam: any) => {
            const start = exam.scheduledStart ? new Date(exam.scheduledStart) : null;
            const end = exam.scheduledEnd ? new Date(exam.scheduledEnd) : null;
            const isLive = start && end && isBefore(start, now) && isAfter(end, now);
            const isPast = end && isBefore(end, now);

            return (
              <div key={exam.id} className="card p-6 border border-[#1e2d50] rounded-2xl bg-[#0f1629] hover:border-[#4c7ef3]/40 transition-all flex items-center justify-between gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-2xl border flex flex-col items-center justify-center flex-shrink-0 ${
                    isLive ? 'bg-emerald-900/30 border-emerald-500/40 text-emerald-400' :
                    isPast ? 'bg-[#1a2540] border-[#1e2d50] text-[#4a5568]' :
                    'bg-[#4c7ef3]/10 border-[#4c7ef3]/30 text-[#4c7ef3]'
                  }`}>
                    <span className="text-[10px] font-bold uppercase">{start ? format(start, 'MMM') : 'TBD'}</span>
                    <span className="text-lg font-extrabold -mt-1">{start ? format(start, 'dd') : '—'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isLive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse' :
                        isPast ? 'bg-[#1a2540] text-[#8892b0]' :
                        'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}>
                        {isLive ? '● Live Window Active' : isPast ? 'Completed' : 'Scheduled'}
                      </span>
                      <span className="text-xs text-[#8892b0] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#4a5568]" /> {exam.durationMinutes} mins
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#e8eaf6]">{exam.title}</h3>
                    <p className="text-xs text-[#8892b0] mt-1 line-clamp-1">{exam.description || 'No description provided.'}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-[#4a5568]">
                      <span>Starts: <strong className="text-[#e8eaf6]">{start ? format(start, 'dd MMM yyyy, hh:mm a') : 'Not scheduled'}</strong></span>
                      <span>Ends: <strong className="text-[#e8eaf6]">{end ? format(end, 'dd MMM yyyy, hh:mm a') : 'Not scheduled'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/dashboard/exams`}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#1e2d50] bg-[#1a2540] text-[#e8eaf6] hover:bg-[#1e2d50] transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> Manage Policies
                  </Link>
                  {isLive && (
                    <Link
                      href={`/dashboard/monitoring?examId=${exam.id}`}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> Monitor Live
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1629] border border-[#1e2d50] rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-[#1e2d50] pb-3">
              <h3 className="text-lg font-bold text-[#e8eaf6] flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#4c7ef3]" /> Schedule Examination
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#4a5568] hover:text-[#e8eaf6]">✕</button>
            </div>
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-700/30 text-red-400 text-xs">
                {errorMsg}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(newExam); }} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#8892b0] block mb-1">Exam Title</label>
                <input
                  type="text"
                  required
                  value={newExam.title}
                  onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                  placeholder="e.g. CS-401 Final Examination"
                  className="w-full px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none focus:border-[#4c7ef3]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#8892b0] block mb-1">Start Window</label>
                  <input
                    type="datetime-local"
                    required
                    value={newExam.scheduledStart}
                    onChange={(e) => setNewExam({ ...newExam, scheduledStart: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-xs text-[#e8eaf6] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8892b0] block mb-1">End Window</label>
                  <input
                    type="datetime-local"
                    required
                    value={newExam.scheduledEnd}
                    onChange={(e) => setNewExam({ ...newExam, scheduledEnd: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-xs text-[#e8eaf6] outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#8892b0] block mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="10"
                    max="360"
                    required
                    value={newExam.durationMinutes}
                    onChange={(e) => setNewExam({ ...newExam, durationMinutes: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8892b0] block mb-1">Passing Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={newExam.passingScore}
                    onChange={(e) => setNewExam({ ...newExam, passingScore: parseInt(e.target.value) || 50 })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none"
                  />
                </div>
              </div>
              <div className="bg-[#1a2540]/40 p-3 rounded-xl border border-[#1e2d50] space-y-2">
                <span className="text-xs font-bold text-[#e8eaf6] block">Proctoring Lockouts</span>
                <label className="flex items-center gap-2 text-xs text-[#8892b0]">
                  <input
                    type="checkbox"
                    checked={newExam.policyConfig.strictMode}
                    onChange={(e) => setNewExam({ ...newExam, policyConfig: { ...newExam.policyConfig, strictMode: e.target.checked } })}
                    className="rounded text-[#4c7ef3]"
                  /> Strict Kiosk Mode & Tab Switch Detection
                </label>
                <label className="flex items-center gap-2 text-xs text-[#8892b0]">
                  <input
                    type="checkbox"
                    checked={newExam.policyConfig.requireWebcam}
                    onChange={(e) => setNewExam({ ...newExam, policyConfig: { ...newExam.policyConfig, requireWebcam: e.target.checked } })}
                    className="rounded text-[#4c7ef3]"
                  /> Require Continuous Webcam Stream & Face Verification
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-[#1e2d50]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8892b0] hover:bg-[#1a2540]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#4c7ef3] to-[#7c3aed] text-white hover:opacity-90 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Scheduling...' : 'Schedule Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

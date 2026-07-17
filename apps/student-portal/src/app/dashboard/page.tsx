'use client';
import { useQuery } from '@tanstack/react-query';
import { examClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { ExamCard } from '@/components/exam/ExamCard';
import { BookOpen, Clock, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: upcomingExams, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['exams', 'upcoming'],
    queryFn: () => examClient.get('/exams?status=upcoming').then((r) => r.data.data),
  });

  const { data: completedExams, isLoading: loadingCompleted } = useQuery({
    queryKey: ['exams', 'completed'],
    queryFn: () => examClient.get('/exams?status=completed').then((r) => r.data.data),
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e8eaf6]">
            {greeting}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-[#8892b0] mt-1">
            {user?.rollNumber && <span className="mr-3">Roll: {user.rollNumber}</span>}
            {user?.department && <span>{user.department}</span>}
            {user?.semester && <span> • Semester {user.semester}</span>}
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <BookOpen className="w-5 h-5" />, label: 'Upcoming', value: upcomingExams?.length ?? '—', color: 'text-[#4c7ef3]' },
          { icon: <CheckCircle className="w-5 h-5" />, label: 'Completed', value: completedExams?.length ?? '—', color: 'text-[#10b981]' },
          { icon: <Clock className="w-5 h-5" />, label: 'In Progress', value: 0, color: 'text-[#f59e0b]' },
          { icon: <TrendingUp className="w-5 h-5" />, label: 'Avg Score', value: '—', color: 'text-[#7c3aed]' },
        ].map((stat, i) => (
          <div key={i} className="card p-5">
            <div className={`${stat.color} mb-3`}>{stat.icon}</div>
            <div className="text-2xl font-bold text-[#e8eaf6]">{stat.value}</div>
            <div className="text-xs text-[#8892b0] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Upcoming Exams ── */}
      <section>
        <h2 className="text-lg font-bold text-[#e8eaf6] mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#4c7ef3]" />
          Upcoming Exams
        </h2>
        {loadingUpcoming ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => <div key={i} className="card h-36 animate-pulse bg-[#1a2540]" />)}
          </div>
        ) : upcomingExams?.length === 0 ? (
          <div className="card flex flex-col items-center py-12 text-center">
            <BookOpen className="w-12 h-12 text-[#1e2d50] mb-4" />
            <p className="text-[#8892b0]">No upcoming exams at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingExams?.map((exam: Record<string, unknown>) => (
              <ExamCard key={exam.id as string} exam={exam} />
            ))}
          </div>
        )}
      </section>

      {/* ── Completed Exams ── */}
      {completedExams?.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-[#e8eaf6] mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#10b981]" />
            Completed Exams
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedExams.map((exam: Record<string, unknown>) => (
              <ExamCard key={exam.id as string} exam={exam} completed />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

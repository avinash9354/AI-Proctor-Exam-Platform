'use client';
import { useQuery } from '@tanstack/react-query';
import { examClient } from '@/lib/apiClient';
import { ExamCard } from '@/components/exam/ExamCard';
import { BookOpen, Clock, CheckCircle, Search } from 'lucide-react';
import { useState } from 'react';

const TABS = [
  { key: 'all', label: 'All Exams' },
  { key: 'upcoming', label: '⏳ Upcoming' },
  { key: 'live', label: '🔴 Live Now' },
  { key: 'completed', label: '✅ Completed' },
];

export default function MyExamsPage() {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  const { data: allExams, isLoading } = useQuery({
    queryKey: ['all-exams'],
    queryFn: () => examClient.get('/exams?status=all').then((r) => r.data.data),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const now = new Date();
  const exams = (allExams || []) as Record<string, unknown>[];

  const filtered = exams
    .filter((exam) => {
      const start = new Date(exam.startTime as string);
      const end = new Date(exam.endTime as string);
      if (tab === 'upcoming') return now < start;
      if (tab === 'live') return now >= start && now <= end;
      if (tab === 'completed') return now > end;
      return true;
    })
    .filter((exam) => {
      if (!search) return true;
      return (exam.title as string)?.toLowerCase().includes(search.toLowerCase());
    });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e8eaf6]">
            My <span className="gradient-text">Exams</span>
          </h1>
          <p className="text-[#8892b0] mt-1 text-sm">All your assigned exams</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50]">
          <Search className="w-4 h-4 text-[#4a5568]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exams..."
            className="bg-transparent text-sm text-[#e8eaf6] outline-none w-40 placeholder:text-[#4a5568]"
            id="exam-search"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-[#4c7ef3] text-white'
                : 'bg-[#1a2540] text-[#8892b0] hover:bg-[#1e2d50]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-40 animate-pulse bg-[#1a2540]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <BookOpen className="w-12 h-12 text-[#1e2d50] mb-4" />
          <p className="text-[#8892b0]">
            {search ? 'No exams match your search.' : `No ${tab !== 'all' ? tab : ''} exams found.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((exam) => (
            <ExamCard key={exam.id as string} exam={exam} />
          ))}
        </div>
      )}
    </div>
  );
}

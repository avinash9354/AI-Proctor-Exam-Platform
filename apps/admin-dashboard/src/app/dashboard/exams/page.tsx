'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { examClient } from '@/lib/apiClient';
import { Plus, Edit2, Trash2, Eye, Clock, Users, CheckCircle } from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalMarks: number;
  startTime: string;
  endTime: string;
  isPublished: boolean;
  _count: { questions: number; sessions: number };
}

export default function ExamManagementPage() {
  const [filter, setFilter] = useState<'active' | 'upcoming' | 'completed' | 'all'>('all');

  const { data: exams, isLoading } = useQuery({
    queryKey: ['exams', filter],
    queryFn: () =>
      examClient
        .get(`/exams?status=${filter === 'all' ? 'all' : filter}`)
        .then((r) => r.data.data || [])
        .catch(() => []),
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-24 bg-[#1a2540] animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e8eaf6]">Exam Management</h1>
          <p className="text-[#8892b0] mt-1">Create, edit, and manage exams</p>
        </div>
        <button className="btn-primary gap-2">
          <Plus className="w-5 h-5" />
          Create Exam
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
            label: 'Total Exams',
            value: exams?.length || 0,
          },
          {
            icon: <Users className="w-5 h-5 text-blue-400" />,
            label: 'Active Sessions',
            value: exams?.reduce((sum: number, e: Exam) => sum + (e._count?.sessions || 0), 0) || 0,
          },
          {
            icon: <Clock className="w-5 h-5 text-amber-400" />,
            label: 'Total Questions',
            value: exams?.reduce((sum: number, e: Exam) => sum + (e._count?.questions || 0), 0) || 0,
          },
          {
            icon: <Eye className="w-5 h-5 text-purple-400" />,
            label: 'Published',
            value: exams?.filter((e: Exam) => e.isPublished).length || 0,
          },
        ].map((stat, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center gap-3 mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-[#e8eaf6]">{stat.value}</div>
            <div className="text-xs text-[#8892b0]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'active', 'upcoming', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as typeof filter)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f
                ? 'bg-[#4c7ef3] text-white'
                : 'bg-[#1a2540] text-[#8892b0] hover:text-[#e8eaf6]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Exams Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2d50]">
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#8892b0]">Exam Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#8892b0]">Duration</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#8892b0]">Questions</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#8892b0]">Sessions</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#8892b0]">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#8892b0]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams && exams.length > 0 ? (
                exams.map((exam: Exam) => (
                  <tr key={exam.id} className="border-b border-[#1e2d50] hover:bg-[#1a2540] transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-[#e8eaf6]">{exam.title}</p>
                        <p className="text-xs text-[#8892b0]">{exam.description?.substring(0, 40)}...</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#e8eaf6]">{exam.durationMinutes} min</td>
                    <td className="px-6 py-4 text-[#e8eaf6]">{exam._count?.questions || 0}</td>
                    <td className="px-6 py-4 text-[#e8eaf6]">{exam._count?.sessions || 0}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          exam.isPublished
                            ? 'bg-emerald-900/30 text-emerald-400'
                            : 'bg-amber-900/30 text-amber-400'
                        }`}
                      >
                        {exam.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-[#1e2d50] rounded-lg transition-colors text-[#4c7ef3]">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-[#1e2d50] rounded-lg transition-colors text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#8892b0]">
                    No exams found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

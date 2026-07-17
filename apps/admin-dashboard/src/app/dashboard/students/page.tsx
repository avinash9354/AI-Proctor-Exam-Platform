'use client';
import { useQuery } from '@tanstack/react-query';
import { examClient, authClient } from '@/lib/apiClient';
import { Users, Search, GraduationCap, Mail, Hash, Shield, Clock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

export default function AdminStudentsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-students'],
    queryFn: () => authClient.get('/auth/users?role=student').then((r) => r.data.data),
  });

  const students = ((data?.users || data || []) as Record<string, unknown>[]).filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.name as string)?.toLowerCase().includes(q) ||
      (s.email as string)?.toLowerCase().includes(q) ||
      (s.rollNumber as string)?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e8eaf6]">
            Student <span className="gradient-text">Management</span>
          </h1>
          <p className="text-[#8892b0] mt-1 text-sm">View and manage all registered students</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50]">
          <Search className="w-4 h-4 text-[#4a5568]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
            className="bg-transparent text-sm text-[#e8eaf6] outline-none w-48 placeholder:text-[#4a5568]"
            id="student-search"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: <Users className="w-5 h-5" />, label: 'Total Students', value: students.length, color: 'text-[#4c7ef3]' },
          { icon: <Shield className="w-5 h-5" />, label: 'Active Accounts', value: students.filter((s) => s.isActive).length, color: 'text-emerald-400' },
          { icon: <AlertTriangle className="w-5 h-5" />, label: 'Inactive', value: students.filter((s) => !s.isActive).length, color: 'text-amber-400' },
        ].map((stat, i) => (
          <div key={i} className="card p-5">
            <div className={`${stat.color} mb-3`}>{stat.icon}</div>
            <div className="text-2xl font-bold text-[#e8eaf6]">{stat.value}</div>
            <div className="text-xs text-[#8892b0] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="card h-16 animate-pulse bg-[#1a2540]" />)}
        </div>
      ) : students.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <GraduationCap className="w-12 h-12 text-[#1e2d50] mb-4" />
          <p className="text-[#8892b0]">{search ? 'No students match your search.' : 'No students registered yet.'}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2d50] text-xs text-[#4a5568] uppercase tracking-wider">
                <th className="text-left py-3 px-4">Student</th>
                <th className="text-left py-3 px-4">Roll No</th>
                <th className="text-left py-3 px-4">Department</th>
                <th className="text-left py-3 px-4">Semester</th>
                <th className="text-left py-3 px-4">Joined</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d50]">
              {students.map((student) => (
                <tr key={student.id as string} className="hover:bg-[#0f1629] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4c7ef3]/20 to-[#7c3aed]/20 border border-[#1e2d50] flex items-center justify-center text-xs font-bold text-[#4c7ef3]">
                        {(student.name as string)?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#e8eaf6]">{student.name as string}</p>
                        <p className="text-xs text-[#4a5568] flex items-center gap-1"><Mail className="w-3 h-3" />{student.email as string}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-[#8892b0]">{student.rollNumber as string || '—'}</td>
                  <td className="py-3 px-4 text-sm text-[#8892b0]">{student.department as string || '—'}</td>
                  <td className="py-3 px-4 text-sm text-[#8892b0]">{student.semester ? `Sem ${student.semester}` : '—'}</td>
                  <td className="py-3 px-4 text-xs text-[#4a5568]">
                    {student.createdAt ? format(new Date(student.createdAt as string), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${student.isActive ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/30' : 'bg-red-900/30 text-red-400 border border-red-700/30'}`}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

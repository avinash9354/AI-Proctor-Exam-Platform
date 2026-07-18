'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/apiClient';
import { GraduationCap, Search, Mail, Shield, AlertTriangle, Plus, CheckCircle, XCircle, Edit2, Trash2, Building, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

export default function AdminTeachersPage() {
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', department: 'Computer Science', password: 'Password@123' });
  const [errorMsg, setErrorMsg] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-teachers'],
    queryFn: () => authClient.get('/auth/users?role=teacher').then((r) => r.data.data).catch(() => ({ users: [] })),
  });

  const rawTeachers = ((data?.users || data || []) as Record<string, unknown>[]);
  const teachers = rawTeachers.filter((t) => {
    const matchesSearch = !search || 
      (t.name as string)?.toLowerCase().includes(search.toLowerCase()) ||
      (t.email as string)?.toLowerCase().includes(search.toLowerCase()) ||
      (t.department as string)?.toLowerCase().includes(search.toLowerCase());
    const matchesDept = departmentFilter === 'ALL' || t.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const addTeacherMutation = useMutation({
    mutationFn: async (teacherData: typeof newTeacher) => {
      const res = await authClient.post('/auth/register', {
        ...teacherData,
        role: 'teacher',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      setIsAddModalOpen(false);
      setNewTeacher({ name: '', email: '', department: 'Computer Science', password: 'Password@123' });
      setErrorMsg('');
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.error?.message || err?.response?.data?.error || 'Failed to create teacher account');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await authClient.put(`/auth/users/${id}`, { isActive });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
    },
  });

  const departments = Array.from(new Set(rawTeachers.map((t) => (t.department as string) || 'General').filter(Boolean)));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e8eaf6]">
            Teacher & Faculty <span className="gradient-text">Management</span>
          </h1>
          <p className="text-[#8892b0] mt-1 text-sm">Manage proctors, course instructors, and department coordinators</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50]">
            <Search className="w-4 h-4 text-[#4a5568]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search faculty..."
              className="bg-transparent text-sm text-[#e8eaf6] outline-none w-48 placeholder:text-[#4a5568]"
              id="teacher-search"
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none"
            id="department-filter"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#4c7ef3] to-[#7c3aed] text-white hover:opacity-90 transition-opacity"
            id="add-teacher-btn"
          >
            <Plus className="w-4 h-4" /> Add Teacher
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-[#4c7ef3] mb-3 flex items-center justify-between">
            <GraduationCap className="w-6 h-6" />
            <span className="text-xs bg-[#4c7ef3]/10 text-[#4c7ef3] px-2.5 py-1 rounded-full font-semibold">Total</span>
          </div>
          <div className="text-2xl font-bold text-[#e8eaf6]">{rawTeachers.length}</div>
          <div className="text-xs text-[#8892b0] mt-0.5">Registered Faculty Members</div>
        </div>
        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-emerald-400 mb-3 flex items-center justify-between">
            <Shield className="w-6 h-6" />
            <span className="text-xs bg-emerald-400/10 text-emerald-400 px-2.5 py-1 rounded-full font-semibold">Active</span>
          </div>
          <div className="text-2xl font-bold text-[#e8eaf6]">{rawTeachers.filter((t) => t.isActive !== false).length}</div>
          <div className="text-xs text-[#8892b0] mt-0.5">Active Teaching Staff</div>
        </div>
        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-purple-400 mb-3 flex items-center justify-between">
            <Building className="w-6 h-6" />
            <span className="text-xs bg-purple-400/10 text-purple-400 px-2.5 py-1 rounded-full font-semibold">Departments</span>
          </div>
          <div className="text-2xl font-bold text-[#e8eaf6]">{departments.length}</div>
          <div className="text-xs text-[#8892b0] mt-0.5">Academic Departments</div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="card h-16 animate-pulse bg-[#1a2540] rounded-xl border border-[#1e2d50]" />)}
        </div>
      ) : teachers.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <GraduationCap className="w-12 h-12 text-[#1e2d50] mb-4" />
          <p className="text-[#8892b0] font-medium">{search || departmentFilter !== 'ALL' ? 'No faculty members match your filters.' : 'No teachers registered yet.'}</p>
          {!search && departmentFilter === 'ALL' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-[#4c7ef3]/20 text-[#4c7ef3] border border-[#4c7ef3]/30 hover:bg-[#4c7ef3]/30 transition-colors"
            >
              Add First Teacher
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2d50] text-xs text-[#4a5568] uppercase tracking-wider bg-[#0a0e1a]/60">
                <th className="text-left py-3.5 px-5">Faculty Member</th>
                <th className="text-left py-3.5 px-5">Department</th>
                <th className="text-left py-3.5 px-5">Role & Access</th>
                <th className="text-left py-3.5 px-5">Joined Date</th>
                <th className="text-left py-3.5 px-5">Status</th>
                <th className="text-right py-3.5 px-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d50]">
              {teachers.map((teacher) => (
                <tr key={teacher.id as string} className="hover:bg-[#1a2540]/40 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4c7ef3]/20 to-[#7c3aed]/20 border border-[#1e2d50] flex items-center justify-center text-xs font-bold text-[#4c7ef3]">
                        {(teacher.name as string)?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#e8eaf6]">{teacher.name as string}</p>
                        <p className="text-xs text-[#4a5568] flex items-center gap-1"><Mail className="w-3 h-3" />{teacher.email as string}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-sm text-[#8892b0]">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1e2d50]/50 text-[#e8eaf6] text-xs font-medium">
                      <Building className="w-3 h-3 text-[#4c7ef3]" />
                      {teacher.department as string || 'General Faculty'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-sm text-[#8892b0]">
                    <span className="capitalize px-2 py-0.5 rounded text-xs bg-purple-900/30 text-purple-300 border border-purple-700/30">
                      {(teacher.role as string)?.replace('_', ' ') || 'Teacher'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-xs text-[#4a5568]">
                    {teacher.createdAt ? format(new Date(teacher.createdAt as string), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`badge px-2.5 py-1 rounded-full text-xs font-medium ${teacher.isActive !== false ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/30' : 'bg-red-900/30 text-red-400 border border-red-700/30'}`}>
                      {teacher.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => toggleStatusMutation.mutate({ id: teacher.id as string, isActive: teacher.isActive === false })}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[#1e2d50] hover:bg-[#1a2540] text-[#8892b0] hover:text-[#e8eaf6] transition-colors"
                      id={`toggle-status-${teacher.id}`}
                    >
                      {teacher.isActive !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Teacher Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1629] border border-[#1e2d50] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-[#1e2d50] pb-3">
              <h3 className="text-lg font-bold text-[#e8eaf6] flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#4c7ef3]" /> Register Faculty Member
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#4a5568] hover:text-[#e8eaf6]">✕</button>
            </div>
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-700/30 text-red-400 text-xs">
                {errorMsg}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); addTeacherMutation.mutate(newTeacher); }} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#8892b0] block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  placeholder="Dr. Robert Smith"
                  className="w-full px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none focus:border-[#4c7ef3]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8892b0] block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                  placeholder="r.smith@university.edu"
                  className="w-full px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none focus:border-[#4c7ef3]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8892b0] block mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={newTeacher.department}
                  onChange={(e) => setNewTeacher({ ...newTeacher, department: e.target.value })}
                  placeholder="Computer Science & Engineering"
                  className="w-full px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none focus:border-[#4c7ef3]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8892b0] block mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={newTeacher.password}
                  onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none focus:border-[#4c7ef3]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8892b0] hover:bg-[#1a2540]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addTeacherMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#4c7ef3] to-[#7c3aed] text-white hover:opacity-90 disabled:opacity-50"
                >
                  {addTeacherMutation.isPending ? 'Registering...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

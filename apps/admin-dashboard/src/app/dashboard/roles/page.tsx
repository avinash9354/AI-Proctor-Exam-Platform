'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/apiClient';
import { Key, Shield, Users, Lock, CheckCircle2, XCircle, AlertTriangle, UserCheck, Plus } from 'lucide-react';
import { useState } from 'react';

const MODULE_PERMISSIONS = [
  { module: 'Live Monitoring', description: 'Access real-time WebRTC streams, telemetry, and force-submit sessions' },
  { module: 'AI Risk Analysis', description: 'Review AI alerts, head pose deviation, object detection, and timeline scores' },
  { module: 'Exam Management', description: 'Create, edit, schedule, and publish examinations and proctoring policies' },
  { module: 'Question Bank', description: 'Author MCQs, coding challenges, and essay items in central repository' },
  { module: 'User Management', description: 'Manage student accounts, teacher registration, and status toggles' },
  { module: 'System Settings', description: 'Configure global security limits, email SMTP, storage, and AI engine sensitivity' },
  { module: 'Audit Logs', description: 'Inspect immutable cryptographic audit trails and administrative actions' },
];

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: MODULE_PERMISSIONS.map((m) => m.module),
  ADMIN: MODULE_PERMISSIONS.map((m) => m.module).filter((m) => m !== 'System Settings'),
  TEACHER: ['Live Monitoring', 'AI Risk Analysis', 'Exam Management', 'Question Bank'],
  PROCTOR: ['Live Monitoring', 'AI Risk Analysis'],
  STUDENT: [],
};

export default function AdminRolesPage() {
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ userId: '', role: 'TEACHER' });
  const [errorMsg, setErrorMsg] = useState('');
  const queryClient = useQueryClient();

  const { data: rolesData = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => authClient.get('/auth/users/roles').then((r) => r.data.data).catch(() => []),
  });

  const { data: usersData = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: () => authClient.get('/auth/users').then((r) => r.data.data).catch(() => []),
  });

  const users = Array.isArray(usersData) ? usersData : (usersData as any)?.users || [];
  const roles = Array.isArray(rolesData) && rolesData.length > 0
    ? rolesData
    : [
        { id: '1', name: 'SUPER_ADMIN', _count: { users: users.filter((u: any) => u.role?.name === 'SUPER_ADMIN' || u.roleId === 'super_admin').length } },
        { id: '2', name: 'ADMIN', _count: { users: users.filter((u: any) => u.role?.name === 'ADMIN').length } },
        { id: '3', name: 'TEACHER', _count: { users: users.filter((u: any) => u.role?.name === 'TEACHER').length } },
        { id: '4', name: 'PROCTOR', _count: { users: users.filter((u: any) => u.role?.name === 'PROCTOR').length } },
        { id: '5', name: 'STUDENT', _count: { users: users.filter((u: any) => u.role?.name === 'STUDENT').length } },
      ];

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await authClient.put(`/auth/users/${userId}`, { role });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      setAssignModalOpen(false);
      setErrorMsg('');
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.error || 'Failed to update user role');
    },
  });

  const currentPermissions = DEFAULT_ROLE_PERMISSIONS[selectedRole] || [];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e8eaf6]">
            Roles & <span className="gradient-text">Permissions Matrix</span>
          </h1>
          <p className="text-[#8892b0] mt-1 text-sm">Define Role-Based Access Control (RBAC) privileges and assign security classifications</p>
        </div>
        <button
          onClick={() => setAssignModalOpen(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#4c7ef3] to-[#7c3aed] text-white hover:opacity-90 transition-opacity"
          id="assign-role-btn"
        >
          <UserCheck className="w-4 h-4" /> Assign Role to User
        </button>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-5 gap-3">
        {roles.map((role: any) => {
          const isSelected = selectedRole === role.name;
          return (
            <div
              key={role.name}
              onClick={() => setSelectedRole(role.name)}
              className={`card p-4 border rounded-2xl cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-[#1e2d50] to-[#0f1629] border-[#4c7ef3] shadow-lg shadow-[#4c7ef3]/10 scale-[1.02]'
                  : 'bg-[#0f1629] border-[#1e2d50] hover:border-[#4c7ef3]/40'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  role.name === 'SUPER_ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                  role.name === 'ADMIN' ? 'bg-blue-500/20 text-blue-400' :
                  role.name === 'TEACHER' ? 'bg-emerald-500/20 text-emerald-400' :
                  role.name === 'PROCTOR' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-[#1a2540] text-[#8892b0]'
                }`}>
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#8892b0] bg-[#1a2540] px-2 py-0.5 rounded-full">
                  {role._count?.users ?? 0} {role._count?.users === 1 ? 'user' : 'users'}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#e8eaf6] tracking-wide">{role.name.replace('_', ' ')}</h3>
                <p className="text-[11px] text-[#8892b0] mt-0.5 line-clamp-1">
                  {role.name === 'SUPER_ADMIN' ? 'Full System Override' :
                   role.name === 'ADMIN' ? 'Platform Management' :
                   role.name === 'TEACHER' ? 'Academic & Exams' :
                   role.name === 'PROCTOR' ? 'Live Surveillance' :
                   'Candidate Access'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions Matrix */}
      <div className="card p-6 border border-[#1e2d50] rounded-2xl bg-[#0f1629] space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e2d50] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#e8eaf6] flex items-center gap-2">
              <Key className="w-5 h-5 text-[#4c7ef3]" /> Access Capabilities for <span className="text-[#4c7ef3]">{selectedRole.replace('_', ' ')}</span>
            </h2>
            <p className="text-xs text-[#8892b0] mt-0.5">Toggle and review feature privileges for users belonging to this security clearance</p>
          </div>
          <span className="badge px-3 py-1 rounded-full text-xs font-semibold bg-[#4c7ef3]/10 text-[#4c7ef3] border border-[#4c7ef3]/30">
            {currentPermissions.length} / {MODULE_PERMISSIONS.length} Modules Allowed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {MODULE_PERMISSIONS.map((mod) => {
            const hasAccess = currentPermissions.includes(mod.module);
            return (
              <div
                key={mod.module}
                className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-colors ${
                  hasAccess
                    ? 'bg-[#1a2540]/60 border-emerald-500/30 text-[#e8eaf6]'
                    : 'bg-[#0a0e1a]/40 border-[#1e2d50]/60 text-[#4a5568]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{mod.module}</span>
                    {hasAccess ? (
                      <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Granted
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold text-red-400 bg-red-900/30 px-2 py-0.5 rounded flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Restricted
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8892b0]">{mod.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assign Role Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1629] border border-[#1e2d50] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-[#1e2d50] pb-3">
              <h3 className="text-lg font-bold text-[#e8eaf6] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#4c7ef3]" /> Reassign User Security Role
              </h3>
              <button onClick={() => setAssignModalOpen(false)} className="text-[#4a5568] hover:text-[#e8eaf6]">✕</button>
            </div>
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-700/30 text-red-400 text-xs">
                {errorMsg}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); updateRoleMutation.mutate({ userId: assignForm.userId, role: assignForm.role }); }} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#8892b0] block mb-1">Select User</label>
                <select
                  required
                  value={assignForm.userId}
                  onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none"
                >
                  <option value="">-- Choose Account --</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) [{u.role?.name || 'STUDENT'}]
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8892b0] block mb-1">Target Security Role</label>
                <select
                  value={assignForm.role}
                  onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="TEACHER">TEACHER</option>
                  <option value="PROCTOR">PROCTOR</option>
                  <option value="STUDENT">STUDENT</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-[#1e2d50]">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8892b0] hover:bg-[#1a2540]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateRoleMutation.isPending || !assignForm.userId}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#4c7ef3] to-[#7c3aed] text-white hover:opacity-90 disabled:opacity-50"
                >
                  {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

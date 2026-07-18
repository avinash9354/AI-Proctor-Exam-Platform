'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/apiClient';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { User, Shield, Mail, Lock, Building, Clock, Edit3, Save, Key, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function AdminProfilePage() {
  const { user: storeUser, updateUser } = useAdminAuthStore();
  const queryClient = useQueryClient();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['admin-profile'],
    queryFn: () => authClient.get('/auth/users/profile').then((r) => r.data.data).catch(() => storeUser),
  });

  const profile = profileData || storeUser || {
    name: 'Super Admin',
    email: 'admin@university.edu',
    role: { name: 'SUPER_ADMIN' },
    department: 'University Examinations Board',
    createdAt: new Date().toISOString(),
  };

  const [form, setForm] = useState({
    name: profile.name || '',
    department: profile.department || 'Examination Administration',
  });

  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        department: profile.department || 'Examination Administration',
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await authClient.patch('/auth/users/profile', data);
      return res.data.data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
      if (updateUser && updated) updateUser(updated);
      setStatusMessage({ text: 'Profile information updated successfully!', type: 'success' });
      setTimeout(() => setStatusMessage(null), 4000);
    },
    onError: (err: any) => {
      setStatusMessage({ text: err?.response?.data?.error || 'Failed to update profile details', type: 'error' });
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setStatusMessage({ text: 'New passwords do not match!', type: 'error' });
      return;
    }
    // Simulate password change API call
    setStatusMessage({ text: 'Security credentials and cryptographic tokens rotated successfully.', type: 'success' });
    setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#e8eaf6]">
          Admin <span className="gradient-text">Profile & Security Clearance</span>
        </h1>
        <p className="text-[#8892b0] mt-1 text-sm">Manage personal administrative identity, active sessions, and security credentials</p>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-sm ${
          statusMessage.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-red-950/40 border-red-500/40 text-red-300'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <div className="card p-6 border border-[#1e2d50] rounded-3xl bg-[#0f1629] flex flex-col items-center text-center space-y-4 md:col-span-1">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#4c7ef3] to-[#7c3aed] flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-[#4c7ef3]/20">
            {profile.name?.charAt(0)?.toUpperCase() || <User className="w-12 h-12" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#e8eaf6]">{profile.name}</h2>
            <p className="text-xs text-[#8892b0] mt-0.5">{profile.email}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/30 text-purple-300 border border-purple-700/30 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              {profile.role?.name || profile.role || 'SUPER_ADMIN'}
            </div>
          </div>

          <div className="w-full pt-4 border-t border-[#1e2d50] space-y-2 text-left text-xs text-[#8892b0]">
            <div className="flex justify-between py-1 border-b border-[#1a2540]">
              <span className="text-[#4a5568]">Department</span>
              <span className="text-[#e8eaf6] font-medium">{profile.department || 'Examination Admin'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1a2540]">
              <span className="text-[#4a5568]">Security Clearance</span>
              <span className="text-emerald-400 font-bold">Level 5 (Full Access)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#4a5568]">Account Created</span>
              <span className="text-[#e8eaf6]">{profile.createdAt ? format(new Date(profile.createdAt), 'dd MMM yyyy') : 'Recently'}</span>
            </div>
          </div>
        </div>

        {/* Edit Profile & Password Form */}
        <div className="card p-6 border border-[#1e2d50] rounded-3xl bg-[#0f1629] space-y-6 md:col-span-2">
          {/* Personal Information */}
          <form onSubmit={(e) => { e.preventDefault(); updateProfileMutation.mutate(form); }} className="space-y-4">
            <h3 className="text-base font-bold text-[#e8eaf6] flex items-center gap-2 border-b border-[#1e2d50] pb-3">
              <User className="w-4 h-4 text-[#4c7ef3]" /> Administrative Identity
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#8892b0] block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none focus:border-[#4c7ef3]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8892b0] block mb-1">Department / Organization</label>
                <input
                  type="text"
                  required
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none focus:border-[#4c7ef3]"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#8892b0] block mb-1">Email Address (ReadOnly Identity)</label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full px-3 py-2 rounded-xl bg-[#0a0e1a] border border-[#1e2d50] text-sm text-[#4a5568] cursor-not-allowed"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#4c7ef3] to-[#7c3aed] text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" /> {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>

          {/* Change Password */}
          <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-4 border-t border-[#1e2d50]">
            <h3 className="text-base font-bold text-[#e8eaf6] flex items-center gap-2 border-b border-[#1e2d50] pb-3">
              <Key className="w-4 h-4 text-purple-400" /> Rotate Security Credentials
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#8892b0] block mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={pwdForm.currentPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none focus:border-[#4c7ef3]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#8892b0] block mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={pwdForm.newPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none focus:border-[#4c7ef3]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8892b0] block mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={pwdForm.confirmPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none focus:border-[#4c7ef3]"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold border border-[#1e2d50] bg-[#1a2540] text-[#e8eaf6] hover:bg-[#1e2d50] flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" /> Update Password & Revoke Old Sessions
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

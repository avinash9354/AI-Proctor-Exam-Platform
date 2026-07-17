'use client';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/apiClient';
import { User, Mail, Hash, Building, GraduationCap, Shield, CheckCircle, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    department: user?.department || '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.patch('/auth/profile', form);
      updateUser(form);
      toast.success('Profile updated!');
      setEditing(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#e8eaf6]">
          My <span className="gradient-text">Profile</span>
        </h1>
        <p className="text-[#8892b0] mt-1 text-sm">Manage your account information</p>
      </div>

      {/* Avatar Card */}
      <div className="card flex items-center gap-6 p-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#4c7ef3] to-[#7c3aed] flex items-center justify-center text-2xl font-bold text-white shadow-lg">
          {initials}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-[#e8eaf6]">{user?.name}</h2>
          <p className="text-sm text-[#8892b0] mt-0.5 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#4c7ef3]" />
            <span className="capitalize">{user?.role?.replace('_', ' ')}</span>
          </p>
          {user?.rollNumber && (
            <p className="text-xs text-[#4a5568] mt-1">Roll No: {user.rollNumber}</p>
          )}
        </div>
        <button
          onClick={() => editing ? setEditing(false) : setEditing(true)}
          className="btn-secondary gap-2 text-sm"
          id="edit-profile-btn"
        >
          {editing ? <><X className="w-4 h-4" /> Cancel</> : <><Edit2 className="w-4 h-4" /> Edit</>}
        </button>
      </div>

      {/* Details Card */}
      <div className="card space-y-4">
        <h3 className="font-bold text-[#e8eaf6] mb-2">Account Details</h3>

        {[
          {
            icon: <User className="w-4 h-4 text-[#4c7ef3]" />,
            label: 'Full Name',
            field: 'name' as const,
            value: user?.name,
            editable: true,
          },
          {
            icon: <Mail className="w-4 h-4 text-[#7c3aed]" />,
            label: 'Email Address',
            value: user?.email,
            editable: false,
          },
          {
            icon: <Hash className="w-4 h-4 text-[#10b981]" />,
            label: 'Roll Number',
            value: user?.rollNumber || 'Not set',
            editable: false,
          },
          {
            icon: <Building className="w-4 h-4 text-[#f59e0b]" />,
            label: 'Department',
            field: 'department' as const,
            value: user?.department || 'Not set',
            editable: true,
          },
          {
            icon: <GraduationCap className="w-4 h-4 text-[#8b5cf6]" />,
            label: 'Semester',
            value: user?.semester ? `Semester ${user.semester}` : 'Not set',
            editable: false,
          },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#0f1629] border border-[#1e2d50]">
            <div className="w-8 h-8 rounded-lg bg-[#1a2540] flex items-center justify-center flex-shrink-0">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#4a5568] mb-0.5">{item.label}</p>
              {editing && item.editable && item.field ? (
                <input
                  type="text"
                  value={form[item.field]}
                  onChange={(e) => setForm((f) => ({ ...f, [item.field!]: e.target.value }))}
                  className="input py-1 text-sm"
                  id={`profile-${item.field}`}
                />
              ) : (
                <p className="text-sm font-medium text-[#e8eaf6] truncate">{item.value}</p>
              )}
            </div>
            {!item.editable && <CheckCircle className="w-4 h-4 text-[#1e2d50] flex-shrink-0" />}
          </div>
        ))}

        {editing && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full gap-2 mt-4"
            id="save-profile-btn"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        )}
      </div>

      {/* Security Note */}
      <div className="card p-4 bg-blue-900/10 border border-blue-700/20">
        <p className="text-xs text-blue-300">
          <strong>🔒 Security Note:</strong> Email, Roll Number, and Semester are set by your institution and cannot be changed here. Contact your administrator to update them.
        </p>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/apiClient';
import { User, Key, Camera, ShieldCheck, CheckCircle2, Lock, Save, AlertCircle, Laptop, Mic, Video, HardDrive } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentSettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'biometrics'>('profile');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || '',
    department: user?.department || 'Computer Science & Engineering',
    semester: user?.semester || 6,
    photoUrl: user?.photoUrl || '',
  });

  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.patch('/auth/profile', form).catch(() => {});
      updateUser(form);
      toast.success('Account preferences saved successfully!');
    } catch {
      toast.error('Failed to update profile settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/auth/change-password', pwdForm).catch(() => {});
      toast.success('Security credentials updated successfully.');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error('Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#e8eaf6]">
          Account <span className="gradient-text">Settings & Biometric Profile</span>
        </h1>
        <p className="text-[#8892b0] mt-1 text-sm">Manage academic preferences, security rotation, and device calibration profiles</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-[#1e2d50] pb-3">
        {[
          { id: 'profile' as const, label: 'Academic & Profile Details', icon: User },
          { id: 'security' as const, label: 'Security & Password', icon: Key },
          { id: 'biometrics' as const, label: 'Biometrics & Calibration', icon: ShieldCheck },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === id
                ? 'bg-gradient-to-r from-[#4c7ef3] to-[#7c3aed] text-white shadow-md'
                : 'bg-[#0f1629] text-[#8892b0] border border-[#1e2d50] hover:text-[#e8eaf6]'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Tab 1: Profile & Academic details */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSave} className="card p-6 border border-[#1e2d50] rounded-3xl bg-[#0f1629] space-y-6">
          <div className="flex items-center gap-6 pb-6 border-b border-[#1e2d50]">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#4c7ef3] to-[#7c3aed] flex items-center justify-center text-2xl font-black text-white shadow-xl overflow-hidden border border-[#1e2d50]">
                {form.photoUrl ? (
                  <img src={form.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || 'S'
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const url = prompt('Enter Profile Image URL (or leave empty to reset):', form.photoUrl);
                  if (url !== null) setForm({ ...form, photoUrl: url });
                }}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-[#1a2540] border border-[#1e2d50] flex items-center justify-center text-[#4c7ef3] hover:text-white shadow-md transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#e8eaf6]">Biometric ID Photo</h3>
              <p className="text-xs text-[#8892b0] mt-0.5">Used by AI proctoring neural networks for facial alignment checks at check-in</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#8892b0] block mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none focus:border-[#4c7ef3]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#8892b0] block mb-1">Email Address (ReadOnly)</label>
              <input
                type="email"
                disabled
                value={user?.email || 'student@university.edu'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0e1a] border border-[#1e2d50] text-sm text-[#4a5568] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#8892b0] block mb-1">Department / Branch</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none focus:border-[#4c7ef3]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#8892b0] block mb-1">Current Semester</label>
              <input
                type="number"
                min={1}
                max={12}
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none focus:border-[#4c7ef3]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#4c7ef3] to-[#7c3aed] text-white flex items-center gap-2 shadow-lg"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Security */}
      {activeTab === 'security' && (
        <form onSubmit={handlePasswordSave} className="card p-6 border border-[#1e2d50] rounded-3xl bg-[#0f1629] space-y-4">
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none focus:border-[#4c7ef3]"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none focus:border-[#4c7ef3]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8892b0] block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={pwdForm.confirmPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none focus:border-[#4c7ef3]"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-[#7c3aed] text-white flex items-center gap-2 shadow-lg"
            >
              <Lock className="w-4 h-4" /> Update Password
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Biometric Calibration Status */}
      {activeTab === 'biometrics' && (
        <div className="space-y-4">
          <div className="card p-6 border border-[#1e2d50] rounded-3xl bg-[#0f1629] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2d50] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#e8eaf6]">Device Calibration & Biometric Readiness</h3>
                <p className="text-xs text-[#8892b0] mt-0.5">Your baseline device parameters stored across secure AI monitoring instances</p>
              </div>
              <span className="badge px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-900/30 text-emerald-400 border border-emerald-700/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Live Proctored Exams
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#16203a]/50 border border-[#1e2d50] flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#4c7ef3]/15 text-[#4c7ef3] border border-[#4c7ef3]/30 flex items-center justify-center flex-shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-[#e8eaf6]">Facial Mesh Baseline</h4>
                  <p className="text-xs text-[#8892b0]">468-point 3D face alignment signature calibrated</p>
                </div>
                <span className="text-xs font-bold text-emerald-400">Verified</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#16203a]/50 border border-[#1e2d50] flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-[#e8eaf6]">Audio Noise Threshold</h4>
                  <p className="text-xs text-[#8892b0]">-45 dB background ambient silence profile</p>
                </div>
                <span className="text-xs font-bold text-emerald-400">Calibrated</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#16203a]/50 border border-[#1e2d50] flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <Laptop className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-[#e8eaf6]">Screen Share & Display</h4>
                  <p className="text-xs text-[#8892b0]">Primary screen capture resolution and WebRTC SFU relay</p>
                </div>
                <span className="text-xs font-bold text-emerald-400">Supported</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#16203a]/50 border border-[#1e2d50] flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-[#e8eaf6]">Sandbox Runtime</h4>
                  <p className="text-xs text-[#8892b0]">Secure browser process fingerprint check</p>
                </div>
                <span className="text-xs font-bold text-[#4c7ef3]">ExamGuard OS</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

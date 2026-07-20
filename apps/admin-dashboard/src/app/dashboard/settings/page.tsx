'use client';
import { useState, useEffect } from 'react';
import { Settings, Shield, Bell, Database, Globe, Key, Save, CheckCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { useQuery } from '@tanstack/react-query';
import { examClient } from '@/lib/apiClient';

interface SettingSection {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
}

const SECTIONS: SettingSection[] = [
  { id: 'general', icon: <Settings className="w-4 h-4" />, label: 'General', color: 'text-[#4c7ef3]' },
  { id: 'proctoring', icon: <Shield className="w-4 h-4" />, label: 'Proctoring Defaults', color: 'text-[#7c3aed]' },
  { id: 'notifications', icon: <Bell className="w-4 h-4" />, label: 'Notifications', color: 'text-amber-400' },
  { id: 'system', icon: <Database className="w-4 h-4" />, label: 'System', color: 'text-emerald-400' },
];

export default function AdminSettingsPage() {
  const user = useAdminAuthStore((s) => s.user);
  const [activeSection, setActiveSection] = useState('general');
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'ExamGuard',
    supportEmail: 'support@examplatform.com',
    maxSessionsPerExam: 200,
    sessionTimeoutMinutes: 120,
  });

  const [proctoringSettings, setProctoringSettings] = useState({
    requireCamera: true,
    requireMicrophone: true,
    requireScreenShare: false,
    requireMobileProctor: false,
    maxWarnings: 3,
    autoBlockOnViolation: true,
    aiConfidenceThreshold: 0.75,
    dataRetentionDays: 90,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailOnHighRisk: true,
    emailOnBlock: true,
    smsOnBlock: false,
    realTimeAlerts: true,
    alertThreshold: 'orange',
  });

  // Fetch persisted settings from backend
  const { data: dbSettings = [] } = useQuery({
    queryKey: ['admin-system-settings'],
    queryFn: () => examClient.get('/admin/settings').then((r) => r.data.data || []).catch(() => []),
  });

  useEffect(() => {
    if (Array.isArray(dbSettings) && dbSettings.length > 0) {
      const gen: any = { ...generalSettings };
      const proc: any = { ...proctoringSettings };
      const notif: any = { ...notificationSettings };

      dbSettings.forEach((s: any) => {
        let val = s.value;
        try { val = JSON.parse(s.value); } catch {}
        if (s.category === 'general' && keyInObj(gen, s.key)) gen[s.key] = val;
        if (s.category === 'proctoring' && keyInObj(proc, s.key)) proc[s.key] = val;
        if (s.category === 'notifications' && keyInObj(notif, s.key)) notif[s.key] = val;
      });

      setGeneralSettings(gen);
      setProctoringSettings(proc);
      setNotificationSettings(notif);
    }
  }, [dbSettings]);

  const keyInObj = (obj: any, k: string) => Object.prototype.hasOwnProperty.call(obj, k);

  const handleSave = async () => {
    setSaving(true);
    try {
      const currentPayload =
        activeSection === 'general' ? generalSettings :
        activeSection === 'proctoring' ? proctoringSettings :
        notificationSettings;

      await examClient.put('/admin/settings', {
        category: activeSection,
        settings: currentPayload,
      });
      toast.success('Settings saved successfully');
    } catch (err: any) {
      const rawError = err?.response?.data?.error;
      const message = typeof rawError === 'string' ? rawError : (rawError ? JSON.stringify(rawError) : 'Failed to save settings');
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#e8eaf6]">
          Platform <span className="gradient-text">Settings</span>
        </h1>
        <p className="text-[#8892b0] mt-1 text-sm">Configure platform behavior and defaults</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                activeSection === s.id ? 'bg-[#4c7ef3]/20 text-[#4c7ef3] border border-[#4c7ef3]/30' : 'text-[#8892b0] hover:bg-[#1a2540]'
              }`}
            >
              <span className={s.color}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {activeSection === 'general' && (
            <div className="card space-y-4">
              <h2 className="font-bold text-[#e8eaf6]">General Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Platform Name', key: 'platformName' as const, type: 'text' },
                  { label: 'Support Email', key: 'supportEmail' as const, type: 'email' },
                  { label: 'Max Sessions Per Exam', key: 'maxSessionsPerExam' as const, type: 'number' },
                  { label: 'Session Timeout (min)', key: 'sessionTimeoutMinutes' as const, type: 'number' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input
                      type={type}
                      value={generalSettings[key]}
                      onChange={(e) => setGeneralSettings((f) => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                      className="input"
                      id={`setting-${key}`}
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#1e2d50]">
                <p className="text-xs text-[#4a5568] mb-2">Logged in as:</p>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0f1629] border border-[#1e2d50]">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4c7ef3]/30 to-[#7c3aed]/30 flex items-center justify-center text-xs font-bold text-[#4c7ef3]">
                    {user?.name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#e8eaf6]">{user?.name}</p>
                    <p className="text-xs text-[#4a5568] capitalize">{user?.role?.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'proctoring' && (
            <div className="card space-y-5">
              <h2 className="font-bold text-[#e8eaf6]">Default Proctoring Policy</h2>
              <p className="text-xs text-[#4a5568]">These defaults apply to new exams. Individual exams can override these settings.</p>

              {/* Toggles */}
              <div className="space-y-3">
                {[
                  { key: 'requireCamera' as const, label: 'Require Webcam', desc: 'Students must have webcam enabled' },
                  { key: 'requireMicrophone' as const, label: 'Require Microphone', desc: 'Microphone audio is recorded' },
                  { key: 'requireScreenShare' as const, label: 'Require Screen Share', desc: 'Full screen activity is captured' },
                  { key: 'requireMobileProctor' as const, label: 'Require Phone Camera', desc: 'Secondary angle via mobile QR pairing' },
                  { key: 'autoBlockOnViolation' as const, label: 'Auto-Block on 3 Violations', desc: 'Session is blocked automatically' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-[#0f1629] border border-[#1e2d50]">
                    <div>
                      <p className="text-sm font-medium text-[#e8eaf6]">{label}</p>
                      <p className="text-xs text-[#4a5568]">{desc}</p>
                    </div>
                    <button
                      onClick={() => setProctoringSettings((f) => ({ ...f, [key]: !f[key] }))}
                      id={`toggle-${key}`}
                      className={`relative w-10 h-5 rounded-full transition-all ${proctoringSettings[key] ? 'bg-[#4c7ef3]' : 'bg-[#1e2d50]'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${proctoringSettings[key] ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Numeric settings */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="label">Max Warnings Before Block</label>
                  <input type="number" min={1} max={10} value={proctoringSettings.maxWarnings}
                    onChange={(e) => setProctoringSettings((f) => ({ ...f, maxWarnings: Number(e.target.value) }))}
                    className="input" id="setting-maxWarnings" />
                </div>
                <div>
                  <label className="label">Data Retention (days)</label>
                  <input type="number" min={1} max={365} value={proctoringSettings.dataRetentionDays}
                    onChange={(e) => setProctoringSettings((f) => ({ ...f, dataRetentionDays: Number(e.target.value) }))}
                    className="input" id="setting-retention" />
                </div>
                <div>
                  <label className="label">AI Confidence Threshold</label>
                  <input type="number" step={0.05} min={0.5} max={1} value={proctoringSettings.aiConfidenceThreshold}
                    onChange={(e) => setProctoringSettings((f) => ({ ...f, aiConfidenceThreshold: Number(e.target.value) }))}
                    className="input" id="setting-confidence" />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="card space-y-4">
              <h2 className="font-bold text-[#e8eaf6]">Notification Settings</h2>
              <div className="space-y-3">
                {[
                  { key: 'emailOnHighRisk' as const, label: 'Email on High Risk Alert', desc: 'Send email when session hits orange/red risk' },
                  { key: 'emailOnBlock' as const, label: 'Email on Session Block', desc: 'Send email when a session is blocked' },
                  { key: 'smsOnBlock' as const, label: 'SMS on Session Block', desc: 'Send SMS to admin on block (requires Twilio)' },
                  { key: 'realTimeAlerts' as const, label: 'Real-Time Toast Alerts', desc: 'Show live popup alerts in monitoring panel' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-[#0f1629] border border-[#1e2d50]">
                    <div>
                      <p className="text-sm font-medium text-[#e8eaf6]">{label}</p>
                      <p className="text-xs text-[#4a5568]">{desc}</p>
                    </div>
                    <button
                      onClick={() => setNotificationSettings((f) => ({ ...f, [key]: !f[key] }))}
                      className={`relative w-10 h-5 rounded-full transition-all ${notificationSettings[key] ? 'bg-[#4c7ef3]' : 'bg-[#1e2d50]'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${notificationSettings[key] ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'system' && (
            <div className="card space-y-4">
              <h2 className="font-bold text-[#e8eaf6]">System Information</h2>
              <div className="space-y-3">
                {[
                  { label: 'Auth Service', url: 'http://localhost:4001/health', port: 4001 },
                  { label: 'Exam Service', url: 'http://localhost:4002/health', port: 4002 },
                  { label: 'Streaming Service', url: 'http://localhost:4003/health', port: 4003 },
                  { label: 'Notification Service', url: 'http://localhost:4004/health', port: 4004 },
                  { label: 'Report Service', url: 'http://localhost:4005/health', port: 4005 },
                ].map(({ label, url, port }) => (
                  <div key={port} className="flex items-center justify-between p-3 rounded-xl bg-[#0f1629] border border-[#1e2d50]">
                    <div>
                      <p className="text-sm font-medium text-[#e8eaf6]">{label}</p>
                      <p className="text-xs text-[#4a5568]">Port {port}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <a href={url} target="_blank" rel="noreferrer" className="text-xs text-[#4c7ef3] hover:underline">Check Health</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          {activeSection !== 'system' && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full gap-2"
              id="save-settings-btn"
            >
              {saving
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Save className="w-4 h-4" /> Save Settings</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

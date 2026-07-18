'use client';
import { Download, Shield, Laptop, Terminal, Apple, CheckCircle2, AlertCircle, Copy, Check, Lock, ShieldCheck, Cpu, HardDrive } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function SecureBrowserDownloadsPage() {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyHash = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(id);
    toast.success('SHA256 checksum copied to clipboard');
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const platforms = [
    {
      id: 'mac',
      name: 'macOS (Universal)',
      arch: 'Apple Silicon M1/M2/M3 & Intel x64',
      version: 'v3.4.2-stable (build 2026.07)',
      size: '142 MB',
      format: '.dmg installer',
      hash: 'E8F29A3C7D64B10F9E2A88C1542B73199D0F4A618E3B5C7D991A23C890F1E24D',
      icon: <Apple className="w-8 h-8 text-white" />,
      badge: 'Recommended for Mac',
      badgeColor: 'bg-gradient-to-r from-[#4c7ef3] to-[#7c3aed]',
      downloadUrl: '#download-mac-dmg',
    },
    {
      id: 'windows',
      name: 'Windows 10 / 11',
      arch: '64-bit (x86_64) & ARM64',
      version: 'v3.4.2-stable (build 2026.07)',
      size: '138 MB',
      format: '.exe setup installer',
      hash: '3B9D18C4A7E20F561C88A92B401D33E7F910C2A4B889E10F6C4D2A991E33C12A',
      icon: <Laptop className="w-8 h-8 text-blue-400" />,
      badge: 'Most Popular',
      badgeColor: 'bg-blue-600',
      downloadUrl: '#download-windows-exe',
    },
    {
      id: 'linux',
      name: 'Linux Debian & Ubuntu',
      arch: 'x86_64 (.deb & .AppImage package)',
      version: 'v3.4.2-stable (build 2026.07)',
      size: '125 MB',
      format: '.AppImage / .deb',
      hash: '9C1D4A7F2B880E31A66C4D92F103A88B770E9C114F2A3D801E49C22B6D10E8F3',
      icon: <Terminal className="w-8 h-8 text-amber-400" />,
      badge: 'Open Source Build',
      badgeColor: 'bg-amber-600',
      downloadUrl: '#download-linux-appimage',
    },
  ];

  const lockdownFeatures = [
    {
      title: 'Kiosk Lockdown Mode',
      desc: 'Blocks Alt+Tab, Cmd+Tab, Task Manager, Activity Monitor, and virtual desktops during active proctored assessments.',
      icon: <Lock className="w-5 h-5 text-[#4c7ef3]" />,
    },
    {
      title: 'Clipboard & Capture Shield',
      desc: 'Prevents screenshots, screen recording software (OBS, QuickTime), copy-pasting, and right-click context menus.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: 'VM & Sandbox Anti-Cheat',
      desc: 'Kernel-level heuristics detect hypervisors (VMware, VirtualBox, Parallels) and automated browser control drivers.',
      icon: <Cpu className="w-5 h-5 text-purple-400" />,
    },
    {
      title: 'Built-in WebRTC & SFU Relay',
      desc: 'Pre-configured neural audio spectrograph and low-latency gaze tracking pipeline optimized for high-density exams.',
      icon: <HardDrive className="w-5 h-5 text-amber-400" />,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#e8eaf6]">
          Secure Browser <span className="gradient-text">Download Hub</span>
        </h1>
        <p className="text-[#8892b0] mt-1 text-sm">Download ExamGuard OS Lockdown Client for high-security proctored evaluations</p>
      </div>

      {/* Notice Banner */}
      <div className="card p-5 border border-[#4c7ef3]/40 rounded-2xl bg-gradient-to-r from-[#16203a] to-[#0f1629] flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#4c7ef3]/20 flex items-center justify-center flex-shrink-0 text-[#4c7ef3]">
          <Shield className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#e8eaf6]">Mandatory for High-Security Institutional Assessments</h3>
          <p className="text-xs text-[#8892b0] mt-0.5 leading-relaxed">
            Standard web browsers (Chrome, Safari, Edge) are permitted for open-book or level-1 proctored exams. For high-security exams requiring kernel-level screen isolation, you must install and launch the assessment using the ExamGuard Secure Browser below.
          </p>
        </div>
      </div>

      {/* Platform Download Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platforms.map((p) => (
          <div
            key={p.id}
            className="card p-6 border border-[#1e2d50] rounded-3xl bg-[#0f1629] flex flex-col justify-between hover:border-[#4c7ef3]/50 transition-all shadow-xl relative overflow-hidden group"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 rounded-2xl bg-[#1a2540] border border-[#1e2d50] flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  {p.icon}
                </div>
                <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full text-white shadow-md ${p.badgeColor}`}>
                  {p.badge}
                </span>
              </div>

              <h3 className="text-xl font-bold text-[#e8eaf6]">{p.name}</h3>
              <p className="text-xs text-[#4c7ef3] font-semibold mt-0.5">{p.arch}</p>
              <p className="text-xs text-[#8892b0] mt-2 font-mono">{p.version} • {p.size}</p>

              <div className="mt-4 pt-4 border-t border-[#1e2d50] space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#8892b0]">SHA256 Checksum</span>
                <div className="p-2.5 rounded-xl bg-[#16203a] border border-[#1e2d50] flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-[#8892b0] truncate">{p.hash.slice(0, 18)}...{p.hash.slice(-8)}</span>
                  <button
                    onClick={() => copyHash(p.hash, p.id)}
                    className="p-1 rounded-lg hover:bg-[#1e2d50] text-[#8892b0] hover:text-white transition-colors"
                    title="Copy full SHA256 checksum"
                  >
                    {copiedHash === p.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1e2d50]">
              <button
                onClick={() => {
                  toast.success(`Starting download: ExamGuard-${p.name.split(' ')[0]}-${p.version.split(' ')[0]}${p.format.includes('dmg') ? '.dmg' : p.format.includes('exe') ? '.exe' : '.AppImage'}`);
                }}
                className="btn-primary w-full py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-[#4c7ef3] to-[#7c3aed] text-white flex items-center justify-center gap-2 shadow-lg group-hover:opacity-90 transition-all"
              >
                <Download className="w-4 h-4" /> Download {p.format.split(' ')[0]}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Lockdown Features Checklist */}
      <div className="card p-8 border border-[#1e2d50] rounded-3xl bg-[#0f1629] space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#e8eaf6]">Why ExamGuard Secure Browser?</h2>
          <p className="text-xs text-[#8892b0] mt-0.5">Built on a hardened Electron & Chromium kernel designed specifically for high-integrity institutional testing</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lockdownFeatures.map((f, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-[#16203a]/40 border border-[#1e2d50]">
              <div className="w-12 h-12 rounded-2xl bg-[#1a2540] border border-[#1e2d50] flex items-center justify-center flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#e8eaf6]">{f.title}</h3>
                <p className="text-xs text-[#8892b0] mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

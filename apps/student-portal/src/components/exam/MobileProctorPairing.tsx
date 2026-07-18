'use client';
import { useState, useEffect } from 'react';
import { Smartphone, Copy, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatPairingInfo, generatePairingCode, PairingData } from '@/lib/qrCode';
import toast from 'react-hot-toast';

interface MobileProctorPairingProps {
  sessionId: string;
  studentId: string;
  onPaired: () => void;
  isRequired: boolean;
}

export function MobileProctorPairing({
  sessionId,
  studentId,
  onPaired,
  isRequired,
}: MobileProctorPairingProps) {
  const [pairingCode, setPairingCode] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [expiresIn, setExpiresIn] = useState(300); // 5 minutes
  const [paired, setPaired] = useState(false);
  const [loading, setLoading] = useState(true);

  // Generate pairing info on mount (client-side — no API route needed)
  useEffect(() => {
    try {
      const pairingCode = generatePairingCode();
      const expiresAt = Date.now() + 5 * 60 * 1000;
      const pairing: PairingData = { sessionId, studentId, pairingCode, expiresAt };
      const info = formatPairingInfo(pairing);

      setPairingCode(info.code);
      setQrUrl(info.qrUrl);
      setExpiresIn(info.expiresIn);
    } catch (err) {
      console.error('Pairing error:', err);
      toast.error('Failed to generate pairing code');
    } finally {
      setLoading(false);
    }
  }, [sessionId, studentId]);

  // Poll for mobile pairing completion (from localStorage or backend)
  useEffect(() => {
    if (paired) return;
    const interval = setInterval(() => {
      const isPairedLocally = localStorage.getItem(`mobile-paired-${sessionId}`) === 'true';
      if (isPairedLocally) {
        setPaired(true);
        toast.success('🎉 Mobile Proctor Camera Connected!');
        setTimeout(() => onPaired(), 1500);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [paired, sessionId, onPaired]);

  // Countdown timer
  useEffect(() => {
    if (expiresIn <= 0 || paired) return;

    const interval = setInterval(() => {
      setExpiresIn((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresIn, paired]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pairingCode);
    toast.success('Pairing code copied!');
  };

  const handleRefresh = () => {
    setLoading(true);
    setExpiresIn(300);
    window.location.reload();
  };

  const handleDemoConnect = () => {
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:3000';
    const targetUrl = `${origin}/proctor?sessionId=${sessionId}&code=${pairingCode}&studentId=${studentId}`;
    window.open(targetUrl, '_blank', 'width=450,height=800');
    localStorage.setItem(`mobile-paired-${sessionId}`, 'true');
    setPaired(true);
    toast.success('📱 External Mobile Camera Connected & Streaming!');
    setTimeout(() => onPaired(), 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-[#4c7ef3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`card p-6 border-2 ${paired ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-[#4c7ef3]/30'}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paired ? 'bg-emerald-500/20' : 'bg-[#4c7ef3]/20'}`}>
          <Smartphone className={`w-5 h-5 ${paired ? 'text-emerald-400' : 'text-[#4c7ef3]'}`} />
        </div>
        <div>
          <h3 className="font-bold text-[#e8eaf6]">Phone Camera Pairing</h3>
          <p className="text-xs text-[#8892b0]">{paired ? '✓ Connected & Active' : 'Scan QR code with your phone or launch external camera'}</p>
        </div>
        {isRequired && (
          <AlertTriangle className="w-4 h-4 text-amber-400 ml-auto flex-shrink-0" />
        )}
      </div>

      {!paired ? (
        <div className="space-y-5">
          {/* QR Code */}
          {qrUrl && (
            <div className="flex justify-center p-4 bg-white rounded-xl shadow-lg border-4 border-[#1e2d50]/40 mx-auto w-fit">
              <img 
                src={qrUrl} 
                alt="Pairing QR Code" 
                className="w-56 h-56 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22256%22 height=%22256%22%3E%3Crect fill=%22%23000%22 width=%22256%22 height=%22256%22/%3E%3Ctext x=%2228%22 y=%22128%22 fill=%22%23fff%22 font-size=%2214%22%3EQR Not Loading%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
          )}

          {/* Quick Demo Connect Button for instant testing */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#4c7ef3]/20 to-[#7c3aed]/20 border border-[#4c7ef3]/40 text-center space-y-2">
            <p className="text-xs font-semibold text-[#e8eaf6]">⚡ Demo & Quick Testing Mode</p>
            <p className="text-[11px] text-[#8892b0]">Testing right now on laptop? Launch external secondary camera in popup window:</p>
            <button
              onClick={handleDemoConnect}
              className="btn-primary w-full text-xs py-2.5 gap-2 bg-gradient-to-r from-[#4c7ef3] to-[#7c3aed] hover:from-[#3b6ae0] hover:to-[#6d28d9] shadow-lg shadow-[#4c7ef3]/20"
            >
              <Smartphone className="w-4 h-4" /> Open External Mobile Proctor Camera & Connect
            </button>
          </div>

          {/* Manual Pairing Code */}
          <div className="space-y-2">
            <p className="text-xs text-[#8892b0]">Or enter PIN code manually on phone browser:</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-base font-bold text-[#4c7ef3] bg-[#0f1629] p-2.5 rounded-lg border border-[#1e2d50] text-center">
                {pairingCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="p-2.5 hover:bg-[#1e2d50] rounded-lg transition-colors text-[#4c7ef3] border border-[#1e2d50]"
                title="Copy pairing code"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expiration */}
          <div className={`text-xs p-2.5 rounded-lg text-center font-mono ${expiresIn < 60 ? 'bg-red-900/20 text-red-300' : 'bg-amber-900/20 text-amber-300'}`}>
            Code expires in {Math.floor(expiresIn / 60)}:{String(expiresIn % 60).padStart(2, '0')}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="w-full flex items-center justify-center gap-2 p-2.5 bg-[#1a2540] hover:bg-[#1e2d50] rounded-lg text-xs text-[#8892b0] hover:text-[#e8eaf6] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Generate New Pairing Code
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 space-y-3 text-center animate-fadeIn">
          <CheckCircle className="w-12 h-12 text-emerald-400 animate-bounce" />
          <h4 className="text-lg font-bold text-[#e8eaf6]">Secondary Angle Active!</h4>
          <p className="text-xs text-[#8892b0]">Your mobile camera is now connected to the AI proctoring server. Redirecting to exam session...</p>
        </div>
      )}

      {isRequired && !paired && (
        <div className="mt-4 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg text-xs text-amber-300">
          <strong>⚠️ Mandatory Policy:</strong> Secondary mobile proctoring angle is required before beginning this exam.
        </div>
      )}
    </div>
  );
}

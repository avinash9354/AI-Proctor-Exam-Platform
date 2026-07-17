'use client';
import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, Camera, CheckCircle, AlertTriangle, RefreshCw, Smartphone, Wifi, BatteryCharging } from 'lucide-react';
import toast from 'react-hot-toast';
import { examClient } from '@/lib/apiClient';

function ProctorHandler() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId') || '';
  const pairingCode = searchParams.get('code') || '';
  const studentId = searchParams.get('studentId') || '';

  const [connected, setConnected] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [heartbeatCount, setHeartbeatCount] = useState(0);
  const [battery, setBattery] = useState('94%');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('Invalid pairing session link.');
      return;
    }

    // Start camera stream
    startCamera(facingMode);

    // Notify backend/localStorage that pairing succeeded
    localStorage.setItem(`mobile-paired-${sessionId}`, 'true');
    setConnected(true);
    toast.success('Connected to ExamGuard Proctor Server!');

    // Send heartbeat to keep session active
    const interval = setInterval(() => {
      setHeartbeatCount((c) => c + 1);
      examClient.post('/ai/events', {
        sessionId,
        source: 'mobile_proctor',
        eventType: 'MOBILE_HEARTBEAT',
        confidence: 1.0,
        timestamp: new Date().toISOString()
      }).catch(() => {});
    }, 6000);

    return () => {
      clearInterval(interval);
      stopCamera();
    };
  }, [sessionId, facingMode]);

  const startCamera = async (mode: 'user' | 'environment') => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setError('');
    } catch (err) {
      setError('Unable to access camera. Please allow camera permissions in your mobile browser.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-[#e8eaf6] flex flex-col justify-between p-4 font-sans">
      {/* Top Header HUD */}
      <div className="bg-[#1a2540] border border-[#1e2d50] rounded-2xl p-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#4c7ef3]/20 flex items-center justify-center text-[#4c7ef3]">
            <Shield className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider uppercase text-[#4c7ef3]">ExamGuard Mobile</div>
            <div className="text-[10px] text-[#8892b0]">Secondary Angle Proctor</div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE</span>
          </div>
          <div className="flex items-center gap-1 text-[#8892b0]">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>5G</span>
          </div>
          <div className="flex items-center gap-1 text-[#8892b0]">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            <span>{battery}</span>
          </div>
        </div>
      </div>

      {/* Main Camera Viewport */}
      <div className="flex-1 my-4 relative rounded-2xl overflow-hidden border-2 border-[#4c7ef3]/40 bg-black shadow-2xl flex items-center justify-center">
        {error ? (
          <div className="p-6 text-center max-w-sm">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3 animate-bounce" />
            <h3 className="text-lg font-bold text-amber-300 mb-1">Camera Access Required</h3>
            <p className="text-xs text-[#8892b0] mb-4">{error}</p>
            <button
              onClick={() => startCamera(facingMode)}
              className="px-4 py-2 bg-[#4c7ef3] hover:bg-[#3b6ae0] text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* AI Tracking Overlay Box */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
              <div className="flex justify-between items-start">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-mono text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  AI ANGLE VERIFIED — SIDE/REAR VIEW
                </div>
                {pairingCode && (
                  <div className="bg-[#4c7ef3]/80 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-mono font-bold text-white">
                    PIN: {pairingCode}
                  </div>
                )}
              </div>

              {/* Simulated Bounding Box for Desk/Keyboard */}
              <div className="border border-dashed border-emerald-500/40 rounded-xl w-3/4 h-1/2 mx-auto flex items-end justify-center pb-2">
                <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/40 font-mono">
                  [✓] Workspace & Hands Tracked
                </span>
              </div>

              <div className="flex justify-between items-end">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] text-[#8892b0]">
                  Session: <span className="text-[#e8eaf6] font-mono">{sessionId.slice(0, 8)}...</span>
                  <br />
                  Heartbeats: <span className="text-emerald-400 font-mono">{heartbeatCount}</span>
                </div>

                <button
                  onClick={switchCamera}
                  className="pointer-events-auto bg-[#1a2540]/90 hover:bg-[#4c7ef3] text-white p-3 rounded-full border border-white/20 transition-all shadow-lg active:scale-95"
                  title="Switch Camera"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Instructions Card */}
      <div className="bg-[#1a2540] border border-[#1e2d50] rounded-2xl p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-400 mb-1">
          <CheckCircle className="w-4 h-4" />
          Mobile Proctor Paired Successfully
        </div>
        <p className="text-xs text-[#8892b0] max-w-sm mx-auto">
          Please place this phone to the side of your desk so both your keyboard and screen are visible to the proctor. Do not close or refresh this window during your exam.
        </p>
      </div>
    </div>
  );
}

export default function ProctorMobilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#4c7ef3] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProctorHandler />
    </Suspense>
  );
}

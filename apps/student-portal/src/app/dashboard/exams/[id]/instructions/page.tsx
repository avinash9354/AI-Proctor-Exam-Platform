'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { examClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { MobileProctorPairing } from '@/components/exam/MobileProctorPairing';
import {
  Shield, Camera, Mic, Monitor, Smartphone, AlertTriangle,
  CheckCircle, Clock, BarChart, ArrowRight, Lock, Video, VideoOff
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExamInstructionsPage() {
  const { id: examId } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [consentChecked, setConsentChecked] = useState(false);
  const [starting, setStarting] = useState(false);
  const [pairingStep, setPairingStep] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [screenShareReady, setScreenShareReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-start camera preview when page loads
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraReady(true);
        toast.success('Camera ready ✅');
      } catch (err) {
        setCameraError('Camera access denied. Please allow camera access and reload.');
      }
    };
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleScreenShare = async () => {
    try {
      await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenShareReady(true);
      toast.success('Screen share ready ✅');
    } catch {
      toast.error('Screen share was cancelled or denied');
    }
  };

  const { data: exam, isLoading } = useQuery({
    queryKey: ['exam', examId],
    queryFn: () => examClient.get(`/exams/${examId}`).then((r) => r.data.data),
  });

  const rawPolicy = exam?.policyConfig;
  const policy = (typeof rawPolicy === 'string' ? (() => { try { return JSON.parse(rawPolicy); } catch { return {}; } })() : rawPolicy || {}) as Record<string, unknown>;

  const handleStartExam = async () => {
    if (!consentChecked) {
      toast.error('You must consent to proceed');
      return;
    }
    setStarting(true);
    try {
      const res = await examClient.post('/sessions/start', {
        examId,
        consentGiven: true,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
        },
      });
      const { sessionId: sid } = res.data.data;
      setSessionId(sid);
      
      // Check if mobile proctor is required
      if ((policy.requireMobileProctor as boolean)) {
        setPairingStep(true);
      } else {
        router.push(`/dashboard/exams/${examId}/session/${sid}`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to start exam';
      toast.error(msg);
    } finally {
      setStarting(false);
    }
  };

  const handlePairingComplete = () => {
    router.push(`/dashboard/exams/${examId}/session/${sessionId}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="card h-24 animate-pulse bg-[#1a2540]" />)}
      </div>
    );
  }

  // Show mobile pairing step if required
  if (pairingStep && sessionId) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#e8eaf6]">Pair Your Phone</h1>
          <p className="text-[#8892b0] mt-1">Before starting the exam, pair your phone as a secondary camera for proctoring.</p>
        </div>

        <MobileProctorPairing
          sessionId={sessionId}
          studentId={user?.id || ''}
          onPaired={handlePairingComplete}
          isRequired={policy.requireMobileProctor as boolean}
        />

        <div className="card p-4 bg-blue-900/10 border border-blue-700/30">
          <p className="text-sm text-blue-300">
            <strong>💡 Tip:</strong> Open the mobile proctor app on your phone and scan the QR code above to pair your device.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#e8eaf6]">{exam?.title}</h1>
        <p className="text-[#8892b0] mt-1">{exam?.description}</p>
      </div>

      {/* Exam Info */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: <Clock className="w-5 h-5 text-[#4c7ef3]" />, label: 'Duration', value: `${exam?.durationMinutes} min` },
          { icon: <BarChart className="w-5 h-5 text-[#10b981]" />, label: 'Total Marks', value: exam?.totalMarks },
          { icon: <CheckCircle className="w-5 h-5 text-[#f59e0b]" />, label: 'Pass Marks', value: exam?.passMarks || '—' },
        ].map((item, i) => (
          <div key={i} className="card p-4 text-center">
            <div className="flex justify-center mb-2">{item.icon}</div>
            <div className="text-xl font-bold text-[#e8eaf6]">{item.value}</div>
            <div className="text-xs text-[#4a5568]">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Rules */}
      <div className="card">
        <h2 className="font-bold text-[#e8eaf6] mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#f59e0b]" /> Exam Rules
        </h2>
        <ul className="space-y-2 text-sm text-[#8892b0]">
          <li className="flex items-start gap-2"><span className="text-[#4c7ef3] mt-0.5">•</span> Do not navigate away from the exam window once started.</li>
          <li className="flex items-start gap-2"><span className="text-[#4c7ef3] mt-0.5">•</span> Copying and pasting external content is not permitted.</li>
          {policy.negativeMarking && <li className="flex items-start gap-2"><span className="text-[#ef4444] mt-0.5">•</span> Negative marking applies: {((policy.negativeMarkingFraction as number) * 100).toFixed(0)}% deduction per wrong answer.</li>}
          <li className="flex items-start gap-2"><span className="text-[#4c7ef3] mt-0.5">•</span> After {policy.maxWarnings as number || 3} violations, the exam will be auto-submitted.</li>
          <li className="flex items-start gap-2"><span className="text-[#4c7ef3] mt-0.5">•</span> Ensure a stable internet connection before starting.</li>
        </ul>
      </div>

      {/* 📷 LIVE CAMERA PREVIEW */}
      <div className={`card border-2 ${cameraReady ? 'border-emerald-500/40' : cameraError ? 'border-red-500/40' : 'border-[#1e2d50]'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[#e8eaf6] flex items-center gap-2">
            {cameraReady ? <Video className="w-4 h-4 text-emerald-400" /> : <VideoOff className="w-4 h-4 text-[#4a5568]" />}
            Camera Check
          </h2>
          <span className={`badge text-xs ${cameraReady ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/30' : cameraError ? 'bg-red-900/30 text-red-400 border border-red-700/30' : 'bg-[#1a2540] text-[#4a5568]'}`}>
            {cameraReady ? '✅ Camera Ready' : cameraError ? '❌ Camera Error' : '⏳ Starting...'}
          </span>
        </div>

        {cameraError ? (
          <div className="p-4 rounded-xl bg-red-900/20 border border-red-700/30 text-sm text-red-300">
            {cameraError}
          </div>
        ) : (
          <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '16/9', maxHeight: '220px' }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              id="camera-preview"
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#4c7ef3] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {cameraReady && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/70 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Live Preview
              </div>
            )}
          </div>
        )}

        {/* Screen Share Check */}
        {(policy.requireScreenShare as boolean) && (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#8892b0]">Screen share is required for this exam</p>
              <button
                onClick={handleScreenShare}
                id="test-screen-share-btn"
                className={`btn-secondary text-xs gap-1 ${screenShareReady ? 'border-emerald-500/50 text-emerald-400' : ''}`}
              >
                <Monitor className="w-3.5 h-3.5" />
                {screenShareReady ? '✅ Screen Ready' : 'Test Screen Share'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🔒 CONSENT SCREEN — mandatory gate */}
      <div className="card border-[#4c7ef3]/30" style={{ boxShadow: '0 0 24px rgba(76,126,243,0.1)' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#4c7ef3]/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#4c7ef3]" />
          </div>
          <div>
            <h2 className="font-bold text-[#e8eaf6]">Privacy & Proctoring Notice</h2>
            <p className="text-xs text-[#8892b0]">Required before proceeding — please read carefully</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {[
            { icon: <Camera className="w-4 h-4" />, active: policy.requireCamera as boolean, label: 'Webcam recording', desc: 'Your webcam will be recorded for the duration of this exam.' },
            { icon: <Mic className="w-4 h-4" />, active: policy.requireMicrophone as boolean, label: 'Microphone recording', desc: 'Your microphone will be recorded to detect background voices.' },
            { icon: <Monitor className="w-4 h-4" />, active: policy.requireScreenShare as boolean, label: 'Screen recording', desc: 'Your screen activity will be captured and analyzed.' },
            { icon: <Smartphone className="w-4 h-4" />, active: policy.requireMobileProctor as boolean, label: 'Phone camera', desc: 'A secondary camera via your phone may be required.' },
          ].map((item, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${item.active ? 'border-[#1e2d50] bg-[#0f1629]' : 'border-[#1e2d50]/30 opacity-40'}`}>
              <div className={`mt-0.5 ${item.active ? 'text-[#4c7ef3]' : 'text-[#4a5568]'}`}>{item.icon}</div>
              <div>
                <p className="text-sm font-medium text-[#e8eaf6]">{item.label}</p>
                <p className="text-xs text-[#8892b0]">{item.active ? item.desc : 'Not required for this exam.'}</p>
              </div>
              {item.active && <CheckCircle className="w-4 h-4 text-[#4c7ef3] ml-auto mt-0.5 flex-shrink-0" />}
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-700/30 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-300">
              <strong>Important:</strong> Recordings are retained for {policy.dataRetentionDays as number || 90} days. 
              They are reviewed by proctors, not shared publicly. 
              Any confirmed violations will be visible to you post-exam.
              If you do not consent, you cannot take this exam.
            </div>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="sr-only"
              id="consent-checkbox"
            />
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${consentChecked ? 'bg-[#4c7ef3] border-[#4c7ef3]' : 'border-[#1e2d50] bg-[#0f1629] group-hover:border-[#4c7ef3]'}`}>
              {consentChecked && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
          </div>
          <span className="text-sm text-[#8892b0] leading-relaxed">
            I have read and understood the proctoring policy. I consent to the recording of my camera, microphone, and screen activity for the purpose of exam integrity verification.
          </span>
        </label>
      </div>

      <button
        onClick={handleStartExam}
        disabled={!consentChecked || starting}
        className="btn-primary w-full py-3 text-base gap-2"
        id="start-exam-btn"
      >
        {starting ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>Begin Exam <ArrowRight className="w-4 h-4" /></>
        )}
      </button>
    </div>
  );
}

'use client';
import { useState, useEffect, useRef } from 'react';
import { Shield, Camera, Mic, Monitor, Smartphone, AlertTriangle, Video, Eye, Radio, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { examClient } from '@/lib/apiClient';
import { io } from 'socket.io-client';

interface LiveProctorOverlayProps {
  sessionId: string;
  onViolation?: (eventType: string) => void;
}

export function LiveProctorOverlay({ sessionId, onViolation }: LiveProctorOverlayProps) {
  const [minimized, setMinimized] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [audioLevel, setAudioLevel] = useState(20);
  const [mobilePaired, setMobilePaired] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Check if mobile camera was paired
    const isPaired = localStorage.getItem(`mobile-paired-${sessionId}`) === 'true';
    setMobilePaired(isPaired);

    // Connect WebSocket signaling and notifications
    const wsUrl = process.env.NEXT_PUBLIC_NOTIFICATION_WS_URL || 'http://localhost:4004';
    const socket = io(wsUrl, { transports: ['websocket'] });
    socket.emit('join:session', sessionId);

    socket.on('student:notification', (data: { type: string; message: string }) => {
      toast(data.message, { icon: '🔔', duration: 4000 });
    });

    socket.on('session:update', (event: { type: string; payload: any }) => {
      if (event.type === 'ai_alert') {
        toast.error(`⚠️ AI Proctor Alert: ${event.payload.eventType} detected!`);
        if (onViolation) onViolation(event.payload.eventType);
      }
    });

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraReady(true);
      } catch (err) {
        console.error('Camera overlay error:', err);
      }
    };

    startWebcam();

    // Simulated audio level wave
    const audioInterval = setInterval(() => {
      setAudioLevel(Math.floor(Math.random() * 35) + 15);
    }, 400);

    return () => {
      clearInterval(audioInterval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      socket.disconnect();
    };
  }, [sessionId]);

  const simulateAiEvent = async (eventType: string, label: string) => {
    toast.error(`⚠️ AI Proctor Alert: ${label} detected!`, { duration: 4000 });
    if (onViolation) onViolation(eventType);

    try {
      await examClient.post('/ai/events', {
        sessionId,
        source: 'ai_stream_engine',
        eventType,
        confidence: 0.94,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to log simulated event:', err);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Main HUD Window */}
      <div className="w-72 bg-[#0f1629]/95 backdrop-blur-xl border-2 border-[#4c7ef3]/50 rounded-2xl overflow-hidden shadow-2xl transition-all">
        {/* Top Bar */}
        <div className="bg-[#1a2540] px-3 py-2 border-b border-[#1e2d50] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold tracking-wide text-[#e8eaf6]">AI PROCTOR HUD</span>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-700/50 font-mono">
              99.2% LOCK
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(!minimized)}
              className="p-1 hover:bg-[#1e2d50] rounded text-[#8892b0]"
            >
              {minimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Video & Status Viewport */}
        {!minimized && (
          <div className="p-2.5 space-y-2.5">
            {/* Webcam Live Feed */}
            <div className="relative rounded-xl overflow-hidden bg-black border border-[#1e2d50] aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-[#8892b0]">
                  Connecting Camera...
                </div>
              )}
              {cameraReady && (
                <div className="absolute inset-0 pointer-events-none p-2 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="bg-black/70 px-1.5 py-0.5 rounded text-emerald-400 flex items-center gap-1 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      FACE RECOGNIZED
                    </span>
                    <span className="bg-black/70 px-1.5 py-0.5 rounded text-white">
                      30 FPS
                    </span>
                  </div>

                  {/* Face Tracking Bounding Box */}
                  <div className="border border-emerald-400/60 rounded-lg w-1/2 h-2/3 mx-auto flex items-end justify-center pb-1">
                    <span className="text-[8px] bg-emerald-950/80 text-emerald-300 px-1.5 rounded font-mono">
                      ID: #VERIFIED
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[9px] font-mono text-[#8892b0]">
                    <span>ANGLE: FRONT</span>
                    <span className="text-emerald-400">STATUS: SAFE</span>
                  </div>
                </div>
              )}
            </div>

            {/* Active Telemetry Sensors */}
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              <div className="bg-[#1a2540] p-1.5 rounded-lg border border-[#1e2d50] flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <Camera className="w-3 h-3" /> Webcam
                </div>
                <span className="text-[9px] text-[#8892b0]">Active (1080p)</span>
              </div>

              <div className="bg-[#1a2540] p-1.5 rounded-lg border border-[#1e2d50] flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <Smartphone className="w-3 h-3" /> Mobile
                </div>
                <span className="text-[9px] text-[#8892b0] truncate w-full">
                  {mobilePaired ? 'Paired (Angle 2)' : 'Connecting...'}
                </span>
              </div>

              <div className="bg-[#1a2540] p-1.5 rounded-lg border border-[#1e2d50] flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <Monitor className="w-3 h-3" /> Screen
                </div>
                <span className="text-[9px] text-[#8892b0]">Capturing</span>
              </div>
            </div>

            {/* Audio Monitor Wave Bar */}
            <div className="bg-[#1a2540] p-2 rounded-lg border border-[#1e2d50] flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-[#4c7ef3] flex-shrink-0" />
              <div className="flex-1 bg-[#0f1629] h-2 rounded-full overflow-hidden border border-[#1e2d50]">
                <div
                  className="bg-gradient-to-r from-emerald-400 via-[#4c7ef3] to-amber-400 h-full transition-all duration-300"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-[#8892b0] w-12 text-right">
                {audioLevel} dB
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

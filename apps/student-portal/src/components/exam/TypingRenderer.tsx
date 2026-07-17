'use client';
import { useState, useEffect, useRef } from 'react';
import { Keyboard } from 'lucide-react';
interface TypingRendererProps {
  question: Record<string, unknown>;
  onComplete: (result: { wpm: number; accuracy: number; typed: string }) => void;
}
export function TypingRenderer({ question, onComplete }: TypingRendererProps) {
  const payload = question.payload as Record<string, unknown>;
  const prompt = payload.promptText as string;
  const duration = (payload.durationSeconds as number) || 60;
  const [typed, setTyped] = useState('');
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const startTest = () => { setStarted(true); setTyped(''); setTimeLeft(duration); };

  useEffect(() => {
    if (!started || done) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [started, done]);

  useEffect(() => {
    if (!done) return;
    const words = typed.trim().split(/\s+/).filter(Boolean).length;
    const wpm = Math.round((words / duration) * 60);
    const correct = typed.split('').filter((c, i) => c === prompt[i]).length;
    const accuracy = Math.round((correct / Math.max(typed.length, 1)) * 100);
    onComplete({ wpm, accuracy, typed });
  }, [done]);

  if (done) return (
    <div className="card text-center py-12">
      <Keyboard className="w-12 h-12 mx-auto text-[#4c7ef3] mb-4" />
      <p className="text-[#e8eaf6] font-bold text-xl">Time's up!</p>
      <p className="text-[#8892b0] text-sm mt-2">Your response has been recorded.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-[#0f1629] border border-[#1e2d50] text-[#8892b0] leading-relaxed font-mono text-sm select-none">
        {prompt.split('').map((char, i) => {
          const typedChar = typed[i];
          const color = typedChar === undefined ? 'text-[#4a5568]' : typedChar === char ? 'text-emerald-400' : 'text-red-400';
          return <span key={i} className={color}>{char}</span>;
        })}
      </div>
      {!started ? (
        <button onClick={startTest} className="btn-primary gap-2"><Keyboard className="w-4 h-4" />Start Typing Test</button>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#4a5568]">{typed.length} / {prompt.length} chars</span>
            <span className={`font-mono font-bold ${timeLeft < 10 ? 'text-red-400' : 'text-[#4c7ef3]'}`}>{timeLeft}s</span>
          </div>
          <textarea value={typed} onChange={(e) => setTyped(e.target.value)} rows={5} className="input resize-none font-mono" placeholder="Start typing here…" autoFocus id="typing-input" />
        </>
      )}
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { differenceInSeconds, addMinutes } from 'date-fns';
import { Clock } from 'lucide-react';
import clsx from 'clsx';

interface ExamTimerProps {
  durationMinutes: number;
  startedAt: string;
  onExpire: () => void;
}

export function ExamTimer({ durationMinutes, startedAt, onExpire }: ExamTimerProps) {
  const endTime = addMinutes(new Date(startedAt), durationMinutes);
  const [remaining, setRemaining] = useState(() => differenceInSeconds(endTime, new Date()));

  useEffect(() => {
    const interval = setInterval(() => {
      const secs = differenceInSeconds(endTime, new Date());
      setRemaining(secs);
      if (secs <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  const hours = Math.floor(remaining / 3600);
  const mins = Math.floor((remaining % 3600) / 60);
  const secs = remaining % 60;
  const isWarning = remaining < 600; // last 10 min
  const isDanger = remaining < 120;  // last 2 min

  return (
    <div className={clsx('flex items-center gap-2 p-3 rounded-xl border', {
      'border-[#1e2d50] bg-[#0f1629]': !isWarning,
      'border-amber-700/50 bg-amber-900/20': isWarning && !isDanger,
      'border-red-700/50 bg-red-900/20 animate-pulse': isDanger,
    })}>
      <Clock className={clsx('w-4 h-4', {
        'text-[#4c7ef3]': !isWarning,
        'text-amber-400': isWarning && !isDanger,
        'text-red-400': isDanger,
      })} />
      <span className={clsx('font-mono text-lg font-bold', {
        'text-[#e8eaf6]': !isWarning,
        'text-amber-400': isWarning && !isDanger,
        'text-red-400': isDanger,
      })}>
        {hours > 0 && `${String(hours).padStart(2, '0')}:`}
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  );
}

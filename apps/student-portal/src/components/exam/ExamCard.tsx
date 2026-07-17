'use client';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { Clock, Code, FileText, Type, CheckSquare, ArrowRight, Lock, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  mcq: <CheckSquare className="w-4 h-4" />,
  msq: <CheckSquare className="w-4 h-4" />,
  coding: <Code className="w-4 h-4" />,
  subjective: <FileText className="w-4 h-4" />,
  typing: <Type className="w-4 h-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  mcq: 'badge-blue',
  msq: 'badge-purple',
  coding: 'badge-green',
  subjective: 'badge-yellow',
  typing: 'badge-orange',
};

interface ExamCardProps {
  exam: Record<string, unknown>;
  completed?: boolean;
}

export function ExamCard({ exam, completed = false }: ExamCardProps) {
  const startTime = new Date(exam.startTime as string);
  const endTime = new Date(exam.endTime as string);
  const now = new Date();
  const isLive = now >= startTime && now <= endTime;
  const isUpcoming = now < startTime;

  return (
    <div className={clsx('card group cursor-pointer transition-all duration-200 hover:-translate-y-0.5', {
      'border-[#4c7ef3]/30 shadow-[0_0_24px_rgba(76,126,243,0.08)]': isLive,
    })}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={TYPE_COLORS[exam.type as string] || 'badge-blue'}>
            {TYPE_ICONS[exam.type as string]}
            {(exam.type as string).toUpperCase()}
          </span>
          {isLive && (
            <span className="badge badge-red animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              LIVE
            </span>
          )}
        </div>
        <span className="text-xs text-[#4a5568]">{exam.totalMarks as number} marks</span>
      </div>

      <h3 className="text-base font-bold text-[#e8eaf6] mb-1 group-hover:text-[#4c7ef3] transition-colors">
        {exam.title as string}
      </h3>
      {exam.description && (
        <p className="text-xs text-[#8892b0] mb-3 line-clamp-2">{exam.description as string}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-[#4a5568] mb-4">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {exam.durationMinutes as number} min
        </span>
        <span>
          {isLive
            ? `Ends ${formatDistanceToNow(endTime, { addSuffix: true })}`
            : isUpcoming
            ? `Starts ${formatDistanceToNow(startTime, { addSuffix: true })}`
            : `Ended ${format(endTime, 'dd MMM yyyy')}`}
        </span>
      </div>

      {completed ? (
        <div className="flex items-center gap-2 text-[#10b981] text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          Completed
        </div>
      ) : isLive ? (
        <Link
          href={`/dashboard/exams/${exam.id}/instructions`}
          className="btn-primary w-full justify-center py-2 text-sm"
          id={`start-exam-${exam.id}`}
        >
          Enter Exam <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      ) : isUpcoming ? (
        <button
          disabled
          className="btn w-full justify-center py-2 text-sm bg-[#1a2540] text-[#4a5568] cursor-not-allowed border border-[#1e2d50]"
        >
          <Lock className="w-3.5 h-3.5" />
          Not Started Yet
        </button>
      ) : (
        <Link
          href={`/dashboard/exams/${exam.id}/results`}
          className="btn-secondary w-full justify-center py-2 text-sm"
        >
          View Results
        </Link>
      )}
    </div>
  );
}

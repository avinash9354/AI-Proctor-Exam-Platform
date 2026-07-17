'use client';
import { Shield, AlertTriangle, Eye, Phone, Users, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

interface MonitoringTileProps {
  session: Record<string, unknown>;
  isSelected: boolean;
  onClick: () => void;
}

export function MonitoringTile({ session, isSelected, onClick }: MonitoringTileProps) {
  const student = (session.student as Record<string, unknown>) || {};
  const riskLevel = (session.riskLevel as string) || 'green';
  const riskScore = (session.riskScore as number) || 0;
  const warningCount = (session.warningCount as number) || 0;
  const isBlocked = (session.isBlocked as boolean) || false;

  return (
    <div
      onClick={onClick}
      className={clsx(
        'card p-3 cursor-pointer transition-all duration-200 relative overflow-hidden group',
        {
          'border-[#4c7ef3] shadow-[0_0_20px_rgba(76,126,243,0.2)]': isSelected,
          'border-red-500/60 bg-red-950/20': riskLevel === 'red' || isBlocked,
          'border-orange-500/50 bg-orange-950/10': riskLevel === 'orange' && !isBlocked,
          'border-amber-500/40 bg-amber-950/10': riskLevel === 'yellow' && !isBlocked,
          'hover:border-[#4c7ef3]/50': !isSelected && riskLevel === 'green',
        }
      )}
    >
      {/* Risk Badge Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-full bg-[#1a2540] flex items-center justify-center text-[10px] font-bold text-[#4c7ef3] flex-shrink-0">
            {((student.name as string) || 'U').charAt(0)}
          </div>
          <span className="text-xs font-semibold text-[#e8eaf6] truncate">
            {(student.name as string) || 'Student'}
          </span>
        </div>

        <span className={clsx('badge text-[10px]', `risk-${riskLevel}`)}>
          {riskScore}/100
        </span>
      </div>

      {/* Simulated Stream View / Video Placeholder */}
      <div className="aspect-video rounded-lg bg-[#0a0e1a] border border-[#1e2d50] flex flex-col items-center justify-center relative overflow-hidden">
        <Eye className="w-6 h-6 text-[#4a5568] group-hover:text-[#4c7ef3] transition-colors" />
        <span className="text-[10px] text-[#4a5568] mt-1">Live Feed Active</span>

        {isBlocked && (
          <div className="absolute inset-0 bg-red-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 text-center">
            <AlertTriangle className="w-6 h-6 text-white animate-bounce mb-1" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Blocked</span>
          </div>
        )}
      </div>

      {/* Footer Info / Status Indicators */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#1e2d50]/50 text-[11px]">
        <div className="flex items-center gap-2">
          {warningCount > 0 ? (
            <span className="text-amber-400 flex items-center gap-0.5 font-medium">
              <AlertTriangle className="w-3 h-3" /> {warningCount}w
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-0.5">
              <CheckCircle className="w-3 h-3" /> OK
            </span>
          )}
        </div>

        <span className="text-[#8892b0] truncate max-w-[90px]">
          {((session.exam as Record<string, unknown>)?.title as string) || 'Exam'}
        </span>
      </div>
    </div>
  );
}

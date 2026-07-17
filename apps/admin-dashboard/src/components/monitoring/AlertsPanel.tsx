'use client';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Bell, ShieldAlert, Phone, Users, EyeOff } from 'lucide-react';
import clsx from 'clsx';

interface AlertsPanelProps {
  alerts: unknown[];
  onSelectSession: (sessionId: string) => void;
}

export function AlertsPanel({ alerts, onSelectSession }: AlertsPanelProps) {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f1629]">
      <div className="p-4 border-b border-[#1e2d50] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-[#e8eaf6]">Real-time AI Alerts</h2>
        </div>
        <span className="badge badge-purple">{alerts.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-[#4a5568]">
            <ShieldAlert className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs">No recent AI alerts</p>
          </div>
        ) : (
          alerts.map((item: unknown, i: number) => {
            const alert = item as { type: string; payload: Record<string, unknown>; timestamp?: string };
            const payload = alert.payload || {};
            const eventType = (payload.eventType as string) || 'VIOLATION';
            const riskLevel = (payload.riskLevel as string) || 'yellow';
            const sessionId = (payload.sessionId as string) || '';

            return (
              <div
                key={i}
                onClick={() => sessionId && onSelectSession(sessionId)}
                className={clsx(
                  'p-3 rounded-xl border cursor-pointer transition-all hover:translate-x-0.5',
                  {
                    'border-red-500/50 bg-red-950/20': riskLevel === 'red' || alert.type === 'session_blocked',
                    'border-orange-500/40 bg-orange-950/10': riskLevel === 'orange',
                    'border-[#1e2d50] bg-[#141d33] hover:border-[#4c7ef3]/40': riskLevel !== 'red' && riskLevel !== 'orange',
                  }
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <AlertTriangle className={clsx('w-3.5 h-3.5 flex-shrink-0', {
                      'text-red-400': riskLevel === 'red',
                      'text-orange-400': riskLevel === 'orange',
                      'text-amber-400': riskLevel === 'yellow',
                    })} />
                    <span className="text-xs font-bold text-[#e8eaf6] truncate">
                      {eventType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className={clsx('badge text-[9px]', `risk-${riskLevel}`)}>
                    {riskLevel.toUpperCase()}
                  </span>
                </div>

                <p className="text-[11px] text-[#8892b0] mt-1.5 truncate">
                  Student: <strong className="text-[#e8eaf6]">{(payload.studentName as string) || 'Student'}</strong>
                </p>

                {alert.timestamp && (
                  <p className="text-[9px] text-[#4a5568] mt-1 text-right">
                    {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

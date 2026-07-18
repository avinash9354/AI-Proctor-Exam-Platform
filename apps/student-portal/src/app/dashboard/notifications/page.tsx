'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationClient } from '@/lib/apiClient';
import { Bell, CheckCircle2, Clock, AlertTriangle, Info, Check, Filter, Trash2, Calendar, ShieldAlert, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

export default function StudentNotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread' | 'system' | 'exam' | 'alert'>('all');

  const { data: notifResponse, isLoading } = useQuery({
    queryKey: ['student-notifications'],
    queryFn: () => notificationClient.get('/').then((r) => r.data.data).catch(() => ({ notifications: [], unreadCount: 0 })),
    refetchInterval: 12000,
  });

  const notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
  }> = notifResponse?.notifications || [];

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await notificationClient.patch(`/${id}/read`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-notifications'] });
    },
  });

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'system') return n.type === 'system';
    if (filter === 'exam') return n.type === 'exam';
    if (filter === 'alert') return n.type === 'alert';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'exam': return <Calendar className="w-5 h-5 text-[#4c7ef3]" />;
      case 'alert': return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      default: return <Info className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e8eaf6] flex items-center gap-3">
            Notification <span className="gradient-text">Center</span>
            {unreadCount > 0 && (
              <span className="text-xs font-black bg-gradient-to-r from-[#4c7ef3] to-[#7c3aed] text-white px-2.5 py-1 rounded-full shadow-lg shadow-[#4c7ef3]/30">
                {unreadCount} Unread
              </span>
            )}
          </h1>
          <p className="text-[#8892b0] mt-1 text-sm">Real-time alerts, examination schedule announcements, and proctoring broadcasts</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => {
              notifications.filter((n) => !n.read).forEach((n) => markReadMutation.mutate(n.id));
            }}
            className="text-xs px-3.5 py-2 rounded-xl border border-[#1e2d50] bg-[#1a2540] text-[#e8eaf6] hover:bg-[#1e2d50] flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" /> Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1e2d50] pb-3 overflow-x-auto">
        {[
          { id: 'all' as const, label: 'All Notifications', count: notifications.length },
          { id: 'unread' as const, label: 'Unread', count: unreadCount },
          { id: 'exam' as const, label: 'Exam Reminders', count: notifications.filter((n) => n.type === 'exam').length },
          { id: 'alert' as const, label: 'Proctor Alerts', count: notifications.filter((n) => n.type === 'alert').length },
          { id: 'system' as const, label: 'System Notices', count: notifications.filter((n) => n.type === 'system').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 flex-shrink-0 ${
              filter === tab.id
                ? 'bg-gradient-to-r from-[#4c7ef3] to-[#7c3aed] text-white shadow-md'
                : 'bg-[#0f1629] text-[#8892b0] border border-[#1e2d50] hover:text-[#e8eaf6]'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${filter === tab.id ? 'bg-black/20 text-white' : 'bg-[#1a2540] text-[#8892b0]'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-[#0f1629] border border-[#1e2d50] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center space-y-3 border border-[#1e2d50] rounded-3xl bg-[#0f1629]">
          <Bell className="w-12 h-12 text-[#1e2d50] mx-auto" />
          <h3 className="text-base font-bold text-[#e8eaf6]">No Notifications Found</h3>
          <p className="text-xs text-[#8892b0] max-w-sm mx-auto">
            You don&apos;t have any notifications under this filter category right now. New alerts will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notif) => (
            <div
              key={notif.id}
              className={`card p-5 border rounded-2xl transition-all flex items-start justify-between gap-4 ${
                notif.read
                  ? 'bg-[#0f1629]/70 border-[#1e2d50] opacity-80 hover:opacity-100'
                  : 'bg-gradient-to-r from-[#16203a] via-[#0f1629] to-[#0a0e1a] border-[#4c7ef3]/50 shadow-lg shadow-[#4c7ef3]/5'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  notif.type === 'alert' ? 'bg-amber-500/10 border border-amber-500/20' :
                  notif.type === 'exam' ? 'bg-[#4c7ef3]/10 border border-[#4c7ef3]/20' :
                  'bg-purple-500/10 border border-purple-500/20'
                }`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-bold truncate ${notif.read ? 'text-[#8892b0]' : 'text-[#e8eaf6]'}`}>
                      {notif.title}
                    </h3>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-[#4c7ef3] flex-shrink-0 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-[#8892b0] mt-1 leading-relaxed">{notif.message}</p>
                  <div className="flex items-center gap-3 text-[11px] text-[#4a5568] mt-2 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : 'Just now'}
                    </span>
                    <span>•</span>
                    <span className="uppercase tracking-wider font-semibold">{notif.type}</span>
                  </div>
                </div>
              </div>

              {!notif.read && (
                <button
                  onClick={() => markReadMutation.mutate(notif.id)}
                  disabled={markReadMutation.isPending}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#1e2d50] bg-[#1a2540] text-[#8892b0] hover:text-white hover:bg-[#1e2d50] flex-shrink-0 transition-colors"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

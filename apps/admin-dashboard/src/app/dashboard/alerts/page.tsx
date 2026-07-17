'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { examClient } from '@/lib/apiClient';
import { AlertTriangle, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface Alert {
  id: string;
  sessionId: string;
  studentName: string;
  examTitle: string;
  alertType: string;
  confidence: number;
  timestamp: Date;
  status: 'new' | 'reviewed' | 'resolved';
}

export default function AlertsPage() {
  const [filter, setFilter] = useState<'all' | 'new' | 'reviewed'>('all');

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['ai-alerts', filter],
    queryFn: () =>
      examClient
        .get(`/alerts?status=${filter === 'all' ? '' : filter}`)
        .then((r) => r.data.data || [])
        .catch(() => []),
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-24 bg-[#1a2540] animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#e8eaf6]">AI Alerts</h1>
        <p className="text-[#8892b0] mt-1">Real-time risk events detected during exams</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
            label: 'Total Alerts',
            value: alerts?.length || 0,
          },
          {
            icon: <TrendingUp className="w-5 h-5 text-amber-400" />,
            label: 'High Risk',
            value: alerts?.filter((a: Alert) => a.confidence > 0.8).length || 0,
          },
          {
            icon: <Clock className="w-5 h-5 text-blue-400" />,
            label: 'New',
            value: alerts?.filter((a: Alert) => a.status === 'new').length || 0,
          },
          {
            icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
            label: 'Resolved',
            value: alerts?.filter((a: Alert) => a.status === 'resolved').length || 0,
          },
        ].map((stat, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center gap-3 mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-[#e8eaf6]">{stat.value}</div>
            <div className="text-xs text-[#8892b0]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'new', 'reviewed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as typeof filter)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f
                ? 'bg-[#4c7ef3] text-white'
                : 'bg-[#1a2540] text-[#8892b0] hover:text-[#e8eaf6]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts && alerts.length > 0 ? (
          alerts.map((alert: Alert) => (
            <div
              key={alert.id}
              className={`card p-4 border-l-4 ${
                alert.status === 'new'
                  ? 'border-l-red-500 bg-red-900/10'
                  : alert.status === 'reviewed'
                    ? 'border-l-amber-500 bg-amber-900/10'
                    : 'border-l-emerald-500 bg-emerald-900/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-[#e8eaf6]">{alert.studentName}</h3>
                  <p className="text-sm text-[#8892b0]">{alert.examTitle}</p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs bg-[#1a2540] text-[#4c7ef3] px-2 py-1 rounded">
                      {alert.alertType}
                    </span>
                    <span className="text-xs text-[#8892b0]">
                      Confidence: {(alert.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      alert.status === 'new'
                        ? 'bg-red-900/30 text-red-400'
                        : alert.status === 'reviewed'
                          ? 'bg-amber-900/30 text-amber-400'
                          : 'bg-emerald-900/30 text-emerald-400'
                    }`}
                  >
                    {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-8 text-center">
            <p className="text-[#8892b0]">No alerts found</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import { formatShortDateTime } from '@/lib/format';

const isToday = (value) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
};

const isWithinLast7Days = (value) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return date.getTime() >= cutoff;
};

export default function MentorDashboard() {
  const [signals, setSignals] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [signalsRes, subscribersRes] = await Promise.all([
          api.get('/mentor/signals'),
          api.get('/mentor/subscribers', { params: { limit: 8 } }),
        ]);

        setSignals(signalsRes.signals || []);
        setSubscribers(subscribersRes.students || []);
      } catch {
        toast.error('Failed to load mentor dashboard data');
        setSignals([]);
        setSubscribers([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const activeSignals = useMemo(() => signals.filter((row) => row.status === 'active'), [signals]);

  const metrics = useMemo(() => {
    const todayCount = signals.filter((s) => isToday(s.createdAt)).length;
    const weekCount = signals.filter((s) => isWithinLast7Days(s.createdAt)).length;
    return [
      { label: 'Today Signals', value: todayCount },
      { label: 'Last 7 Days', value: weekCount },
      { label: 'Active Signals', value: activeSignals.length },
      { label: 'Active Subscribers', value: subscribers.length },
    ];
  }, [signals, activeSignals.length, subscribers.length]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Mentor Dashboard</h1>
        <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">Monitor your posted signals and active student subscriptions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{metric.label}</p>
              <h3 className="text-[20px] sm:text-[24px] font-bold text-slate-900 dark:text-white mt-1 sm:mt-2">
                {isLoading ? '—' : metric.value}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
          <CardContent className="p-5">
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white mb-4">Latest Signals</h2>
            {isLoading ? (
              <p className="text-sm text-slate-400">Loading signals...</p>
            ) : signals.length === 0 ? (
              <p className="text-sm text-slate-400">No signals posted today.</p>
            ) : (
              <div className="space-y-3">
                {signals.slice(0, 6).map((signal) => (
                  <div key={signal.id} className="p-3 rounded-xl border border-slate-100 dark:border-neutral-800">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{signal.instrument} - {signal.direction?.toUpperCase()}</h3>
                      <span className="text-xs text-slate-400">{signal.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Entry: {signal.entryPrice} | SL: {signal.stopLoss}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatShortDateTime(signal.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
          <CardContent className="p-5">
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white mb-4">Subscribed Students</h2>
            {isLoading ? (
              <p className="text-sm text-slate-400">Loading subscribers...</p>
            ) : subscribers.length === 0 ? (
              <p className="text-sm text-slate-400">No active subscriptions found.</p>
            ) : (
              <div className="space-y-3">
                {subscribers.slice(0, 8).map((student) => (
                  <div key={student.userId} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-neutral-900">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{student.fullName}</p>
                      <p className="text-xs text-slate-500">{student.email}</p>
                    </div>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">{student.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
        <CardContent className="p-5">
          <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Quick Summary</h2>
          <p className="text-sm text-slate-500 mt-2">Active Signals: {activeSignals.length} | Total Signals Today: {signals.length} | Active Subscribers: {subscribers.length}</p>
        </CardContent>
      </Card>
    </div>
  );
}

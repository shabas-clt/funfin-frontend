import { useEffect, useState, useMemo } from 'react';
import { 
  Radio, Users, Activity, BarChart2 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Filler, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { api } from '@/api/axios';
import { useTheme } from '@/context/ThemeContext';
import { toast } from 'react-toastify';
import { formatShortDateTime, formatChartDay } from '@/lib/format';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Tooltip, Filler, Legend
);

const StatCardSkeleton = () => (
  <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
    <CardContent className="p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-2 sm:mb-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="h-3.5 w-24" />
      </div>
      <Skeleton className="h-6 sm:h-8 w-20" />
      <Skeleton className="h-3 w-32 mt-2 sm:mt-3" />
    </CardContent>
  </Card>
);

export default function MentorDashboard() {
  const [summary, setSummary] = useState(null);
  const [signals, setSignals] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const today = new Date().toISOString().slice(0, 10);
        const [summaryRes, signalsRes, subscribersRes] = await Promise.all([
          api.get('/mentor/dashboard/summary', { params: { days: 14 } }),
          api.get('/mentor/signals', { params: { date: today, limit: 100 } }),
          api.get('/mentor/subscribers', { params: { limit: 8 } }),
        ]);

        setSummary(summaryRes);
        setSignals(signalsRes.signals || []);
        setSubscribers(subscribersRes.students || []);
      } catch {
        toast.error('Failed to load mentor dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const chartData = useMemo(() => {
    if (!summary?.timeseries) return null;
    const labels = summary.timeseries.map((d) => formatChartDay(d.date));
    const counts = summary.timeseries.map((d) => d.signals);

    return {
      labels,
      datasets: [
        {
          label: 'Signals Posted',
          data: counts,
          borderColor: '#6366f1',
          backgroundColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: theme === 'dark' ? '#0a0a0a' : '#ffffff',
          pointBorderWidth: 2,
        }
      ],
    };
  }, [summary, theme]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
        titleColor: theme === 'dark' ? '#e5e5e5' : '#171717',
        bodyColor: theme === 'dark' ? '#a3a3a3' : '#525252',
        borderColor: theme === 'dark' ? '#262626' : '#e5e5e5',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: theme === 'dark' ? '#525252' : '#a3a3a3', font: { size: 11 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: theme === 'dark' ? '#171717' : '#f5f5f5', drawBorder: false },
        ticks: { color: theme === 'dark' ? '#525252' : '#a3a3a3', font: { size: 11 }, precision: 0 }
      },
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
  }), [theme]);

  // Stat calculations
  const totalMySignals = summary?.myTotalSignals || 0;
  const totalPlatformSignals = summary?.platformTotalSignals || 0;
  // Let's protect against division by 0
  const percentageOfTotal = totalPlatformSignals > 0 
    ? ((totalMySignals / totalPlatformSignals) * 100).toFixed(1) 
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Mentor Dashboard</h1>
        <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">
          {summary ? `Overview for ${summary.mentorName}` : 'Monitor your posted signals and active student subscriptions'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20">
                    <Radio className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Total Signals Posted</p>
                </div>
                <h3 className="text-[20px] sm:text-[24px] font-bold text-slate-900 dark:text-white mt-1">
                  {totalMySignals}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  You account for <span className="font-semibold text-slate-700 dark:text-slate-300">{percentageOfTotal}%</span> of total network signals ({totalPlatformSignals})
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                    <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Active Signals (Live)</p>
                </div>
                <h3 className="text-[20px] sm:text-[24px] font-bold text-slate-900 dark:text-white mt-1">
                  {summary?.myActiveSignals || 0}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Signals currently active in the market
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20">
                    <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Active Pro Subscribers</p>
                </div>
                <h3 className="text-[20px] sm:text-[24px] font-bold text-slate-900 dark:text-white mt-1">
                  {summary?.activeSubscribers || 0}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Users eligible to receive these signals
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50 dark:bg-cyan-900/20">
                    <BarChart2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Signals Posted Today</p>
                </div>
                <h3 className="text-[20px] sm:text-[24px] font-bold text-slate-900 dark:text-white mt-1">
                  {signals.length || 0}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Total published by you today
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-neutral-900">
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Signal Publishing Frequency (Last 14 Days)</h2>
          </div>
          <CardContent className="p-5 flex-1 min-h-[300px]">
            {isLoading ? (
              <Skeleton className="w-full h-full rounded-lg" />
            ) : chartData ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-400">No chart data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-neutral-900">
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Latest Subscriptions</h2>
          </div>
          <CardContent className="p-5 flex-1">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : subscribers.length === 0 ? (
              <p className="text-sm text-slate-400 text-center mt-10">No active tracking found.</p>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-neutral-800">
                {subscribers.map((student) => (
                  <div key={student.userId} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 dark:border-neutral-800">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{student.fullName}</p>
                      <p className="text-xs text-slate-500">{student.email}</p>
                    </div>
                    <span className="text-[11px] px-2 py-1 rounded-md font-medium bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {student.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
        <div className="p-5 border-b border-slate-100 dark:border-neutral-900">
          <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Quick Review: Signals Today</h2>
        </div>
        <CardContent className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : signals.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No signals posted by you today.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {signals.slice(0, 6).map((signal) => (
                <div key={signal.id} className="p-4 rounded-xl border border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/30">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{signal.instrument}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      signal.direction === 'buy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' 
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                    }`}>
                      {signal.direction?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    <span className="font-medium">Entry:</span> {signal.entryPrice} <span className="mx-1">|</span> 
                    <span className="font-medium">SL:</span> {signal.stopLoss}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-neutral-800">
                    <span>{signal.status}</span>
                    <span>{formatShortDateTime(signal.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
        <div className="p-5 border-b border-slate-100 dark:border-neutral-900">
          <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">📊 Mentor Leaderboard - Top Performers</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ranked by total signals posted</p>
        </div>
        <CardContent className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-6 w-12 rounded" />
                </div>
              ))}
            </div>
          ) : summary?.mentorLeaderboard && summary.mentorLeaderboard.length > 0 ? (
            <div className="space-y-3">
              {summary.mentorLeaderboard.map((mentor, index) => (
                <div key={mentor.mentorUserId} className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-neutral-800 last:border-0 last:pb-0">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-white text-sm ${
                    index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-600' : 'bg-indigo-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{mentor.mentorName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-md">
                      {mentor.totalSignals} signals
                    </span>
                    {summary.mentorName === mentor.mentorName && (
                      <span className="text-[11px] px-2 py-1 rounded-md font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        YOU
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No leaderboard data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

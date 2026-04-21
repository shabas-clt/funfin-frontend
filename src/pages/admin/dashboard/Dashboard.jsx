import { useEffect, useMemo, useState } from 'react';
import {
  Users, BookOpen, IndianRupee, UserPlus,
  TrendingUp, TrendingDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Filler, Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { api } from '@/api/axios';
import { useTheme } from '@/context/ThemeContext';
import { toast } from 'react-toastify';
import { PaymentInstrument } from '@/components/shared/PaymentInstrument';
import {
  formatInr,
  formatNumber,
  formatShortDateTime,
  formatChartDay,
} from '@/lib/format';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Tooltip, Filler, Legend
);

const WINDOW_OPTIONS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

const StatCardSkeleton = () => (
  <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.03)] bg-white dark:bg-neutral-950 rounded-2xl">
    <CardContent className="p-5 space-y-4">
      <Skeleton className="h-3.5 w-28" />
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [windowDays, setWindowDays] = useState(30);
  const [summary, setSummary] = useState(null);
  const [timeseries, setTimeseries] = useState(null);
  const [recent, setRecent] = useState(null);

  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingSeries, setIsLoadingSeries] = useState(true);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingSummary(true);
    setIsLoadingSeries(true);

    Promise.allSettled([
      api.get('/dashboard/summary', { params: { windowDays } }),
      api.get('/dashboard/timeseries', { params: { days: windowDays } }),
    ]).then(([summaryRes, seriesRes]) => {
      if (cancelled) return;
      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value);
      } else {
        toast.error('Failed to load dashboard summary');
        setSummary(null);
      }
      if (seriesRes.status === 'fulfilled') {
        setTimeseries(seriesRes.value);
      } else {
        setTimeseries(null);
      }
      setIsLoadingSummary(false);
      setIsLoadingSeries(false);
    });

    return () => {
      cancelled = true;
    };
  }, [windowDays]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingRecent(true);
    api
      .get('/dashboard/recent-transactions', { params: { limit: 10 } })
      .then((res) => {
        if (!cancelled) setRecent(res);
      })
      .catch(() => {
        if (!cancelled) setRecent({ transactions: [] });
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRecent(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const chartPalette = useMemo(() => ({
    courseBar: isDark ? '#6366f1' : '#6366f1',
    funcoinBar: isDark ? '#f59e0b' : '#f59e0b',
    signalBar: isDark ? '#10b981' : '#10b981',
    line: isDark ? '#38bdf8' : '#6366f1',
    lineFill: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(99, 102, 241, 0.14)',
    grid: isDark ? 'rgba(148, 163, 184, 0.18)' : '#e2e8f0',
    ticks: isDark ? '#94a3b8' : '#64748b',
    pointBg: isDark ? '#000000' : '#ffffff',
  }), [isDark]);

  const summaryCards = useMemo(() => {
    const users = summary?.users || { total: 0, newInWindow: 0 };
    const courses = summary?.courses || { published: 0, draft: 0, total: 0 };
    const rev = summary?.revenueInr || { total: 0, course: 0, funcoin: 0, signal: 0 };

    return [
      {
        title: 'Total Students',
        value: formatNumber(users.total),
        hint: `+${formatNumber(users.newInWindow)} new in window`,
        icon: Users,
        bg: 'bg-indigo-100 dark:bg-indigo-900/40',
        color: 'text-indigo-500',
        isUp: users.newInWindow > 0,
      },
      {
        title: 'Total Courses',
        value: formatNumber(courses.total),
        hint: `${formatNumber(courses.published)} published • ${formatNumber(courses.draft)} draft`,
        icon: BookOpen,
        bg: 'bg-violet-100 dark:bg-violet-900/40',
        color: 'text-violet-500',
        isUp: true,
      },
      {
        title: 'New Signups',
        value: formatNumber(users.newInWindow),
        hint: `In the last ${windowDays} days`,
        icon: UserPlus,
        bg: 'bg-cyan-100 dark:bg-cyan-900/40',
        color: 'text-cyan-500',
        isUp: users.newInWindow > 0,
      },
      {
        title: 'Revenue',
        value: formatInr(rev.total),
        hint: `Courses ${formatInr(rev.course)} • FC ${formatInr(rev.funcoin)} • Signals ${formatInr(rev.signal)}`,
        icon: IndianRupee,
        bg: 'bg-amber-100 dark:bg-amber-900/40',
        color: 'text-amber-500',
        isUp: rev.total > 0,
      },
    ];
  }, [summary, windowDays]);

  const revenueChartData = useMemo(() => {
    const points = timeseries?.points || [];
    return {
      labels: points.map((p) => formatChartDay(p.date)),
      datasets: [
        {
          label: 'Courses',
          data: points.map((p) => p.courseRevenueInr),
          backgroundColor: chartPalette.courseBar,
          borderRadius: 4,
          barPercentage: 0.6,
        },
        {
          label: 'FunCoins',
          data: points.map((p) => p.funcoinRevenueInr),
          backgroundColor: chartPalette.funcoinBar,
          borderRadius: 4,
          barPercentage: 0.6,
        },
        {
          label: 'Signals',
          data: points.map((p) => p.signalRevenueInr),
          backgroundColor: chartPalette.signalBar,
          borderRadius: 4,
          barPercentage: 0.6,
        },
      ],
    };
  }, [timeseries, chartPalette]);

  const revenueChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { color: chartPalette.ticks } },
      y: {
        stacked: true,
        beginAtZero: true,
        border: { display: false },
        grid: { borderDash: [4, 4], color: chartPalette.grid },
        ticks: {
          color: chartPalette.ticks,
          callback: (v) => `₹${formatNumber(v)}`,
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatInr(ctx.parsed.y)}`,
        },
      },
    },
  }), [chartPalette]);

  const signupsChartData = useMemo(() => {
    const points = timeseries?.points || [];
    return {
      labels: points.map((p) => formatChartDay(p.date)),
      datasets: [
        {
          fill: true,
          data: points.map((p) => p.signups),
          borderColor: chartPalette.line,
          backgroundColor: chartPalette.lineFill,
          tension: 0.35,
          pointBackgroundColor: chartPalette.pointBg,
          pointBorderColor: chartPalette.line,
          pointBorderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [timeseries, chartPalette]);

  const signupsChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: chartPalette.ticks } },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { borderDash: [4, 4], color: chartPalette.grid },
        ticks: { color: chartPalette.ticks, precision: 0 },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${formatNumber(ctx.parsed.y)} signups`,
        },
      },
    },
  }), [chartPalette]);

  const transactions = recent?.transactions || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Welcome back, Admin!</h1>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">Live view of the FunFin platform</p>
        </div>
        <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-1">
          {WINDOW_OPTIONS.map((opt) => {
            const active = opt.value === windowDays;
            return (
              <button
                key={opt.value}
                onClick={() => setWindowDays(opt.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-900'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoadingSummary ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : summaryCards.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx} className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
              <CardContent className="p-5">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.title}</span>
                <div className="flex items-center gap-4 mt-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.bg}`}>
                    <Icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[22px] font-bold text-slate-900 dark:text-white leading-tight truncate">{item.value}</h3>
                    <div
                      className={`flex items-center gap-1 text-[11px] mt-1 font-medium ${
                        item.isUp ? 'text-emerald-500' : 'text-slate-400'
                      }`}
                    >
                      {item.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span className="truncate">{item.hint}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3">
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Revenue by day</h2>
              <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartPalette.courseBar }} /> Courses</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartPalette.funcoinBar }} /> FunCoins</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartPalette.signalBar }} /> Signals</span>
              </div>
            </div>
            <div className="h-[260px] w-full">
              {isLoadingSeries ? (
                <Skeleton className="w-full h-full rounded-lg" />
              ) : (
                <Bar data={revenueChartData} options={revenueChartOptions} />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
          <CardContent className="p-5">
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white mb-4">New signups</h2>
            <div className="h-[260px] w-full">
              {isLoadingSeries ? (
                <Skeleton className="w-full h-full rounded-lg" />
              ) : (
                <Line data={signupsChartData} options={signupsChartOptions} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl pb-2">
        <CardContent className="p-0">
          <div className="p-5 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Recent Transactions</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formatNumber(transactions.length)} shown
            </span>
          </div>
          <div className="overflow-x-auto px-2">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead>
                <tr className="border-t border-b border-slate-100 dark:border-neutral-800 text-slate-500 dark:text-slate-400 font-medium">
                  <th className="px-5 py-3.5 font-semibold text-[12px] uppercase tracking-wide">Customer</th>
                  <th className="px-5 py-3.5 font-semibold text-[12px] uppercase tracking-wide">Type</th>
                  <th className="px-5 py-3.5 font-semibold text-[12px] uppercase tracking-wide">Amount</th>
                  <th className="px-5 py-3.5 font-semibold text-[12px] uppercase tracking-wide">Method</th>
                  <th className="px-5 py-3.5 font-semibold text-[12px] uppercase tracking-wide">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-neutral-800/70">
                {isLoadingRecent ? (
                  <tr>
                    <td colSpan="5" className="p-6">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-slate-400 dark:text-slate-500">
                      No recent transactions yet.
                    </td>
                  </tr>
                ) : transactions.map((tx) => {
                  const typeLabel = tx.type === 'course'
                    ? 'Course'
                    : tx.type === 'funcoin'
                      ? 'FunCoins'
                      : 'Signal';
                  return (
                    <tr key={`${tx.type}-${tx.id}`} className="hover:bg-slate-50/80 dark:hover:bg-neutral-900/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(tx.userName || 'User')}&background=6366f1&color=fff&rounded=true`}
                            alt="user"
                            className="w-9 h-9 rounded-full shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {tx.userName || 'Unknown user'}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">{tx.userEmail || `#${tx.userId}`}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 font-medium">{typeLabel}</td>
                      <td className="px-5 py-3.5 text-slate-900 dark:text-white font-semibold">{formatInr(tx.amountInr)}</td>
                      <td className="px-5 py-3.5">
                        <PaymentInstrument instrument={tx.paymentInstrument} channel={tx.channel} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-[12px]">
                        {formatShortDateTime(tx.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

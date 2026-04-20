import { useState, useEffect } from 'react';
import {
  GraduationCap, BookOpen, PlayCircle, DollarSign,
  TrendingUp, TrendingDown, Eye, Edit, Trash,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Filler, Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { api } from '@/api/axios';
import { useTheme } from '@/context/ThemeContext';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Tooltip, Filler, Legend
);

const UserAvatars = () => (
  <div className="flex -space-x-2">
    {['6366f1', 'ec4899', '06b6d4'].map((color, i) => (
      <div
        key={i}
        className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-[9px] font-bold"
        style={{ background: `#${color}` }}
      >
        {String.fromCharCode(65 + i)}
      </div>
    ))}
    <div className="flex w-6 h-6 items-center justify-center rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 text-[9px] font-bold text-slate-600 dark:text-slate-300">
      5+
    </div>
  </div>
);

const StatCardSkeleton = () => (
  <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.03)] bg-white dark:bg-neutral-950 rounded-2xl">
    <CardContent className="p-5 space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
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
  const [coursesCount, setCoursesCount] = useState(null);
  const [overviewRange, setOverviewRange] = useState(undefined);
  const [analysisRange, setAnalysisRange] = useState(undefined);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartPalette = {
    teachers: isDark ? '#6366f1' : '#6366f1',
    students: isDark ? '#818cf8' : '#818cf8',
    others: isDark ? '#a5b4fc' : '#a5b4fc',
    line: isDark ? '#38bdf8' : '#6366f1',
    lineFill: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(99, 102, 241, 0.14)',
    grid: isDark ? 'rgba(148, 163, 184, 0.18)' : '#e2e8f0',
    ticks: isDark ? '#94a3b8' : '#64748b',
    pointBg: isDark ? '#000000' : '#ffffff',
  };

  useEffect(() => {
    api.get('/courses?limit=1')
      .then(res => setCoursesCount(res.total || 6))
      .catch(() => setCoursesCount(6));
  }, []);

  const isLoading = coursesCount === null;

  const summaryData = [
    { title: 'Total Students',  value: '72,056',                         pct: '12.05%', isUp: true,  icon: GraduationCap, bg: 'bg-indigo-100 dark:bg-indigo-900/40', color: 'text-indigo-500' },
    { title: 'Total Courses',   value: isLoading ? '—' : String(coursesCount), pct: '12.25%', isUp: false, icon: BookOpen,     bg: 'bg-violet-100 dark:bg-violet-900/40', color: 'text-violet-500' },
    { title: 'Total Videos',    value: '31,056',                         pct: '25.21%', isUp: true,  icon: PlayCircle,   bg: 'bg-cyan-100 dark:bg-cyan-900/40',    color: 'text-cyan-500' },
    { title: 'Total Revenue',   value: '₹8,05,056',                      pct: '12.05%', isUp: true,  icon: DollarSign,   bg: 'bg-amber-100 dark:bg-amber-900/40',  color: 'text-amber-500' },
  ];

  const barData = {
    labels: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      { label: 'Teachers', data: [20, 30, 25, 45, 20, 25, 15], backgroundColor: chartPalette.teachers, borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 4, bottomRight: 4 }, barPercentage: 0.3 },
      { label: 'Students', data: [20, 40, 25, 60, 45, 45, 30], backgroundColor: chartPalette.students, barPercentage: 0.3 },
      { label: 'Others',   data: [15, 20, 10, 25, 15, 20, 15], backgroundColor: chartPalette.others, borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 }, barPercentage: 0.3 },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { color: chartPalette.ticks } },
      y: { stacked: true, beginAtZero: true, border: { display: false }, grid: { borderDash: [4, 4], color: chartPalette.grid }, max: 100, ticks: { color: chartPalette.ticks } },
    },
    plugins: { legend: { display: false } },
  };

  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        fill: true,
        data: [35, 60, 30, 40, 25, 55, 40, 45, 30, 42, 30, 15],
        borderColor: chartPalette.line,
        backgroundColor: chartPalette.lineFill,
        tension: 0.4,
        pointBackgroundColor: chartPalette.pointBg,
        pointBorderColor: chartPalette.line,
        pointBorderWidth: 2,
        pointRadius: (ctx) => (ctx.dataIndex === 1 ? 5 : 0),
        pointHoverRadius: 6,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: chartPalette.ticks } },
      y: { beginAtZero: true, border: { display: false }, grid: { borderDash: [4, 4], color: chartPalette.grid }, max: 80, ticks: { color: chartPalette.ticks } },
    },
    plugins: { legend: { display: false } },
  };

  const transactions = [
    { name: 'Rajesh Kumar',  course: 'Stock Market Fundamentals', amount: '₹499', method: 'UPI', status: 'Success', cardLast4: '9876' },
    { name: 'Priya Sharma',  course: 'Technical Analysis Mastery', amount: '₹799', method: 'Mastercard', status: 'Pending', cardLast4: '1264' },
    { name: 'Arjun Mehta',   course: 'Options & Derivatives',      amount: '₹1199', method: 'Visa', status: 'Success', cardLast4: '3658' },
    { name: 'Sneha Verma',   course: 'Forex Trading Strategies',   amount: '₹649', method: 'Paytm', status: 'Failed', cardLast4: '9971' },
  ];

  const getPaymentMethodDetails = (method) => {
    const methodIcons = {
      UPI: { logo: '/payments/upi.png', label: 'UPI' },
      Mastercard: { logo: '/payments/mastercard.png', label: 'Mastercard' },
      Visa: { logo: '/payments/visa.png', label: 'Visa' },
      Paytm: { logo: '/payments/paytm.png', label: 'Paytm' },
      Card: { logo: '/payments/visa.png', label: 'Card' },
    };
    return methodIcons[method] || methodIcons.Card;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Welcome back, Admin!</h1>
        <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">Track and manage your FunFin platform performance</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : summaryData.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx} className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.title}</span>
                  <UserAvatars />
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.bg}`}>
                    <Icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <div>
                    <h3 className="text-[22px] font-bold text-slate-900 dark:text-white leading-tight">{item.value}</h3>
                    <div className={`flex items-center text-xs mt-1 font-medium ${item.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {item.isUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {item.isUp ? '+' : '-'}{item.pct}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Overview</h2>
                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> 23.5%
                </span>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartPalette.teachers }} /> Teachers</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartPalette.students }} /> Students</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartPalette.others }} /> Others</span>
                </div>
                <DateRangePicker value={overviewRange} onChange={setOverviewRange} />
              </div>
            </div>
            <div className="h-[240px] w-full">
              <Bar data={barData} options={barOptions} />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Student Analysis</h2>
                <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-900/40 text-rose-500 dark:text-rose-400 rounded-full text-xs font-semibold flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> 3.5%
                </span>
              </div>
              <DateRangePicker value={analysisRange} onChange={setAnalysisRange} />
            </div>
            <div className="h-[240px] w-full mt-2">
              <Line data={lineData} options={lineOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions table */}
      <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl pb-2">
        <CardContent className="p-0">
          <div className="p-5 flex justify-between items-center">
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Recent Transactions</h2>
            <button className="text-sm text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-neutral-900 hover:text-slate-900 dark:hover:text-white transition-colors">
              View All
            </button>
          </div>
          <div className="overflow-x-auto px-2">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead>
                <tr className="border-t border-b border-slate-100 dark:border-neutral-800 text-slate-500 dark:text-slate-400 font-medium">
                  <th className="px-5 py-3.5 font-semibold text-[12px] uppercase tracking-wide">Customer</th>
                  <th className="px-5 py-3.5 font-semibold text-[12px] uppercase tracking-wide">Course</th>
                  <th className="px-5 py-3.5 font-semibold text-[12px] uppercase tracking-wide">Amount</th>
                  <th className="px-5 py-3.5 font-semibold text-[12px] uppercase tracking-wide">Method</th>
                  <th className="px-5 py-3.5 font-semibold text-[12px] uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-[12px] uppercase tracking-wide text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-neutral-800/70">
                {transactions.map((tx, i) => {
                  const statusClass =
                    tx.status === 'Success' ? 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' :
                    tx.status === 'Pending' ? 'bg-amber-100/70 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' :
                                              'bg-rose-100/70 text-rose-500 dark:bg-rose-900/40 dark:text-rose-400';

                  return (
                    <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-neutral-900/70 group transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://ui-avatars.com/api/?name=${tx.name}&background=6366f1&color=fff&rounded=true`}
                            alt="user"
                            className="w-9 h-9 rounded-full"
                          />
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{tx.name}</p>
                            <p className="text-[11px] text-slate-400">User #FF{1000 + i * 37}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 font-medium">{tx.course}</td>
                      <td className="px-5 py-3.5 text-slate-900 dark:text-white font-semibold">{tx.amount}</td>
                      <td className="px-5 py-3.5">
                        {(() => {
                          const methodInfo = getPaymentMethodDetails(tx.method);
                          return (
                            <div className="flex items-center gap-2">
                              <div className="w-9 h-7 rounded-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 flex items-center justify-center overflow-hidden px-1">
                                <img
                                  src={methodInfo.logo}
                                  alt={methodInfo.label}
                                  className="max-h-4 w-auto object-contain"
                                />
                              </div>
                              <div>
                                <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{methodInfo.label}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">•••• {tx.cardLast4}</p>
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusClass}`}>{tx.status}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-500 dark:text-indigo-400 flex items-center justify-center transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-500 dark:text-emerald-400 flex items-center justify-center transition-colors">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-500 dark:text-rose-400 flex items-center justify-center transition-colors">
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
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

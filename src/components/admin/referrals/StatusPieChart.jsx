import { Pie } from 'react-chartjs-2';
import { useTheme } from '@/context/ThemeContext';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function StatusPieChart({ analytics }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const successfulReferrals = analytics.successfulReferrals || 0;
  const pendingReferrals = analytics.pendingReferrals || 0;
  const totalReferrals = successfulReferrals + pendingReferrals;

  const data = {
    labels: ['Successful', 'Pending'],
    datasets: [
      {
        data: [successfulReferrals, pendingReferrals],
        backgroundColor: [
          '#10B981', // emerald-500
          '#F59E0B'  // amber-500
        ],
        borderColor: [
          isDark ? '#000000' : '#ffffff',
          isDark ? '#000000' : '#ffffff'
        ],
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          color: isDark ? '#94a3b8' : '#64748b',
          font: {
            family: 'Poppins',
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed;
            const percentage = totalReferrals > 0 ? ((value / totalReferrals) * 100).toFixed(1) : 0;
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (totalReferrals === 0) {
    return (
      <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-6">
        <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-4">Referral Status Distribution</h3>
        <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500">
          <p>No referral data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-6">
      <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-4">Referral Status Distribution</h3>
      <div className="h-64">
        <Pie data={data} options={options} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400">Success Rate</p>
          <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            {totalReferrals > 0 ? ((successfulReferrals / totalReferrals) * 100).toFixed(1) : 0}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400">Pending Rate</p>
          <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
            {totalReferrals > 0 ? ((pendingReferrals / totalReferrals) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>
    </div>
  );
}

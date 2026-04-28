import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function StatusPieChart({ analytics }) {
  const successfulReferrals = analytics.successfulReferrals || 0;
  const pendingReferrals = analytics.pendingReferrals || 0;
  const totalReferrals = successfulReferrals + pendingReferrals;

  const data = {
    labels: ['Successful', 'Pending'],
    datasets: [
      {
        data: [successfulReferrals, pendingReferrals],
        backgroundColor: [
          '#10B981', // green-500
          '#F59E0B'  // yellow-500
        ],
        borderColor: [
          '#059669', // green-600
          '#D97706'  // yellow-600
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
          usePointStyle: true
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
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Referral Status Distribution</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>No referral data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Referral Status Distribution</h3>
      <div className="h-64">
        <Pie data={data} options={options} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="text-center">
          <p className="text-gray-500">Success Rate</p>
          <p className="text-lg font-semibold text-green-600">
            {totalReferrals > 0 ? ((successfulReferrals / totalReferrals) * 100).toFixed(1) : 0}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Pending Rate</p>
          <p className="text-lg font-semibold text-yellow-600">
            {totalReferrals > 0 ? ((pendingReferrals / totalReferrals) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>
    </div>
  );
}
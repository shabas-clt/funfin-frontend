import { Users, CheckCircle, Clock, Coins, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function StatsCards({ analytics }) {
  const stats = [
    {
      title: 'Total Referrals',
      value: analytics.totalReferrals || 0,
      icon: Users,
      bg: 'bg-indigo-100 dark:bg-indigo-900/40',
      color: 'text-indigo-500'
    },
    {
      title: 'Successful Referrals',
      value: analytics.successfulReferrals || 0,
      icon: CheckCircle,
      bg: 'bg-emerald-100 dark:bg-emerald-900/40',
      color: 'text-emerald-500'
    },
    {
      title: 'Pending Referrals',
      value: analytics.pendingReferrals || 0,
      icon: Clock,
      bg: 'bg-amber-100 dark:bg-amber-900/40',
      color: 'text-amber-500'
    },
    {
      title: 'Total Coins Awarded',
      value: analytics.totalCoinsAwarded || 0,
      icon: Coins,
      bg: 'bg-violet-100 dark:bg-violet-900/40',
      color: 'text-violet-500'
    },
    {
      title: 'Avg Referrals per User',
      value: (analytics.averageReferralsPerUser || 0).toFixed(2),
      icon: TrendingUp,
      bg: 'bg-cyan-100 dark:bg-cyan-900/40',
      color: 'text-cyan-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
            <CardContent className="p-5">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</span>
              <div className="flex items-center gap-4 mt-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[22px] font-bold text-slate-900 dark:text-white leading-tight truncate">{stat.value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

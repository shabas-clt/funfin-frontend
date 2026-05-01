import { useState, useEffect } from 'react';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Users, UserCheck, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TableSkeleton } from '@/components/ui/skeleton';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import { formatShortDate } from '@/lib/format';

const FILTER_OPTIONS = ['All', 'pending', 'completed', 'expired'];
const PAGE_SIZE = 20;
const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest first' },
  { value: 'createdAt-asc', label: 'Oldest first' },
  { value: 'rewardAmount-desc', label: 'Reward: High to Low' },
  { value: 'rewardAmount-asc', label: 'Reward: Low to High' },
  { value: 'status-asc', label: 'Status: A-Z' },
];

export default function ReferralRecords() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt-desc');
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchRecords = async (nextSkip = skip) => {
    try {
      setIsLoading(true);
      const [sortField, sortOrder] = sortBy.split('-');
      
      const res = await api.get('/admin/referral/records', {
        params: {
          skip: nextSkip,
          limit: PAGE_SIZE,
          search: searchQuery || undefined,
          status: filterStatus && filterStatus !== 'All' ? filterStatus : undefined,
          sortBy: sortField,
          sortOrder: sortOrder,
        },
      });
      
      setRecords(res.records || []);
      setTotal(res.total || 0);
      setSkip(nextSkip);
    } catch (error) {
      setRecords([]);
      setTotal(0);
      toast.error(typeof error === 'string' ? error : 'Failed to load referral records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(0);
  }, [searchQuery, filterStatus, sortBy]);

  const getStatusBadge = (status) => {
    const statusMap = {
      completed: { class: 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400', icon: UserCheck },
      pending: { class: 'bg-amber-100/70 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400', icon: Clock },
      expired: { class: 'bg-slate-100/70 text-slate-600 dark:bg-slate-900/40 dark:text-slate-400', icon: Clock },
    };
    const config = statusMap[status] || statusMap.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${config.class}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Referral Records</h1>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">
            View all referral relationships, track rewards, and monitor referral status
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-neutral-950 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Total Referrals</p>
                <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mt-1">{total}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-neutral-950 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Completed</p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">
                  {records.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-neutral-950 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">Pending</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1">
                  {records.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl overflow-hidden pb-4">
        <CardContent className="p-0">
          <div className="p-4 sm:p-5 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <div className="relative w-full md:w-[340px]">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-[#f8fafc] dark:bg-neutral-900 border border-transparent dark:border-neutral-800 focus:border-slate-200 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-neutral-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-100 dark:focus:ring-neutral-800 transition-all placeholder:text-slate-400 dark:text-slate-300"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <FilterDropdown options={FILTER_OPTIONS} value={filterStatus} onChange={setFilterStatus} />
              <div className="relative">
                <ArrowUpDown className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-9 pl-8 pr-3 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-700 dark:text-slate-200"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Mobile View */}
          <div className="md:hidden px-3 pb-3 space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-24 bg-slate-100 dark:bg-neutral-900 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : records.length === 0 ? (
              <p className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">No referral records found</p>
            ) : records.map((record) => (
              <div
                key={record.id}
                className="rounded-xl border border-slate-100 dark:border-neutral-800 p-3 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {record.referrerName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{record.referrerEmail}</p>
                  </div>
                  {getStatusBadge(record.status)}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>→</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-700 dark:text-slate-300">{record.refereeName}</p>
                    <p className="truncate">{record.refereeEmail}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-neutral-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Code: <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{record.referralCode}</span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {record.rewardAmount} coins
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">{formatShortDate(record.createdAt)}</p>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto px-2">
            <table className="w-full text-[13px] text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 dark:border-neutral-800">
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Referrer</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Referee</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Code</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Reward</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-neutral-800/70 text-slate-600 dark:text-slate-300 font-medium">
                {isLoading ? (
                  <TableSkeleton rows={8} cols={6} />
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-400 dark:text-slate-500">No referral records found</td>
                  </tr>
                ) : records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 dark:hover:bg-neutral-900/70 group transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(record.referrerName)}&background=6366f1&color=fff&rounded=true`}
                          alt="referrer"
                          className="w-9 h-9 rounded-full shadow-sm"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{record.referrerName}</p>
                          <p className="text-[11px] text-slate-400 font-normal">{record.referrerEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(record.refereeName)}&background=10b981&color=fff&rounded=true`}
                          alt="referee"
                          className="w-9 h-9 rounded-full shadow-sm"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{record.refereeName}</p>
                          <p className="text-[11px] text-slate-400 font-normal">{record.refereeEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">
                        {record.referralCode}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {record.rewardAmount} coins
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                      {formatShortDate(record.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && total > PAGE_SIZE && (
            <div className="px-5 pt-2 flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing {skip + 1}-{Math.min(skip + PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={skip <= 0}
                  onClick={() => fetchRecords(Math.max(0, skip - PAGE_SIZE))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-neutral-700 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {Math.floor(skip / PAGE_SIZE) + 1} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
                </span>
                <button
                  type="button"
                  disabled={skip + PAGE_SIZE >= total}
                  onClick={() => fetchRecords(skip + PAGE_SIZE)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-neutral-700 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

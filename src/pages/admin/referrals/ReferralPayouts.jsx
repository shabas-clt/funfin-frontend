import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  ChevronLeft, ChevronRight, Wallet, Clock, CheckCircle, XCircle, BadgeCheck, Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TableSkeleton } from '@/components/ui/skeleton';
import { referralApi } from '@/api/referralApi';
import { useAuth } from '../../../context/AuthContext';
import { formatUsd, formatShortDateTime } from '@/lib/format';
import RiskBadge from '../../../components/admin/referrals/RiskBadge';
import PayoutDetailModal from '../../../components/admin/referrals/PayoutDetailModal';

const PAGE_SIZE = 20;

const STATUS_TABS = [
  { value: 'pending_review', label: 'Pending review', icon: Clock },
  { value: 'paid', label: 'Paid', icon: CheckCircle },
  { value: 'rejected', label: 'Rejected', icon: XCircle },
  { value: '', label: 'All', icon: Wallet },
];

const STATUS_BADGE = {
  pending_review: { label: 'Pending', class: 'bg-amber-100/70 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400', icon: Clock },
  paid: { label: 'Paid', class: 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400', icon: CheckCircle },
  rejected: { label: 'Rejected', class: 'bg-rose-100/70 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400', icon: XCircle },
};

function StatusBadge({ status }) {
  const config = STATUS_BADGE[status] || STATUS_BADGE.pending_review;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${config.class}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export default function ReferralPayouts() {
  const { isAuthenticated } = useAuth();
  const [payouts, setPayouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('pending_review');
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState(null);

  const fetchPayouts = useCallback(async (nextSkip = 0, nextStatus = status) => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await referralApi.getPayouts({
        skip: nextSkip,
        limit: PAGE_SIZE,
        status: nextStatus || undefined,
      });
      setPayouts(res.payouts || []);
      setTotal(res.total || 0);
      setSkip(nextSkip);
    } catch (error) {
      setPayouts([]);
      setTotal(0);
      toast.error(typeof error === 'string' ? error : 'Failed to load payouts');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, status]);

  useEffect(() => {
    fetchPayouts(0, status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, status]);

  // Reflect an action taken in the detail modal back into the row.
  const handleUpdated = (updated) => {
    setPayouts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Payout Review</h1>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">
            Verify bank details, review fraud risk, and approve or reject referral withdrawals
          </p>
        </div>
      </div>

      <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl overflow-hidden pb-4">
        <CardContent className="p-0">
          {/* Status tabs */}
          <div className="p-4 sm:p-5 flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-neutral-800">
            {STATUS_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = status === tab.value;
              return (
                <button
                  key={tab.value || 'all'}
                  onClick={() => setStatus(tab.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
            {!isLoading && (
              <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">{total} total</span>
            )}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden px-3 py-3 space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-28 bg-slate-100 dark:bg-neutral-900 rounded-xl animate-pulse" />
              ))
            ) : payouts.length === 0 ? (
              <p className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">No payouts found</p>
            ) : payouts.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className="w-full text-left rounded-xl border border-slate-100 dark:border-neutral-800 p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{p.userName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.userEmail}</p>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white">{formatUsd(p.amount)}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={p.status} />
                  {p.status === 'pending_review' && <RiskBadge level={p.riskLevel} score={p.riskScore} showLabel={false} />}
                  {p.bankVerified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <BadgeCheck className="w-3 h-3" /> Bank verified
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">{formatShortDateTime(p.requestedAt)}</p>
              </button>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto px-2">
            <table className="w-full text-[13px] text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 dark:border-neutral-800">
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">User</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Amount</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Bank</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Risk</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Requested</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-neutral-800/70 text-slate-600 dark:text-slate-300 font-medium">
                {isLoading ? (
                  <TableSkeleton rows={8} cols={7} />
                ) : payouts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-10 text-center text-slate-400 dark:text-slate-500">No payouts found</td>
                  </tr>
                ) : payouts.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className="hover:bg-slate-50/80 dark:hover:bg-neutral-900/70 group transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.userName || '?')}&background=6366f1&color=fff&rounded=true`}
                          alt="user"
                          className="w-9 h-9 rounded-full shadow-sm"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{p.userName}</p>
                          <p className="text-[11px] text-slate-400 font-normal">{p.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">{formatUsd(p.amount)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{p.bankAccountLast4 ? `•••• ${p.bankAccountLast4}` : '—'}</span>
                        {p.bankVerified && <BadgeCheck className="w-4 h-4 text-emerald-500" title="Bank verified" />}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {p.status === 'pending_review'
                        ? <RiskBadge level={p.riskLevel} score={p.riskScore} showLabel={false} />
                        : <span className="text-slate-300 dark:text-neutral-600">—</span>}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{formatShortDateTime(p.requestedAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold text-xs">
                        <Eye className="w-3.5 h-3.5" /> Review
                      </span>
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
                  onClick={() => fetchPayouts(Math.max(0, skip - PAGE_SIZE), status)}
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
                  onClick={() => fetchPayouts(skip + PAGE_SIZE, status)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-neutral-700 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedId && (
        <PayoutDetailModal
          payoutId={selectedId}
          initialPayout={payouts.find((p) => p.id === selectedId) || null}
          onClose={() => setSelectedId(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}

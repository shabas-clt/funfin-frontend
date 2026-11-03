import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import { paymentsApi, errorText } from '@/api/paymentsApi';
import { formatNumber, formatShortDateTime } from '@/lib/format';
import { Pager } from '@/components/admin/payments/PurchaseTable';
import { KIND_LABELS } from '@/components/admin/payments/badges';

const PAGE_SIZE = 30;

const ACTION_LABELS = {
  refund: 'Refunded',
  revoke: 'Revoked',
  restore: 'Restored',
  grant: 'Granted',
  recover_shortfall: 'Recovered coins',
  dismiss_shortfall: 'Dismissed shortfall',
};

const ACTION_CLASSES = {
  refund: 'text-rose-600 dark:text-rose-400',
  revoke: 'text-rose-600 dark:text-rose-400',
  restore: 'text-emerald-600 dark:text-emerald-400',
  grant: 'text-violet-600 dark:text-violet-400',
};

// One readable line from the stored details.
function detailText(entry) {
  const d = entry.details || {};
  switch (entry.action) {
    case 'grant':
      if (entry.kind === 'course') return d.courseTitle;
      if (entry.kind === 'pro_signal') return `${d.days} days`;
      return `${formatNumber(d.coins)} coins`;
    case 'refund':
      return d.amount != null ? `${(d.amount / 100).toFixed(2)} ${String(d.currency || '').toUpperCase()}` : null;
    case 'recover_shortfall':
      return `${formatNumber(d.recovered)} coins, ${formatNumber(d.remaining)} left`;
    case 'dismiss_shortfall':
      return `${formatNumber(d.shortfall)} coins written off`;
    default:
      return d.clawbackShortfall ? `${formatNumber(d.clawbackShortfall)} coins already spent` : null;
  }
}

export default function AuditTab({ onOpenUser }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (nextSkip = 0) => {
    setLoading(true);
    try {
      const res = await paymentsApi.audit({ skip: nextSkip, limit: PAGE_SIZE });
      setRows(res.entries || []);
      setTotal(res.total || 0);
      setSkip(nextSkip);
    } catch (err) {
      toast.error(errorText(err, 'Failed to load audit log'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  return (
    <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
      <CardContent className="p-4 space-y-3">
        <div className="overflow-x-auto -mx-4">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-neutral-900 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-medium">When</th>
                <th className="px-4 py-2.5 font-medium">Admin</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
                <th className="px-4 py-2.5 font-medium">User</th>
                <th className="px-4 py-2.5 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No admin actions yet.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((e) => (
                  <tr key={e.id} className="align-top">
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{formatShortDateTime(e.createdAt)}</td>
                    <td className="px-4 py-2.5">
                      <div className="text-slate-900 dark:text-white">{e.adminName}</div>
                      <div className="text-[11px] text-slate-500">{e.adminEmail}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className={`font-medium ${ACTION_CLASSES[e.action] || 'text-slate-700 dark:text-slate-200'}`}>
                        {ACTION_LABELS[e.action] || e.action} {e.kind && KIND_LABELS[e.kind]}
                      </div>
                      {detailText(e) && <div className="text-[11px] text-slate-500">{detailText(e)}</div>}
                    </td>
                    <td className="px-4 py-2.5">
                      {e.userId ? (
                        <button type="button" onClick={() => onOpenUser(e.userId)} className="text-left hover:underline">
                          <div className="text-slate-900 dark:text-white">{e.userName || '—'}</div>
                          <div className="text-[11px] text-slate-500">{e.userEmail}</div>
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 max-w-md">{e.reason}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <Pager skip={skip} total={total} pageSize={PAGE_SIZE} loading={loading} onPage={load} />
      </CardContent>
    </Card>
  );
}

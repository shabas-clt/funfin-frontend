import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import { paymentsApi, errorText } from '@/api/paymentsApi';
import { formatNumber, formatShortDateTime } from '@/lib/format';
import { useCachedState, hasCached, useLatestRequest, usePageRestore } from '@/lib/pageCache';
import ActionDialog from '@/components/admin/payments/ActionDialog';
import { Pager } from '@/components/admin/payments/PurchaseTable';
import { ChannelBadge, refundReasonLabel, selectClass } from '@/components/admin/payments/badges';

const PAGE_SIZE = 20;

// A coin purchase was refunded after the user had already spent some of the
// coins, so the refund could not take them all back. Recover takes what the
// user has now; Dismiss accepts the loss.
export default function IssuesTab({ onOpenUser }) {
  // List, filter and page are cached, so coming back to this tab shows the
  // last list at once and refreshes it in the background.
  const [state, setState] = useCachedState('payments-issues:state', 'open');
  const [rows, setRows] = useCachedState('payments-issues:rows', []);
  const [total, setTotal] = useCachedState('payments-issues:total', 0);
  const [skip, setSkip] = useCachedState('payments-issues:skip', 0);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null);
  const showSkeleton = loading && !hasCached('payments-issues:rows');
  const isRefreshing = loading && !showSkeleton;
  const { begin: beginRequest, isLatest } = useLatestRequest();
  const restorePage = usePageRestore();

  const load = useCallback(
    async (nextSkip = 0) => {
      const id = beginRequest();
      setLoading(true);
      try {
        const res = await paymentsApi.issues({ state, skip: nextSkip, limit: PAGE_SIZE });
        if (!isLatest(id)) return;
        setRows(res.issues || []);
        setTotal(res.total || 0);
        setSkip(nextSkip);
      } catch (err) {
        if (!isLatest(id)) return;
        toast.error(errorText(err, 'Failed to load refund issues'));
      } finally {
        if (isLatest(id)) setLoading(false);
      }
    },
    [state, beginRequest, isLatest, setRows, setTotal, setSkip],
  );

  useEffect(() => {
    // On open, refresh the page the admin was on; after a filter change, go
    // back to the first page.
    load(restorePage(skip, [load]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const open = (row, type) => {
    const recover = type === 'recover';
    const take = Math.min(row.walletBalance, row.clawbackShortfall);
    setAction({
      title: recover ? 'Recover coins' : 'Dismiss issue',
      confirmLabel: recover ? `Take ${formatNumber(take)} coins` : 'Dismiss',
      danger: recover,
      description: recover ? (
        <p>
          Takes {formatNumber(take)} of the missing {formatNumber(row.clawbackShortfall)} coins from{' '}
          {row.userName}'s current balance ({formatNumber(row.walletBalance)}).
          {take < row.clawbackShortfall && ' The rest stays open.'}
        </p>
      ) : (
        <p>Closes the issue and accepts the loss of {formatNumber(row.clawbackShortfall)} coins.</p>
      ),
      run: async (reason) => {
        try {
          if (recover) await paymentsApi.recoverIssue(row.id, reason);
          else await paymentsApi.dismissIssue(row.id, reason);
          toast.success(recover ? 'Coins recovered' : 'Issue dismissed');
          load(skip);
        } catch (err) {
          toast.error(errorText(err, 'Action failed'));
          throw err;
        }
      },
    });
  };

  return (
    <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Coin purchases refunded after the user had spent the coins. Recover takes coins from their
            current balance; Dismiss accepts the loss.
          </p>
          <select value={state} onChange={(e) => setState(e.target.value)} className={selectClass}>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="all">All</option>
          </select>
        </div>

        <div className="overflow-x-auto -mx-4">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-neutral-900 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-medium">Refunded</th>
                <th className="px-4 py-2.5 font-medium">User</th>
                <th className="px-4 py-2.5 font-medium">Purchase</th>
                <th className="px-4 py-2.5 font-medium text-right">Taken back</th>
                <th className="px-4 py-2.5 font-medium text-right">Missing</th>
                <th className="px-4 py-2.5 font-medium text-right">Balance now</th>
                <th className="px-4 py-2.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-100 dark:divide-neutral-800 transition-opacity ${isRefreshing ? 'opacity-60' : ''}`}>
              {showSkeleton && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Loading…
                  </td>
                </tr>
              )}
              {!showSkeleton && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    {state === 'open' ? 'No open refund issues.' : 'Nothing here.'}
                  </td>
                </tr>
              )}
              {!showSkeleton &&
                rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                      {formatShortDateTime(row.refundedAt)}
                      <div className="text-[11px]">{refundReasonLabel(row.refundReason)}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <button type="button" onClick={() => onOpenUser(row.userId)} className="text-left hover:underline">
                        <div className="text-slate-900 dark:text-white">{row.userName || '—'}</div>
                        <div className="text-[11px] text-slate-500">{row.userEmail}</div>
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="text-slate-900 dark:text-white">{row.item}</div>
                      <ChannelBadge channel={row.channel} />
                    </td>
                    <td className="px-4 py-2.5 text-right">{formatNumber(row.coinsClawedBack)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-amber-600 dark:text-amber-400">
                      {formatNumber(row.clawbackShortfall)}
                    </td>
                    <td className="px-4 py-2.5 text-right">{formatNumber(row.walletBalance)}</td>
                    <td className="px-4 py-2.5 text-right">
                      {row.shortfallResolution ? (
                        <span className="text-xs text-slate-500 capitalize">
                          {row.shortfallResolution} {formatShortDateTime(row.shortfallResolvedAt)}
                        </span>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            disabled={row.walletBalance <= 0}
                            title={row.walletBalance <= 0 ? 'The user has no coins right now' : undefined}
                            onClick={() => open(row, 'recover')}
                            className="px-2 py-1 rounded-md text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 disabled:opacity-40"
                          >
                            Recover
                          </button>
                          <button
                            type="button"
                            onClick={() => open(row, 'dismiss')}
                            className="px-2 py-1 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <Pager skip={skip} total={total} pageSize={PAGE_SIZE} loading={loading} onPage={load} />
      </CardContent>
      <ActionDialog action={action} onClose={() => setAction(null)} />
    </Card>
  );
}

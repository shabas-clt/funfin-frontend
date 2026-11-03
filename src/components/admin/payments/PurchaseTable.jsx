import { useCallback, useState } from 'react';
import { Loader2, RotateCcw, Undo2, Ban } from 'lucide-react';
import { toast } from 'react-toastify';
import { paymentsApi, errorText } from '@/api/paymentsApi';
import { useAuth } from '@/context/AuthContext';
import { formatInr, formatUsd, formatShortDateTime, formatNumber } from '@/lib/format';
import ActionDialog from './ActionDialog';
import { ChannelBadge, KIND_LABELS, StatusBadge, refundReasonLabel } from './badges';

// What each action does, said plainly before the admin confirms.
function describe(row, type) {
  const what =
    row.kind === 'funcoin'
      ? `${formatNumber(row.coins)} FunCoins`
      : row.kind === 'course'
        ? `the course "${row.item}"`
        : 'this Pro Signals pass';
  if (type === 'refund') {
    const via = row.channel === 'google' ? 'Google Play' : 'Stripe';
    return {
      title: `Refund in ${via}`,
      confirmLabel: 'Refund and remove access',
      danger: true,
      description: (
        <>
          <p>
            Sends the full payment back to the customer through {via}, then removes {what}.
          </p>
          {row.kind === 'funcoin' && (
            <p className="text-amber-600 dark:text-amber-400">
              Coins the user already spent can't be taken back; they show up under Refund issues.
            </p>
          )}
          <p className="font-medium">The money can't be pulled back after this.</p>
        </>
      ),
    };
  }
  if (type === 'revoke') {
    return {
      title: 'Revoke access',
      confirmLabel: 'Revoke',
      danger: true,
      description: (
        <>
          <p>Removes {what} without moving any money.</p>
          {row.channel === 'apple' && (
            <p>
              App Store purchases can only be refunded by Apple. Use this for fraud or
              abuse; Apple keeps the payment.
            </p>
          )}
        </>
      ),
    };
  }
  return {
    title: 'Restore access',
    confirmLabel: 'Restore',
    danger: false,
    description: (
      <p>
        Gives {what} back and marks the purchase paid again. No money moves.
        {row.kind === 'pro_signal' && ' Pro gets the days that were unused when it was refunded.'}
      </p>
    ),
  };
}

// Refund / revoke / restore with a reason dialog. `onDone` reloads the caller.
export function usePurchaseActions(onDone) {
  const [action, setAction] = useState(null);

  const open = useCallback(
    (row, type) => {
      const run = async (reason) => {
        try {
          await paymentsApi[type](row.kind, row.id, reason);
          toast.success(
            type === 'refund' ? 'Refunded' : type === 'revoke' ? 'Access revoked' : 'Access restored',
          );
          onDone?.();
        } catch (err) {
          toast.error(errorText(err, 'Action failed'));
          throw err;
        }
      };
      setAction({ ...describe(row, type), run });
    },
    [onDone],
  );

  const dialog = <ActionDialog action={action} onClose={() => setAction(null)} />;
  return { open, dialog };
}

function Amount({ row }) {
  if (row.channel === 'admin' || row.channel === 'free') {
    return <span className="text-slate-400 text-xs">—</span>;
  }
  if (row.channel === 'funcoin') {
    return <span className="text-xs text-slate-500">Coins</span>;
  }
  return (
    <>
      {row.amountUsd != null ? formatUsd(row.amountUsd) : formatInr(row.amountInr)}
      {row.currencyCharged && row.amountCharged != null && (
        <span className="block text-[11px] font-normal text-slate-400">
          charged {row.amountCharged} {row.currencyCharged.toUpperCase()}
        </span>
      )}
    </>
  );
}

export default function PurchaseTable({ rows, loading, onReload, onOpenUser, showUser = true }) {
  const { admin } = useAuth();
  const canRefund = admin?.role === 'superadmin';
  const { open, dialog } = usePurchaseActions(onReload);
  const cols = showUser ? 7 : 6;

  return (
    <>
      <div className="overflow-x-auto -mx-4">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-neutral-900 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2.5 font-medium">When</th>
              {showUser && <th className="px-4 py-2.5 font-medium">User</th>}
              <th className="px-4 py-2.5 font-medium">Item</th>
              <th className="px-4 py-2.5 font-medium">Channel</th>
              <th className="px-4 py-2.5 font-medium text-right">Amount</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
            {loading && (
              <tr>
                <td colSpan={cols} className="px-4 py-8 text-center text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={cols} className="px-4 py-8 text-center text-slate-500 text-sm">
                  No purchases match those filters.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row) => (
                <tr key={`${row.kind}:${row.id}`} className="hover:bg-slate-50 dark:hover:bg-neutral-900/60 align-top">
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {formatShortDateTime(row.createdAt)}
                  </td>
                  {showUser && (
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => row.userId && onOpenUser?.(row.userId)}
                        className="text-left hover:underline"
                      >
                        <div className="text-slate-900 dark:text-white">{row.userName || '—'}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {row.userEmail || row.userId}
                        </div>
                      </button>
                    </td>
                  )}
                  <td className="px-4 py-2.5">
                    <div className="text-slate-900 dark:text-white">{row.item}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {KIND_LABELS[row.kind]}
                      {row.kind === 'pro_signal' && row.endsAt && ` · until ${formatShortDateTime(row.endsAt)}`}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <ChannelBadge channel={row.channel} />
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                    <Amount row={row} />
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={row.status} />
                    {row.status === 'refunded' && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {refundReasonLabel(row.refundReason)}
                        {row.clawbackShortfall > 0 && (
                          <span className="block text-amber-600 dark:text-amber-400">
                            {formatNumber(row.clawbackShortfall)} coins already spent
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      {row.actions?.refund && canRefund && (
                        <button
                          type="button"
                          onClick={() => open(row, 'refund')}
                          title="Refund the payment and remove access"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                        >
                          <Undo2 className="w-3.5 h-3.5" /> Refund
                        </button>
                      )}
                      {row.actions?.revoke && (
                        <button
                          type="button"
                          onClick={() => open(row, 'revoke')}
                          title="Remove access without moving money"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800"
                        >
                          <Ban className="w-3.5 h-3.5" /> Revoke
                        </button>
                      )}
                      {row.actions?.restore && (
                        <button
                          type="button"
                          onClick={() => open(row, 'restore')}
                          title="Give access back"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {dialog}
    </>
  );
}

export function Pager({ skip, total, pageSize, loading, onPage }) {
  if (total <= pageSize) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <button
        type="button"
        disabled={skip === 0 || loading}
        onClick={() => onPage(Math.max(0, skip - pageSize))}
        className="text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40"
      >
        Previous
      </button>
      <div className="text-xs text-slate-500">
        {skip + 1}–{Math.min(skip + pageSize, total)} of {total}
      </div>
      <button
        type="button"
        disabled={skip + pageSize >= total || loading}
        onClick={() => onPage(skip + pageSize)}
        className="text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

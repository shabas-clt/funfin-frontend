import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import { paymentsApi, errorText } from '@/api/paymentsApi';
import { formatInr, formatNumber, formatUsd } from '@/lib/format';
import { CHANNEL_LABELS, KIND_LABELS, refundReasonLabel, selectClass } from '@/components/admin/payments/badges';

const RANGES = [7, 30, 90, 365];

function Stat({ label, value, hint, tone, onClick }) {
  const toneClass =
    tone === 'warn'
      ? 'text-amber-600 dark:text-amber-400'
      : tone === 'bad'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-slate-900 dark:text-white';
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
      <Wrapper
        type={onClick ? 'button' : undefined}
        onClick={onClick}
        className="w-full text-left p-4 block"
      >
        <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
        <div className={`text-2xl font-semibold mt-1 ${toneClass}`}>{value}</div>
        {hint && <div className="text-[11px] text-slate-400 mt-1">{hint}</div>}
      </Wrapper>
    </Card>
  );
}

function Breakdown({ title, rows, labels }) {
  return (
    <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
      <CardContent className="p-4">
        <div className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{title}</div>
        {rows.length === 0 ? (
          <div className="text-sm text-slate-500">No paid purchases in this period.</div>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {rows.map((r) => (
                <tr key={r.key}>
                  <td className="py-2 text-slate-700 dark:text-slate-200">{labels[r.key] || r.key}</td>
                  <td className="py-2 text-right text-slate-500">{formatNumber(r.count)}</td>
                  <td className="py-2 text-right font-semibold text-slate-900 dark:text-white">
                    {formatUsd(r.amountUsd)}
                    <span className="block text-[11px] font-normal text-slate-400">{formatInr(r.amountInr)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

export default function OverviewTab({ onGoTo }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await paymentsApi.overview(days));
    } catch (err) {
      toast.error(errorText(err, 'Failed to load overview'));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Paid purchases created in the last {days} days. Admin grants and free courses are not revenue.
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className={selectClass}>
          {RANGES.map((d) => (
            <option key={d} value={d}>
              Last {d} days
            </option>
          ))}
        </select>
      </div>

      {loading || !data ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Loading…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Gross sales" value={formatUsd(data.grossUsd)} hint="Before store and card fees" />
            <Stat
              label="Est. net after store fees"
              value={formatUsd(data.estimatedNetUsd)}
              hint={`Apple ${Math.round(data.appleCommissionRate * 100)}%, Google ${Math.round((data.googleCommissionRate ?? 0.15) * 100)}% (${formatUsd(data.estimatedStoreFeesUsd)}); Stripe fees not included`}
            />
            <Stat
              label="Refunds & chargebacks"
              value={formatNumber(data.refunds.count)}
              hint={formatUsd(data.refunds.amountUsd)}
              tone={data.refunds.count ? 'bad' : undefined}
            />
            <Stat
              label="Open refund issues"
              value={formatNumber(data.openIssues.count)}
              hint={`${formatNumber(data.openIssues.coins)} coins already spent`}
              tone={data.openIssues.count ? 'warn' : undefined}
              onClick={() => onGoTo('issues')}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-3">
            <Breakdown title="By channel" rows={data.byChannel} labels={CHANNEL_LABELS} />
            <Breakdown title="By product" rows={data.byKind} labels={KIND_LABELS} />
          </div>

          <div className="grid lg:grid-cols-2 gap-3">
            <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
              <CardContent className="p-4">
                <div className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Refund reasons</div>
                {Object.keys(data.refunds.byReason).length === 0 ? (
                  <div className="text-sm text-slate-500">No refunds in this period.</div>
                ) : (
                  <ul className="text-sm space-y-1.5">
                    {Object.entries(data.refunds.byReason).map(([reason, count]) => (
                      <li key={reason} className="flex justify-between">
                        <span className="text-slate-700 dark:text-slate-200">{refundReasonLabel(reason)}</span>
                        <span className="text-slate-500">{formatNumber(count)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
              <CardContent className="p-4 text-sm space-y-1.5">
                <div className="font-semibold text-slate-900 dark:text-white mb-2">Not counted as sales</div>
                <div className="flex justify-between">
                  <span className="text-slate-700 dark:text-slate-200">Admin grants</span>
                  <span className="text-slate-500">{formatNumber(data.adminGrants)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 dark:text-slate-200">Courses bought with coins</span>
                  <span className="text-slate-500">{formatNumber(data.coursesBoughtWithCoins)}</span>
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  Coin spending isn't new money; it was counted when the coins were bought.
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

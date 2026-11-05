import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import { Pager } from '@/components/admin/payments/PurchaseTable';
import { selectClass } from '@/components/admin/payments/badges';
import { errorText } from '@/api/paymentsApi';
import { formatServerDateTime } from '@/lib/format';
import ReportDetailModal from '@/components/admin/moderation/ReportDetailModal';
import {
  moderationApi,
  REASON_LABELS,
  TARGET_LABELS,
  STATUS_LABELS,
  SLA_HOURS,
  formatAge,
} from '@/api/moderationApi';

const PAGE_SIZE = 20;

function Stat({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'text-slate-900 dark:text-white',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
  };
  return (
    <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className={`text-2xl font-semibold mt-1 ${tones[tone]}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

// Reports users file from the app (reels, comments, memes). Oldest first,
// because the 24-hour clock runs from when the report was filed.
export default function ModerationQueue() {
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState('open');
  const [targetType, setTargetType] = useState('');
  const [reason, setReason] = useState('');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await moderationApi.summary());
    } catch (err) {
      toast.error(errorText(err, 'Failed to load the queue summary'));
    }
  }, []);

  const load = useCallback(
    async (nextSkip = 0) => {
      setLoading(true);
      try {
        const res = await moderationApi.reports({
          status: status === 'open' ? undefined : status,
          targetType: targetType || undefined,
          reason: reason || undefined,
          skip: nextSkip,
          limit: PAGE_SIZE,
        });
        setRows(res.reports || []);
        setTotal(res.total || 0);
        setSkip(nextSkip);
      } catch (err) {
        toast.error(errorText(err, 'Failed to load reports'));
      } finally {
        setLoading(false);
      }
    },
    [status, targetType, reason],
  );

  useEffect(() => {
    load(0);
  }, [load]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const refresh = () => {
    load(skip);
    loadSummary();
  };

  const breaching = summary?.breachingSlaCount || 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white">Moderation</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Reports on reels, comments and memes from the app. Review each within {SLA_HOURS} hours: dismiss it,
            remove the content, or remove it and suspend the author.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-900 self-start"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Pending" value={summary ? summary.pending : '—'} tone={summary?.pending ? 'amber' : 'slate'} />
        <Stat label={`Over ${SLA_HOURS} h`} value={summary ? breaching : '—'} tone={breaching ? 'rose' : 'slate'} />
        <Stat label="Oldest open" value={summary ? formatAge(summary.oldestPendingHours) : '—'} />
        <Stat
          label="Resolved"
          value={summary ? (summary.actioned || 0) + (summary.dismissed || 0) : '—'}
        />
      </div>

      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass} aria-label="Status">
              <option value="open">Open (pending + reviewing)</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select value={targetType} onChange={(e) => setTargetType(e.target.value)} className={selectClass} aria-label="Type">
              <option value="">All types</option>
              {Object.entries(TARGET_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className={selectClass} aria-label="Reason">
              <option value="">All reasons</option>
              {Object.entries(REASON_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto -mx-4">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-neutral-900 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Waiting</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">Reason</th>
                  <th className="px-4 py-2.5 font-medium">Author</th>
                  <th className="px-4 py-2.5 font-medium hidden lg:table-cell">Reporter</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      {status === 'open' ? 'No open reports. The queue is clear.' : 'Nothing here.'}
                    </td>
                  </tr>
                )}
                {!loading &&
                  rows.map((row) => {
                    const open = ['pending', 'reviewing'].includes(row.status);
                    const late = open && row.ageHours >= SLA_HOURS;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelected(row.id)}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900/70"
                      >
                        <td className={`px-4 py-2.5 whitespace-nowrap ${late ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                          {formatAge(row.ageHours)}
                          <div className="text-[11px] font-normal text-slate-400">{formatServerDateTime(row.createdAt)}</div>
                        </td>
                        <td className="px-4 py-2.5">{TARGET_LABELS[row.targetType] || row.targetType}</td>
                        <td className="px-4 py-2.5">
                          {REASON_LABELS[row.reason] || row.reason}
                          {row.details && (
                            <div className="text-[11px] text-slate-500 max-w-xs truncate">{row.details}</div>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="text-slate-900 dark:text-white">{row.author?.fullName || '—'}</div>
                          <div className="text-[11px] text-slate-500">{row.author?.email}</div>
                        </td>
                        <td className="px-4 py-2.5 hidden lg:table-cell text-slate-500">
                          {row.reporter?.fullName || (row.source === 'auto_filter' ? 'Automatic filter' : '—')}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">{STATUS_LABELS[row.status] || row.status}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <Pager skip={skip} total={total} pageSize={PAGE_SIZE} loading={loading} onPage={load} />
        </CardContent>
      </Card>

      <ReportDetailModal reportId={selected} onClose={() => setSelected(null)} onChanged={refresh} />
    </div>
  );
}

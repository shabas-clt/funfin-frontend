import { useEffect, useState, useCallback } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import { formatInr, formatNumber, formatShortDateTime } from '@/lib/format';
import PaymentInstrument from '@/components/shared/PaymentInstrument';

const PAGE_SIZE = 20;

// Backend returns flat `paymentMethod` / `cardNetwork` / `cardLast4` / ... fields
// on FuncoinAdminPurchaseItem rather than a nested `paymentInstrument` object.
// Adapt to the PaymentInstrument component's expected shape so the visual is
// identical to the dashboard's recent-transactions table.
function toInstrument(row) {
  if (!row) return null;
  if (!row.paymentMethod && !row.vpa && !row.bank && !row.wallet) return null;
  return {
    method: row.paymentMethod,
    cardNetwork: row.cardNetwork,
    cardLast4: row.cardLast4,
    cardIssuer: row.cardIssuer,
    bank: row.bank,
    wallet: row.wallet,
    vpa: row.vpa,
  };
}

function StatusBadge({ status }) {
  const map = {
    paid: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
    created: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
    failed: 'bg-rose-50 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
  };
  const cls = map[status] || 'bg-slate-100 text-slate-500 dark:bg-neutral-800';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${cls}`}>
      {status}
    </span>
  );
}

export default function PurchasesTab() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const load = useCallback(
    async (nextSkip = 0) => {
      try {
        setLoading(true);
        const params = { skip: nextSkip, limit: PAGE_SIZE, sortBy, sortOrder };
        if (statusFilter) params.status = statusFilter;
        if (usernameFilter) params.username = usernameFilter;
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
        const res = await api.get('/funcoin/purchases', { params });
        setRows(res.purchases || []);
        setTotal(res.total || 0);
        setSkip(nextSkip);
      } catch (err) {
        toast.error(typeof err === 'string' ? err : 'Failed to load purchases');
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, usernameFilter, fromDate, toDate, sortBy, sortOrder],
  );

  useEffect(() => {
    load(0);
  }, [load]);

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setUsernameFilter(usernameInput.trim());
              }}
              className="relative flex-1 min-w-[180px]"
            >
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Search user name or email"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
              />
            </form>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            >
              <option value="">All statuses</option>
              <option value="created">Created</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [by, ord] = e.target.value.split(':');
                setSortBy(by);
                setSortOrder(ord);
              }}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            >
              <option value="createdAt:desc">Newest first</option>
              <option value="createdAt:asc">Oldest first</option>
              <option value="amountInr:desc">Amount: high → low</option>
              <option value="amountInr:asc">Amount: low → high</option>
            </select>
          </div>

          <div className="overflow-x-auto -mx-4">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-neutral-900 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">When</th>
                  <th className="px-4 py-2.5 font-medium">User</th>
                  <th className="px-4 py-2.5 font-medium text-right">Coins</th>
                  <th className="px-4 py-2.5 font-medium text-right">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Rate</th>
                  <th className="px-4 py-2.5 font-medium">Payment</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">
                      No purchases match those filters.
                    </td>
                  </tr>
                )}
                {!loading &&
                  rows.map((row) => {
                    const instrument = toInstrument(row);
                    return (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-neutral-900/60">
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatShortDateTime(row.createdAt)}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="text-slate-900 dark:text-white">
                            {row.userName || '—'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {row.userEmail || row.userId}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-900 dark:text-white">
                          {formatNumber(row.coins)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-900 dark:text-white">
                          {formatInr(row.amountInr)}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs">
                          {row.rateAtPurchase != null ? formatInr(row.rateAtPurchase) : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          {row.status === 'paid' && instrument ? (
                            <PaymentInstrument instrument={instrument} channel="razorpay" />
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={row.status} />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={skip === 0 || loading}
                onClick={() => load(Math.max(0, skip - PAGE_SIZE))}
                className="text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <div className="text-xs text-slate-500">
                {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total}
              </div>
              <button
                type="button"
                disabled={skip + PAGE_SIZE >= total || loading}
                onClick={() => load(skip + PAGE_SIZE)}
                className="text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

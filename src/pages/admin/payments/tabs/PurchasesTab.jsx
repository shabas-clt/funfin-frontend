import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import { paymentsApi, errorText } from '@/api/paymentsApi';
import PurchaseTable, { Pager } from '@/components/admin/payments/PurchaseTable';
import { CHANNEL_LABELS, KIND_LABELS, inputClass, selectClass } from '@/components/admin/payments/badges';

const PAGE_SIZE = 20;

export default function PurchasesTab({ onOpenUser }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('');
  const [channel, setChannel] = useState('');
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const load = useCallback(
    async (nextSkip = 0) => {
      setLoading(true);
      try {
        const params = { skip: nextSkip, limit: PAGE_SIZE };
        if (search) params.search = search;
        if (kind) params.kind = kind;
        if (channel) params.channel = channel;
        if (status) params.status = status;
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
        const res = await paymentsApi.purchases(params);
        setRows(res.purchases || []);
        setTotal(res.total || 0);
        setSkip(nextSkip);
      } catch (err) {
        toast.error(errorText(err, 'Failed to load purchases'));
      } finally {
        setLoading(false);
      }
    },
    [search, kind, channel, status, fromDate, toDate],
  );

  useEffect(() => {
    load(0);
  }, [load]);

  return (
    <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center flex-wrap">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput.trim());
            }}
            className="relative flex-1 min-w-[200px]"
          >
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search user name, email or id"
              className={`${inputClass} pl-9`}
            />
          </form>
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={selectClass}>
            <option value="">All products</option>
            {['funcoin', 'course', 'pro_signal'].map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </select>
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className={selectClass}>
            <option value="">All channels</option>
            {['stripe', 'apple', 'google', 'funcoin', 'admin', 'free', 'dev', 'razorpay'].map((c) => (
              <option key={c} value={c}>
                {CHANNEL_LABELS[c]}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
            <option value="created">Not paid yet</option>
            <option value="failed">Failed</option>
          </select>
          <input
            type="date"
            aria-label="From date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={selectClass}
          />
          <input
            type="date"
            aria-label="To date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className={selectClass}
          />
        </div>

        <PurchaseTable
          rows={rows}
          loading={loading}
          onReload={() => load(skip)}
          onOpenUser={onOpenUser}
        />
        <Pager skip={skip} total={total} pageSize={PAGE_SIZE} loading={loading} onPage={load} />
      </CardContent>
    </Card>
  );
}

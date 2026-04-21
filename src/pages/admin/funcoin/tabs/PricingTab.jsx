import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Loader2, Save, Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import { funcoinPriceSchema } from '@/lib/validation/schemas';
import { formatInr, formatShortDateTime } from '@/lib/format';
import FieldError from '@/components/shared/FieldError';

const PAGE_SIZE = 10;

export default function PricingTab() {
  const [current, setCurrent] = useState(null);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(funcoinPriceSchema),
    defaultValues: { pricePerCoin: '', note: '' },
  });

  const loadCurrent = useCallback(async () => {
    try {
      setLoadingCurrent(true);
      const res = await api.get('/funcoin/price');
      setCurrent(res);
      reset({ pricePerCoin: res?.pricePerCoin ?? '', note: '' });
    } catch {
      toast.error('Failed to load current price');
    } finally {
      setLoadingCurrent(false);
    }
  }, [reset]);

  const loadHistory = useCallback(async (nextSkip = 0) => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/funcoin/pricing-history', {
        params: { skip: nextSkip, limit: PAGE_SIZE },
      });
      setHistory(res.history || []);
      setHistoryTotal(res.total || 0);
      setSkip(nextSkip);
    } catch {
      toast.error('Failed to load pricing history');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadCurrent();
    loadHistory(0);
  }, [loadCurrent, loadHistory]);

  const onSubmit = async (values) => {
    try {
      const res = await api.patch('/funcoin/price', {
        pricePerCoin: Number(values.pricePerCoin),
        note: values.note?.trim() || undefined,
      });
      setCurrent(res);
      toast.success('Price updated');
      // Reset note but keep the new price displayed in the field.
      reset({ pricePerCoin: res?.pricePerCoin ?? '', note: '' });
      // Refresh history from the top because a new row now exists.
      loadHistory(0);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update price');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <Card className="lg:col-span-2 bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <Coins className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Current rate</div>
              <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                {loadingCurrent ? '—' : formatInr(current?.pricePerCoin)}
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium"> / coin</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                New price (INR per coin)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('pricePerCoin', { valueAsNumber: true })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. 0.10"
                disabled={isSubmitting}
              />
              <FieldError error={errors.pricePerCoin} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Note (optional)
              </label>
              <input
                type="text"
                {...register('note')}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Why are you changing it?"
                disabled={isSubmitting}
              />
              <FieldError error={errors.note} />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save price
            </button>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              This is the rate new purchases and course funcoin-equivalents use.
              Existing purchases retain their original rate.
            </p>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3 bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">History</h3>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {historyTotal} change{historyTotal === 1 ? '' : 's'}
            </div>
          </div>

          {loadingHistory ? (
            <div className="h-40 flex items-center justify-center text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> <span className="ml-2">Loading…</span>
            </div>
          ) : history.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm text-slate-500">
              No price changes yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-neutral-800">
              {history.map((row) => (
                <div key={row.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatInr(row.pricePerCoin)}
                    </div>
                    {row.note && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {row.note}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {formatShortDateTime(row.effectiveAt || row.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {historyTotal > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={skip === 0 || loadingHistory}
                onClick={() => loadHistory(Math.max(0, skip - PAGE_SIZE))}
                className="text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={skip + PAGE_SIZE >= historyTotal || loadingHistory}
                onClick={() => loadHistory(skip + PAGE_SIZE)}
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

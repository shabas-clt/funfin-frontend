import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Loader2, Plus, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import { funcoinTransactionCreateSchema } from '@/lib/validation/schemas';
import FieldError from '@/components/shared/FieldError';
import { formatNumber, formatShortDateTime } from '@/lib/format';

const PAGE_SIZE = 20;

function CreateForm({ categories, onCreated }) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(funcoinTransactionCreateSchema),
    mode: 'onChange',
    defaultValues: {
      userId: '',
      kind: 'earn',
      categoryCode: '',
      coins: '',
      referenceType: '',
      referenceId: '',
      referenceTitle: '',
      notes: '',
    },
  });

  const kind = watch('kind');
  const filteredCategories = categories.filter((c) => c.kind === kind && c.isActive);

  // If the selected category's kind no longer matches, clear it so the
  // admin has to re-pick. This avoids a backend 400 "kind must match".
  useEffect(() => {
    setValue('categoryCode', '');
  }, [kind, setValue]);

  const onSubmit = async (values) => {
    try {
      const payload = {
        userId: values.userId.trim(),
        kind: values.kind,
        categoryCode: values.categoryCode,
        coins: Number(values.coins),
      };
      if (values.referenceType?.trim()) payload.referenceType = values.referenceType.trim();
      if (values.referenceId?.trim()) payload.referenceId = values.referenceId.trim();
      if (values.referenceTitle?.trim()) payload.referenceTitle = values.referenceTitle.trim();
      if (values.notes?.trim()) payload.notes = values.notes.trim();

      const res = await api.post('/funcoin/transactions', payload);
      toast.success(
        `${kind === 'earn' ? 'Credited' : 'Debited'} ${res.coins} coins — balance ${res.balanceAfter}`,
      );
      reset({ ...values, coins: '', referenceType: '', referenceId: '', referenceTitle: '', notes: '' });
      onCreated();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to record transaction');
    }
  };

  return (
    <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Record adjustment
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <input
              {...register('userId')}
              placeholder="User ID (MongoDB _id)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-mono"
            />
            <FieldError error={errors.userId} />
          </div>
          <div>
            <select
              {...register('kind')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            >
              <option value="earn">Earn</option>
              <option value="spend">Spend</option>
            </select>
          </div>
          <div>
            <select
              {...register('categoryCode')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            >
              <option value="">Select category…</option>
              {filteredCategories.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <FieldError error={errors.categoryCode} />
          </div>
          <div>
            <input
              type="number"
              {...register('coins', { valueAsNumber: true })}
              placeholder="Coins"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
            <FieldError error={errors.coins} />
          </div>
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Record
            </button>
          </div>

          <div className="md:col-span-2">
            <input
              {...register('referenceType')}
              placeholder="Reference type (optional)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <input
              {...register('referenceId')}
              placeholder="Reference id (optional)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <input
              {...register('referenceTitle')}
              placeholder="Reference title (optional)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>

          <div className="md:col-span-6">
            <input
              {...register('notes')}
              placeholder="Notes (why are you adjusting?)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
            <FieldError error={errors.notes} />
          </div>
        </form>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3">
          These adjustments go through the same wallet service as regular events, so
          the balance is always consistent.
        </p>
      </CardContent>
    </Card>
  );
}

function KindIcon({ kind }) {
  if (kind === 'earn') return <ArrowDownCircle className="w-4 h-4 text-emerald-500" />;
  return <ArrowUpCircle className="w-4 h-4 text-rose-500" />;
}

export default function TransactionsTab() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [kindFilter, setKindFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [userIdInput, setUserIdInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  const load = useCallback(
    async (nextSkip = 0) => {
      try {
        setLoading(true);
        const params = { skip: nextSkip, limit: PAGE_SIZE };
        if (kindFilter) params.kind = kindFilter;
        if (userIdFilter) params.user_id = userIdFilter;
        const res = await api.get('/funcoin/transactions', { params });
        setRows(res.transactions || []);
        setTotal(res.total || 0);
        setSkip(nextSkip);
      } catch (err) {
        toast.error(typeof err === 'string' ? err : 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    },
    [kindFilter, userIdFilter],
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/funcoin/categories');
        setCategories(res.categories || []);
      } catch {
        // Non-fatal — the form just won't have a dropdown.
      }
    })();
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  return (
    <div className="space-y-4">
      <CreateForm categories={categories} onCreated={() => load(0)} />

      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mr-auto">
              Ledger <span className="text-xs text-slate-500">({total})</span>
            </h3>
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            >
              <option value="">All kinds</option>
              <option value="earn">Earn</option>
              <option value="spend">Spend</option>
            </select>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setUserIdFilter(userIdInput.trim());
              }}
              className="flex gap-2"
            >
              <input
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
                placeholder="Filter by user ID"
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-200 text-sm"
              >
                Apply
              </button>
              {userIdFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setUserIdInput('');
                    setUserIdFilter('');
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm text-slate-500"
                >
                  Clear
                </button>
              )}
            </form>
          </div>

          <div className="overflow-x-auto -mx-4">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-neutral-900 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">When</th>
                  <th className="px-4 py-2.5 font-medium">User</th>
                  <th className="px-4 py-2.5 font-medium">Kind</th>
                  <th className="px-4 py-2.5 font-medium">Category</th>
                  <th className="px-4 py-2.5 font-medium text-right">Coins</th>
                  <th className="px-4 py-2.5 font-medium text-right">Balance</th>
                  <th className="px-4 py-2.5 font-medium">Reference</th>
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
                      No transactions match those filters.
                    </td>
                  </tr>
                )}
                {!loading &&
                  rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-neutral-900/60">
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatShortDateTime(row.createdAt)}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-mono text-slate-500 dark:text-slate-400">
                        {row.userId}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="inline-flex items-center gap-1.5">
                          <KindIcon kind={row.kind} />
                          <span className="capitalize">{row.kind}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-900 dark:text-white">
                        {row.categoryName}
                        <div className="text-[11px] text-slate-400 font-mono">{row.categoryCode}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold">
                        <span
                          className={
                            row.kind === 'earn'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {row.kind === 'earn' ? '+' : '−'}
                          {formatNumber(row.coins)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-900 dark:text-white">
                        {formatNumber(row.balanceAfter)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs">
                        {row.referenceTitle || row.referenceType || '—'}
                      </td>
                    </tr>
                  ))}
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

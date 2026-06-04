import { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, Save, X, Edit2, Trash2, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const EMPTY = {
  name: '',
  coins: '',
  priceUsd: '',
  priceInr: '',
  isPopular: false,
  isActive: true,
  sortOrder: 0,
};

function buildPayload(form) {
  return {
    name: String(form.name).trim(),
    coins: Number(form.coins),
    priceUsd: Number(form.priceUsd),
    priceInr: Number(form.priceInr) || 0,
    isPopular: Boolean(form.isPopular),
    isActive: Boolean(form.isActive),
    sortOrder: Number(form.sortOrder) || 0,
  };
}

function validate(form) {
  if (!String(form.name).trim()) return 'Name is required';
  if (!(Number(form.coins) > 0)) return 'Coins must be greater than 0';
  if (!(Number(form.priceUsd) >= 0)) return 'Price (USD) is required';
  return null;
}

const inputCls =
  'w-full px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm';

function PackForm({ initial, submitting, onSubmit, onCancel, mode }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = () => {
    const err = validate(form);
    if (err) {
      toast.error(err);
      return;
    }
    onSubmit(buildPayload(form));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
      <div className="md:col-span-2">
        <label className="block text-[11px] text-slate-500 mb-1">Name</label>
        <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Pro" className={inputCls} />
      </div>
      <div>
        <label className="block text-[11px] text-slate-500 mb-1">Coins</label>
        <input type="number" value={form.coins} onChange={(e) => set('coins', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="block text-[11px] text-slate-500 mb-1">Price USD</label>
        <input type="number" step="0.01" value={form.priceUsd} onChange={(e) => set('priceUsd', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="block text-[11px] text-slate-500 mb-1">Price INR</label>
        <input type="number" step="0.01" value={form.priceInr} onChange={(e) => set('priceInr', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="block text-[11px] text-slate-500 mb-1">Order</label>
        <input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} className={inputCls} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={form.isPopular} onChange={(e) => set('isPopular', e.target.checked)} /> Popular
        </label>
        <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Active
        </label>
      </div>
      <div className="md:col-span-7 flex items-center gap-2">
        <button type="button" onClick={submit} disabled={submitting} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'edit' ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {mode === 'edit' ? 'Save' : 'Add pack'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 text-sm">
            <X className="w-4 h-4" /> Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default function PacksTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/funcoin/packs');
      setRows(res.packs || []);
    } catch {
      toast.error('Failed to load coin packs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (payload) => {
    setSubmitting(true);
    try {
      await api.post('/funcoin/packs', payload);
      toast.success('Coin pack created');
      load();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to create pack');
    } finally {
      setSubmitting(false);
    }
  };

  const update = async (id, payload) => {
    setSubmitting(true);
    try {
      await api.patch(`/funcoin/packs/${id}`, payload);
      toast.success('Coin pack updated');
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update pack');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (pack) => {
    const result = await Swal.fire({
      title: 'Delete coin pack?',
      text: `"${pack.name}" (${pack.coins} coins) will be removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/funcoin/packs/${pack.id}`);
      toast.success('Coin pack deleted');
      load();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to delete pack');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">New coin pack</h3>
          <PackForm initial={EMPTY} submitting={submitting} onSubmit={create} mode="create" />
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-neutral-900 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2.5 font-medium">Name</th>
                <th className="px-3 py-2.5 font-medium">Coins</th>
                <th className="px-3 py-2.5 font-medium">Price (USD)</th>
                <th className="px-3 py-2.5 font-medium">Price (INR)</th>
                <th className="px-3 py-2.5 font-medium">Order</th>
                <th className="px-3 py-2.5 font-medium">Flags</th>
                <th className="px-3 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {loading && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500 text-sm">No coin packs yet.</td></tr>
              )}
              {!loading && rows.map((row) => (
                editingId === row.id ? (
                  <tr key={row.id} className="bg-indigo-50/40 dark:bg-indigo-950/20">
                    <td colSpan={7} className="px-3 py-3">
                      <PackForm
                        initial={{ name: row.name, coins: row.coins, priceUsd: row.priceUsd, priceInr: row.priceInr, isPopular: row.isPopular, isActive: row.isActive, sortOrder: row.sortOrder }}
                        submitting={submitting}
                        mode="edit"
                        onSubmit={(payload) => update(row.id, payload)}
                        onCancel={() => setEditingId(null)}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-neutral-900/60">
                    <td className="px-3 py-2.5 text-slate-900 dark:text-white font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        {row.isPopular && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
                        {row.name}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{row.coins}</td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">${row.priceUsd}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">₹{row.priceInr}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{row.sortOrder}</td>
                    <td className="px-3 py-2.5">
                      {row.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">Active</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-slate-400">Inactive</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => setEditingId(row.id)} className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button type="button" onClick={() => remove(row)} className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

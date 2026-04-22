import { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Loader2,
  Plus,
  Save,
  X,
  Edit2,
  Tag,
  Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import FieldError from '@/components/shared/FieldError';
import { couponCreateSchema, couponUpdateSchema } from '@/lib/validation/schemas';
import { formatInr, formatShortDate } from '@/lib/format';

const PAGE_SIZE = 20;

// Helper: convert a coupon row's `applicableCourseIds` (array of MongoDB
// string ids) to/from a user-facing comma-separated input so we don't have
// to build a full multi-select. If the list is empty, the coupon applies
// to every course.
function idsToText(ids) {
  return Array.isArray(ids) ? ids.join(', ') : '';
}

function textToIds(text) {
  return String(text || '')
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeDate(s) {
  // The form uses native `<input type="date">` which gives YYYY-MM-DD.
  // Backend accepts optional `date`.
  return s && s.length === 10 ? s : undefined;
}

function DiscountSummary({ row }) {
  const { discountType, discountValue, maxDiscountInr } = row;
  if (discountType === 'percent') {
    return (
      <span>
        {discountValue}%{' '}
        {maxDiscountInr != null && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            (up to {formatInr(maxDiscountInr)})
          </span>
        )}
      </span>
    );
  }
  return <span>{formatInr(discountValue)}</span>;
}

function CreateForm({ onCreated }) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(couponCreateSchema),
    mode: 'onChange',
    defaultValues: {
      code: '',
      title: '',
      description: '',
      discountType: 'percent',
      discountValue: '',
      maxDiscountInr: '',
      minOrderAmountInr: 0,
      perUserLimit: 1,
      usageLimit: '',
      applicableCourseIdsText: '',
      validFrom: '',
      validUntil: '',
      isActive: true,
    },
  });

  const discountType = watch('discountType');

  const onSubmit = async (values) => {
    try {
      const payload = {
        code: values.code.trim(),
        discountType: values.discountType,
        discountValue: Number(values.discountValue),
        minOrderAmountInr: Number(values.minOrderAmountInr) || 0,
        perUserLimit: Number(values.perUserLimit) || 1,
        isActive: values.isActive,
        applicableCourseIds: textToIds(values.applicableCourseIdsText),
      };
      if (values.title?.trim()) payload.title = values.title.trim();
      if (values.description?.trim()) payload.description = values.description.trim();
      if (values.maxDiscountInr !== '' && values.maxDiscountInr != null) {
        payload.maxDiscountInr = Number(values.maxDiscountInr);
      }
      if (values.usageLimit !== '' && values.usageLimit != null) {
        payload.usageLimit = Number(values.usageLimit);
      }
      const vf = normalizeDate(values.validFrom);
      const vu = normalizeDate(values.validUntil);
      if (vf) payload.validFrom = vf;
      if (vu) payload.validUntil = vu;

      const res = await api.post('/course-coupons', payload);
      toast.success('Coupon created');
      reset();
      onCreated(res);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to create coupon');
    }
  };

  return (
    <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          New coupon
        </h3>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-6 gap-3"
        >
          <div className="md:col-span-2">
            <input
              {...register('code')}
              placeholder="CODE (e.g. WELCOME10)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-mono uppercase"
            />
            <FieldError error={errors.code} />
          </div>
          <div className="md:col-span-2">
            <input
              {...register('title')}
              placeholder="Title (optional)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
            <FieldError error={errors.title} />
          </div>
          <div>
            <select
              {...register('discountType')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            >
              <option value="percent">Percent</option>
              <option value="flat">Flat INR</option>
            </select>
          </div>
          <div>
            <input
              type="number"
              step="0.01"
              {...register('discountValue', { valueAsNumber: true })}
              placeholder={discountType === 'percent' ? 'e.g. 10' : 'INR'}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
            <FieldError error={errors.discountValue} />
          </div>

          <div className="md:col-span-2">
            <input
              type="number"
              step="0.01"
              {...register('maxDiscountInr')}
              placeholder="Max discount INR (percent only)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
              disabled={discountType !== 'percent'}
            />
            <FieldError error={errors.maxDiscountInr} />
          </div>
          <div>
            <input
              type="number"
              step="0.01"
              {...register('minOrderAmountInr', { valueAsNumber: true })}
              placeholder="Min order INR"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div>
            <input
              type="number"
              {...register('perUserLimit', { valueAsNumber: true })}
              placeholder="Per-user limit"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div>
            <input
              type="number"
              {...register('usageLimit')}
              placeholder="Total limit (blank = ∞)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div>
            <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 h-full pt-2">
              <input type="checkbox" {...register('isActive')} />
              Active
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Valid from
            </label>
            <input
              type="date"
              {...register('validFrom')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Valid until
            </label>
            <input
              type="date"
              {...register('validUntil')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div className="md:col-span-2 flex items-end">
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
              Create coupon
            </button>
          </div>

          <div className="md:col-span-6">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Applicable course IDs (blank = all courses, or comma-separated)
            </label>
            <input
              {...register('applicableCourseIdsText')}
              placeholder="64fab1... , 64fab2..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-mono"
            />
          </div>

          <div className="md:col-span-6">
            <input
              {...register('description')}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function EditDialog({ coupon, onSaved, onCancel }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(couponUpdateSchema),
    mode: 'onChange',
    defaultValues: {
      title: coupon.title || '',
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountInr: coupon.maxDiscountInr ?? '',
      minOrderAmountInr: coupon.minOrderAmountInr ?? 0,
      perUserLimit: coupon.perUserLimit ?? 1,
      usageLimit: coupon.usageLimit ?? '',
      applicableCourseIdsText: idsToText(coupon.applicableCourseIds),
      validFrom: (coupon.validFrom || '').slice(0, 10),
      validUntil: (coupon.validUntil || '').slice(0, 10),
      isActive: coupon.isActive,
    },
  });

  const discountType = watch('discountType');

  const onSubmit = async (values) => {
    try {
      // PATCH: only send fields that actually changed.
      const diff = {};
      if ((values.title || '') !== (coupon.title || '')) diff.title = values.title || '';
      if ((values.description || '') !== (coupon.description || '')) diff.description = values.description || '';
      if (values.discountType !== coupon.discountType) diff.discountType = values.discountType;
      if (Number(values.discountValue) !== coupon.discountValue) diff.discountValue = Number(values.discountValue);
      const prevMax = coupon.maxDiscountInr ?? null;
      const nextMax = values.maxDiscountInr === '' || values.maxDiscountInr == null ? null : Number(values.maxDiscountInr);
      if (prevMax !== nextMax) diff.maxDiscountInr = nextMax;
      if (Number(values.minOrderAmountInr) !== (coupon.minOrderAmountInr ?? 0)) {
        diff.minOrderAmountInr = Number(values.minOrderAmountInr);
      }
      if (Number(values.perUserLimit) !== (coupon.perUserLimit ?? 1)) {
        diff.perUserLimit = Number(values.perUserLimit);
      }
      const prevUsage = coupon.usageLimit ?? null;
      const nextUsage = values.usageLimit === '' || values.usageLimit == null ? null : Number(values.usageLimit);
      if (prevUsage !== nextUsage) diff.usageLimit = nextUsage;
      const prevIds = idsToText(coupon.applicableCourseIds);
      const nextIds = textToIds(values.applicableCourseIdsText);
      if (prevIds !== nextIds.join(', ')) diff.applicableCourseIds = nextIds;
      const prevVf = (coupon.validFrom || '').slice(0, 10);
      const prevVu = (coupon.validUntil || '').slice(0, 10);
      if (values.validFrom !== prevVf) diff.validFrom = normalizeDate(values.validFrom);
      if (values.validUntil !== prevVu) diff.validUntil = normalizeDate(values.validUntil);
      if (values.isActive !== coupon.isActive) diff.isActive = values.isActive;

      if (Object.keys(diff).length === 0) {
        toast.info('No changes to save');
        return;
      }

      const res = await api.patch(`/course-coupons/${coupon.code}`, diff);
      toast.success('Coupon updated');
      onSaved(res);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update coupon');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-slate-100 dark:border-neutral-800 px-5 py-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              Edit coupon
            </div>
            <div className="text-xs text-slate-500 font-mono">{coupon.code}</div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Title</label>
            <input
              {...register('title')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Discount type</label>
            <select
              {...register('discountType')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            >
              <option value="percent">Percent</option>
              <option value="flat">Flat INR</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Discount value</label>
            <input
              type="number"
              step="0.01"
              {...register('discountValue', { valueAsNumber: true })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
            <FieldError error={errors.discountValue} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Max discount (INR)</label>
            <input
              type="number"
              step="0.01"
              {...register('maxDiscountInr')}
              disabled={discountType !== 'percent'}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Min order (INR)</label>
            <input
              type="number"
              step="0.01"
              {...register('minOrderAmountInr', { valueAsNumber: true })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Per-user limit</label>
            <input
              type="number"
              {...register('perUserLimit', { valueAsNumber: true })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Total limit (blank = ∞)</label>
            <input
              type="number"
              {...register('usageLimit')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Valid from</label>
            <input
              type="date"
              {...register('validFrom')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Valid until</label>
            <input
              type="date"
              {...register('validUntil')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Applicable course IDs (blank = all)
            </label>
            <input
              {...register('applicableCourseIdsText')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-mono"
            />
          </div>
          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" {...register('isActive')} />
              Active
            </label>
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CouponManagement() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async (nextSkip = 0) => {
    try {
      setLoading(true);
      const res = await api.get('/course-coupons', {
        params: { skip: nextSkip, limit: PAGE_SIZE },
      });
      setRows(res.coupons || []);
      setTotal(res.total || 0);
      setSkip(nextSkip);
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        (c.title || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  const handleCreated = (newRow) => {
    setRows((prev) => [newRow, ...prev]);
    setTotal((t) => t + 1);
  };
  const handleSaved = (updated) => {
    setRows((prev) => prev.map((r) => (r.code === updated.code ? updated : r)));
    setEditing(null);
  };

  const toggleActive = async (row) => {
    try {
      const res = await api.patch(`/course-coupons/${row.code}`, {
        isActive: !row.isActive,
      });
      setRows((prev) => prev.map((r) => (r.code === res.code ? res : r)));
      toast.success(res.isActive ? 'Coupon activated' : 'Coupon deactivated');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to toggle status');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white">
          Course coupons
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Discount codes students can apply at checkout. Percent coupons use
          an optional max discount cap, flat coupons take a fixed INR value.
        </p>
      </div>

      <CreateForm onCreated={handleCreated} />

      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Existing coupons <span className="text-xs text-slate-500">({total})</span>
            </h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code or title"
                className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto -mx-4">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-neutral-900 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Code</th>
                  <th className="px-4 py-2.5 font-medium">Title</th>
                  <th className="px-4 py-2.5 font-medium">Discount</th>
                  <th className="px-4 py-2.5 font-medium">Used</th>
                  <th className="px-4 py-2.5 font-medium">Valid</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Actions</th>
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
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">
                      <Tag className="w-5 h-5 inline mr-1 opacity-50" />
                      No coupons {search ? 'match your search' : 'yet'}.
                    </td>
                  </tr>
                )}
                {!loading &&
                  filtered.map((row) => (
                    <tr key={row.code} className="hover:bg-slate-50 dark:hover:bg-neutral-900/60">
                      <td className="px-4 py-2.5 font-mono text-xs">{row.code}</td>
                      <td className="px-4 py-2.5 text-slate-900 dark:text-white">
                        {row.title || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-900 dark:text-white">
                        <DiscountSummary row={row} />
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                        {row.usedCount ?? 0}
                        {row.usageLimit != null && <> / {row.usageLimit}</>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div>{formatShortDate(row.validFrom)}</div>
                        <div>→ {formatShortDate(row.validUntil)}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        {row.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-slate-400">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditing(row)}
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const confirm = await Swal.fire({
                                title: row.isActive ? 'Deactivate coupon?' : 'Activate coupon?',
                                text: row.isActive
                                  ? 'Students will no longer be able to use this code.'
                                  : 'Students will be able to use this code again.',
                                icon: 'question',
                                showCancelButton: true,
                                confirmButtonColor: '#6366f1',
                                cancelButtonColor: '#64748b',
                                confirmButtonText: 'Yes, continue',
                              });
                              if (confirm.isConfirmed) toggleActive(row);
                            }}
                            className="text-xs text-slate-500 dark:text-slate-400 hover:underline"
                          >
                            {row.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
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

      {editing && (
        <EditDialog coupon={editing} onSaved={handleSaved} onCancel={() => setEditing(null)} />
      )}
    </div>
  );
}

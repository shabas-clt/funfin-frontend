import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { api } from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { signalCreateSchema } from '@/lib/validation/schemas';
import { applyServerErrors } from '@/lib/validation/serverErrors';
import { formatShortDateTime } from '@/lib/format';

const PAGE_SIZE = 12;
const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
  { value: 'canceled', label: 'Canceled' },
];
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
  { value: 'instrument', label: 'Instrument' },
  { value: 'headline', label: 'Headline' },
  { value: 'status', label: 'Status' },
];

const INITIAL_FORM = {
  headline: '',
  instrument: '',
  exchange: '',
  segment: '',
  direction: 'buy',
  entryPrice: '',
  stopLoss: '',
  targetPrices: '',
  timeframe: '',
  riskLevel: '',
  confidence: 3,
  rationale: '',
  validUntil: '',
};

function FieldError({ error }) {
  if (!error?.message) return null;
  return <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{error.message}</p>;
}

function toDateTimeLocal(isoValue) {
  if (!isoValue) return '';
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function statusBadgeClass(status) {
  if (status === 'active') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
  if (status === 'closed') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
  return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400';
}

function directionBadgeClass(direction) {
  return direction === 'buy'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400';
}

export default function MentorSignals() {
  const { admin } = useAuth();
  const role = admin?.role;
  const isSuperadmin = role === 'superadmin';

  const [signals, setSignals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [mentorFilter, setMentorFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [mentorOptions, setMentorOptions] = useState([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSignal, setEditingSignal] = useState(null);
  const [selectedMentorId, setSelectedMentorId] = useState('');

  const form = useForm({
    resolver: yupResolver(signalCreateSchema),
    mode: 'onBlur',
    defaultValues: INITIAL_FORM,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const currentPage = useMemo(() => Math.floor(skip / PAGE_SIZE) + 1, [skip]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const loadMentorOptions = async () => {
    if (!isSuperadmin) return;
    try {
      const res = await api.get('/admins', {
        params: {
          limit: 200,
          skip: 0,
          sortBy: 'name',
          sortOrder: 'asc',
        },
      });
      setMentorOptions(res.admins || []);
    } catch {
      setMentorOptions([]);
      toast.error('Failed to load mentors');
    }
  };

  const loadSignals = async (nextSkip = 0) => {
    try {
      setIsLoading(true);
      const params = {
        skip: nextSkip,
        limit: PAGE_SIZE,
        sortBy,
        sortOrder,
      };

      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (statusFilter) params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (isSuperadmin && mentorFilter) params.mentorId = mentorFilter;

      const res = await api.get('/mentor/signals', { params });
      setSignals(res.signals || []);
      setTotal(res.total || 0);
      setSkip(nextSkip);
    } catch (err) {
      setSignals([]);
      setTotal(0);
      toast.error(typeof err === 'string' ? err : 'Failed to load signals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSignals(0);
  }, [statusFilter, mentorFilter, startDate, endDate, sortBy, sortOrder]);

  useEffect(() => {
    loadMentorOptions();
  }, [isSuperadmin]);

  const onSearch = (event) => {
    event.preventDefault();
    loadSignals(0);
  };

  const openCreateModal = () => {
    setEditingSignal(null);
    reset(INITIAL_FORM);
    setSelectedMentorId('');
    setIsFormOpen(true);
  };

  const openEditModal = (signal) => {
    setEditingSignal(signal);
    setSelectedMentorId(signal.mentorUserId || admin?.id || '');
    reset({
      headline: signal.headline || '',
      instrument: signal.instrument || '',
      exchange: signal.exchange || '',
      segment: signal.segment || '',
      direction: signal.direction || 'buy',
      entryPrice: signal.entryPrice || '',
      stopLoss: signal.stopLoss || '',
      targetPrices: Array.isArray(signal.targetPrices) ? signal.targetPrices.join(', ') : '',
      timeframe: signal.timeframe || '',
      riskLevel: signal.riskLevel || '',
      confidence: signal.confidence || 3,
      rationale: signal.rationale || '',
      validUntil: toDateTimeLocal(signal.validUntil),
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (signal) => {
    const confirm = await Swal.fire({
      title: `Delete signal "${signal.headline}"?`,
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Delete',
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.delete(`/mentor/signals/${signal.id}`);
      toast.success('Signal deleted successfully');
      const targetSkip = signals.length === 1 && skip > 0 ? Math.max(0, skip - PAGE_SIZE) : skip;
      loadSignals(targetSkip);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to delete signal');
    }
  };

  const onSubmit = async (values) => {
    const payload = {
      headline: values.headline,
      instrument: values.instrument,
      exchange: values.exchange || undefined,
      segment: values.segment || undefined,
      direction: values.direction,
      entryPrice: values.entryPrice,
      stopLoss: values.stopLoss,
      targetPrices: values.targetPrices
        ? values.targetPrices.split(',').map(p => parseFloat(p.trim())).filter(Boolean)
        : [],
      timeframe: values.timeframe || undefined,
      riskLevel: values.riskLevel || undefined,
      confidence: values.confidence,
      rationale: values.rationale || undefined,
      validUntil: values.validUntil ? new Date(values.validUntil).toISOString() : undefined,
    };

    const params = {};
    if (isSuperadmin && selectedMentorId) {
      params.mentorId = selectedMentorId;
    }

    try {
      if (editingSignal) {
        await api.put(`/mentor/signals/${editingSignal.id}`, payload, { params });
        toast.success('Signal updated successfully');
      } else {
        await api.post('/mentor/signals', payload, { params });
        toast.success('Signal created successfully');
      }
      setIsFormOpen(false);
      setEditingSignal(null);
      reset(INITIAL_FORM);
      loadSignals(skip);
    } catch (err) {
      const fallback = applyServerErrors(form, err, editingSignal ? 'Failed to update signal' : 'Failed to create signal');
      if (fallback) toast.error(fallback);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Signal Management</h1>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">
            Create, edit, delete, and track signals with full logs, filters, and sorting
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-[#6366f1] hover:bg-indigo-600 text-white shadow-sm flex items-center gap-2 px-4 h-10 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Add Signal
        </Button>
      </div>

      <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl overflow-hidden pb-4">
        <CardContent className="p-0">
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
            <form onSubmit={onSearch} className="relative xl:col-span-2">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search headline/instrument..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-[#f8fafc] dark:bg-neutral-900 border border-transparent dark:border-neutral-800 focus:border-slate-200 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-neutral-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-100 dark:focus:ring-neutral-800 transition-all placeholder:text-slate-400 dark:text-slate-300"
              />
            </form>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-[13px]"
            >
              {STATUS_OPTIONS.map((item) => (
                <option key={item.label} value={item.value}>{item.label}</option>
              ))}
            </select>

            {isSuperadmin ? (
              <select
                value={mentorFilter}
                onChange={(e) => setMentorFilter(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-[13px]"
              >
                <option value="">All Owners</option>
                {mentorOptions.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>{mentor.fullName}</option>
                ))}
              </select>
            ) : (
              <div className="hidden xl:block" />
            )}

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-[13px]"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-[13px]"
            />

            <div className="grid grid-cols-2 gap-3 md:col-span-2 xl:col-span-6">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-[13px]"
              >
                {SORT_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-[13px]"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          <div className="md:hidden px-3 pb-3 space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 bg-slate-100 dark:bg-neutral-900 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : signals.length === 0 ? (
              <p className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">No signals found</p>
            ) : signals.map((signal) => (
              <div key={signal.id} className="rounded-xl border border-slate-100 dark:border-neutral-800 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{signal.headline}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{signal.instrument} · {signal.mentorName || '-'}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${statusBadgeClass(signal.status)}`}>
                    {signal.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${directionBadgeClass(signal.direction)}`}>
                    {signal.direction?.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500">Entry {signal.entryPrice} · SL {signal.stopLoss}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Created: {formatShortDateTime(signal.createdAt)}</p>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button onClick={() => openEditModal(signal)} className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center" aria-label="Edit">
                    <Edit className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  </button>
                  <button onClick={() => handleDelete(signal)} className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/40 flex items-center justify-center" aria-label="Delete">
                    <Trash2 className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto px-2">
            <table className="w-full text-[13px] text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 dark:border-neutral-800">
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Signal</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Mentor</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Direction</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Created</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Valid Until</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-neutral-800/70 text-slate-600 dark:text-slate-300 font-medium">
                {isLoading ? (
                  <TableSkeleton rows={6} cols={7} />
                ) : signals.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-10 text-center text-slate-400 dark:text-slate-500">No signals match your filter</td>
                  </tr>
                ) : signals.map((signal) => (
                  <tr key={signal.id} className="hover:bg-slate-50/80 dark:hover:bg-neutral-900/70 group transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{signal.headline}</p>
                        <p className="text-[11px] text-slate-400 font-normal">{signal.instrument} · Entry {signal.entryPrice} · SL {signal.stopLoss}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">{signal.mentorName || '-'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${directionBadgeClass(signal.direction)}`}>
                        {signal.direction?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusBadgeClass(signal.status)}`}>
                        {signal.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">{formatShortDateTime(signal.createdAt)}</td>
                    <td className="px-5 py-3.5">{signal.validUntil ? formatShortDateTime(signal.validUntil) : '-'}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(signal)} className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center justify-center" aria-label="Edit">
                          <Edit className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                        </button>
                        <button onClick={() => handleDelete(signal)} className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center justify-center" aria-label="Delete">
                          <Trash2 className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isLoading && total > PAGE_SIZE && (
            <div className="px-5 pt-2 flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing {skip + 1}-{Math.min(skip + PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={skip <= 0}
                  onClick={() => loadSignals(Math.max(0, skip - PAGE_SIZE))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-neutral-700 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400">{currentPage} / {totalPages}</span>
                <button
                  type="button"
                  disabled={skip + PAGE_SIZE >= total}
                  onClick={() => loadSignals(skip + PAGE_SIZE)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-neutral-700 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          if (isSubmitting) return;
          setIsFormOpen(false);
          setEditingSignal(null);
          reset(INITIAL_FORM);
        }}
        title={editingSignal ? 'Edit Signal' : 'Create Signal'}
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isSuperadmin && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Signal Owner</label>
              <select
                value={selectedMentorId}
                onChange={(e) => setSelectedMentorId(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border px-3 bg-transparent text-sm dark:bg-neutral-900 dark:border-neutral-800"
              >
                <option value="">Post as Myself (Default)</option>
                {mentorOptions.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>{mentor.fullName}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Headline</label>
            <Input {...register('headline')} className="mt-1" />
            <FieldError error={errors.headline} />
          </div>

          <div>
            <label className="text-sm font-medium">Instrument</label>
            <Input {...register('instrument')} className="mt-1" />
            <FieldError error={errors.instrument} />
          </div>

          <div>
            <label className="text-sm font-medium">Direction</label>
            <select
              {...register('direction')}
              className="mt-1 h-9 w-full rounded-md border px-3 bg-transparent dark:bg-neutral-900 dark:border-neutral-800"
            >
              <option value="buy">BUY</option>
              <option value="sell">SELL</option>
            </select>
            <FieldError error={errors.direction} />
          </div>

          <div>
            <label className="text-sm font-medium">Timeframe</label>
            <select
              {...register('timeframe')}
              className="mt-1 h-9 w-full rounded-md border px-3 bg-transparent dark:bg-neutral-900 dark:border-neutral-800"
            >
              <option value="">Select Timeframe</option>
              <option value="Intraday">Intraday</option>
              <option value="Swing">Swing</option>
              <option value="Short Term">Short Term</option>
              <option value="Long Term">Long Term</option>
            </select>
            <FieldError error={errors.timeframe} />
          </div>

          <div>
            <label className="text-sm font-medium">Entry Price</label>
            <Input type="number" step="0.01" {...register('entryPrice')} className="mt-1" />
            <FieldError error={errors.entryPrice} />
          </div>

          <div>
            <label className="text-sm font-medium">Stop Loss</label>
            <Input type="number" step="0.01" {...register('stopLoss')} className="mt-1" />
            <FieldError error={errors.stopLoss} />
          </div>

          <div>
            <label className="text-sm font-medium">Targets (comma separated)</label>
            <Input {...register('targetPrices')} className="mt-1" placeholder="350.5, 355, 362" />
            <FieldError error={errors.targetPrices} />
          </div>

          <div>
            <label className="text-sm font-medium flex justify-between">
              <span>Confidence</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{watch('confidence')} / 5</span>
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              {...register('confidence')}
              className="mt-3 w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-800 accent-indigo-600"
            />
            <FieldError error={errors.confidence} />
          </div>

          <div>
            <label className="text-sm font-medium">Exchange</label>
            <select
              {...register('exchange')}
              className="mt-1 h-9 w-full rounded-md border px-3 bg-transparent text-sm dark:bg-neutral-900 dark:border-neutral-800"
            >
              <option value="">Select Exchange</option>
              <option value="NSE">NSE</option>
              <option value="BSE">BSE</option>
              <option value="MCX">MCX</option>
              <option value="FOREX">FOREX</option>
              <option value="CRYPTO">CRYPTO</option>
            </select>
            <FieldError error={errors.exchange} />
          </div>

          <div>
            <label className="text-sm font-medium">Segment</label>
            <select
              {...register('segment')}
              className="mt-1 h-9 w-full rounded-md border px-3 bg-transparent text-sm dark:bg-neutral-900 dark:border-neutral-800"
            >
              <option value="">Select Segment</option>
              <option value="EQ">Equity (EQ)</option>
              <option value="FNO">Futures & Options (FNO)</option>
              <option value="COMMODITY">Commodity</option>
              <option value="CURRENCY">Currency</option>
            </select>
            <FieldError error={errors.segment} />
          </div>

          <div>
            <label className="text-sm font-medium">Risk Level</label>
            <select
              {...register('riskLevel')}
              className="mt-1 h-9 w-full rounded-md border px-3 bg-transparent text-sm dark:bg-neutral-900 dark:border-neutral-800"
            >
              <option value="">Select Risk</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <FieldError error={errors.riskLevel} />
          </div>

          <div>
            <label className="text-sm font-medium">Valid Until</label>
            <Input type="datetime-local" {...register('validUntil')} className="mt-1" />
            <FieldError error={errors.validUntil} />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Rationale</label>
            <textarea
              {...register('rationale')}
              rows="3"
              className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-800"
              placeholder="Technical or fundamental reasoning..."
            />
            <FieldError error={errors.rationale} />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                setIsFormOpen(false);
                setEditingSignal(null);
                reset(INITIAL_FORM);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isSubmitting ? 'Saving...' : editingSignal ? 'Update Signal' : 'Create Signal'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const initialForm = {
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
  confidence: '3',
  rationale: '',
  validUntil: '',
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function MentorSignals() {
  const [form, setForm] = useState(initialForm);
  const [signals, setSignals] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [signalsRes, subscribersRes] = await Promise.all([
        api.get('/mentor/signals'),
        api.get('/mentor/subscribers', { params: { limit: 100 } }),
      ]);
      setSignals(signalsRes.signals || []);
      setSubscribers(subscribersRes.students || []);
    } catch {
      toast.error('Failed to load mentor signals');
      setSignals([]);
      setSubscribers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      headline: form.headline.trim(),
      instrument: form.instrument.trim(),
      exchange: form.exchange.trim() || undefined,
      segment: form.segment.trim() || undefined,
      direction: form.direction,
      entryPrice: Number(form.entryPrice),
      stopLoss: Number(form.stopLoss),
      targetPrices: form.targetPrices
        .split(',')
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isFinite(v) && v > 0),
      timeframe: form.timeframe.trim() || undefined,
      riskLevel: form.riskLevel.trim() || undefined,
      confidence: Number(form.confidence),
      rationale: form.rationale.trim() || undefined,
      validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
    };

    if (payload.targetPrices.length === 0) {
      toast.error('Please add at least one valid target price');
      return;
    }

    const confirm = await Swal.fire({
      title: 'Publish this signal?',
      text: 'Subscribed students can view this signal instantly.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      confirmButtonText: 'Publish',
      cancelButtonText: 'Cancel',
    });
    if (!confirm.isConfirmed) return;

    try {
      setIsSubmitting(true);
      await api.post('/mentor/signals', payload);
      toast.success('Signal posted successfully');
      setForm(initialForm);
      loadData();
    } catch (error) {
      toast.error(error?.detail || 'Failed to post signal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Mentor Signals</h1>
        <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">Post trading signals and monitor subscribed students</p>
      </div>

      <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
        <CardContent className="p-5">
          <h2 className="text-[16px] font-bold text-slate-900 dark:text-white mb-4">Post New Signal</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Headline</label>
              <Input name="headline" value={form.headline} onChange={handleChange} required className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Instrument</label>
              <Input name="instrument" value={form.instrument} onChange={handleChange} required className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Direction</label>
              <select name="direction" value={form.direction} onChange={handleChange} className="mt-1 h-9 w-full rounded-md border px-3 bg-transparent dark:bg-neutral-900 dark:border-neutral-800">
                <option value="buy">BUY</option>
                <option value="sell">SELL</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Timeframe</label>
              <Input name="timeframe" value={form.timeframe} onChange={handleChange} className="mt-1" placeholder="Intraday / Swing" />
            </div>
            <div>
              <label className="text-sm font-medium">Entry Price</label>
              <Input type="number" step="0.01" name="entryPrice" value={form.entryPrice} onChange={handleChange} required className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Stop Loss</label>
              <Input type="number" step="0.01" name="stopLoss" value={form.stopLoss} onChange={handleChange} required className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Targets (comma separated)</label>
              <Input name="targetPrices" value={form.targetPrices} onChange={handleChange} required className="mt-1" placeholder="350.5, 355, 362" />
            </div>
            <div>
              <label className="text-sm font-medium">Confidence (1-5)</label>
              <Input type="number" min="1" max="5" name="confidence" value={form.confidence} onChange={handleChange} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Exchange</label>
              <Input name="exchange" value={form.exchange} onChange={handleChange} className="mt-1" placeholder="NSE" />
            </div>
            <div>
              <label className="text-sm font-medium">Segment</label>
              <Input name="segment" value={form.segment} onChange={handleChange} className="mt-1" placeholder="EQ / FNO" />
            </div>
            <div>
              <label className="text-sm font-medium">Risk Level</label>
              <Input name="riskLevel" value={form.riskLevel} onChange={handleChange} className="mt-1" placeholder="Low / Medium / High" />
            </div>
            <div>
              <label className="text-sm font-medium">Valid Until</label>
              <Input type="datetime-local" name="validUntil" value={form.validUntil} onChange={handleChange} className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Rationale</label>
              <textarea
                name="rationale"
                value={form.rationale}
                onChange={handleChange}
                rows="3"
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-800"
                placeholder="Technical or fundamental reasoning..."
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSubmitting ? 'Publishing...' : 'Publish Signal'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="xl:col-span-3 border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
          <CardContent className="p-5">
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white mb-4">Posted Signals</h2>
            {isLoading ? (
              <p className="text-sm text-slate-400">Loading signals...</p>
            ) : signals.length === 0 ? (
              <p className="text-sm text-slate-400">No signals posted yet.</p>
            ) : (
              <div className="space-y-3">
                {signals.map((signal) => (
                  <div key={signal.id} className="rounded-xl border border-slate-100 dark:border-neutral-800 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{signal.headline}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-neutral-800">{signal.status}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {signal.instrument} ({signal.direction?.toUpperCase()}) | Entry: {signal.entryPrice} | SL: {signal.stopLoss}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Targets: {(signal.targetPrices || []).join(', ')}</p>
                    <p className="text-xs text-slate-500 mt-1">Created: {formatDateTime(signal.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
          <CardContent className="p-5">
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white mb-4">Subscribed Students</h2>
            {isLoading ? (
              <p className="text-sm text-slate-400">Loading students...</p>
            ) : subscribers.length === 0 ? (
              <p className="text-sm text-slate-400">No active student subscriptions found.</p>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {subscribers.map((student) => (
                  <div key={student.userId} className="p-2.5 rounded-lg bg-slate-50 dark:bg-neutral-900">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{student.fullName}</p>
                    <p className="text-xs text-slate-500">{student.email}</p>
                    <p className="text-xs text-slate-500 mt-1">Ends: {formatDateTime(student.endsAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

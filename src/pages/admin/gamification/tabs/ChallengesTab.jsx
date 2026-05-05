import { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, Save, Edit2, Calendar, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { formatShortDate } from '@/lib/format';
import ChallengeTypeSelector from '../../../../components/admin/gamification/ChallengeTypeSelector';
import ConditionalChallengeFields from '../../../../components/admin/gamification/ConditionalChallengeFields';
import { 
  weeklyChallengeSchema, 
  specialChallengeSchema, 
  dailyChallengeSchema 
} from '../../../../lib/validators/challengeValidators';

const PAGE_SIZE = 20;

// Add week number calculation to Date prototype if not exists
if (!Date.prototype.getWeek) {
  Date.prototype.getWeek = function() {
    const start = new Date(this.getFullYear(), 0, 1);
    const days = Math.floor((this - start) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
  };
}

// For a quiz-style daily challenge the editor is best rendered as a
// controlled component; react-hook-form gets awkward with dynamic-length
// option rows and a correct-option radio group.

function ChallengeEditor({ initial, busy, onSave, onCancel }) {
  const [challengeType, setChallengeType] = useState(initial.challengeType || 'daily');
  const [question, setQuestion] = useState(initial.question || '');
  const [options, setOptions] = useState(initial.options || ['', '']);
  const [correctIndex, setCorrectIndex] = useState(initial.correctOptionIndex ?? 0);
  const [explanation, setExplanation] = useState(initial.explanation || '');
  const [rewardCoins, setRewardCoins] = useState(initial.rewardCoins ?? 0);
  const [isActive, setIsActive] = useState(initial.isActive ?? true);
  const [typeSpecificFields, setTypeSpecificFields] = useState({
    challengeDate: initial.challengeDate || '',
    weekNumber: initial.weekNumber || new Date().getWeek(),
    weekYear: initial.weekYear || new Date().getFullYear(),
    startDate: initial.startDate || '',
    endDate: initial.endDate || ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  const validateTypeSpecificFields = async () => {
    try {
      setValidationErrors({});
      
      if (challengeType === 'weekly') {
        await weeklyChallengeSchema.validate(typeSpecificFields, { abortEarly: false });
      } else if (challengeType === 'special') {
        await specialChallengeSchema.validate(typeSpecificFields, { abortEarly: false });
      } else if (challengeType === 'daily') {
        await dailyChallengeSchema.validate(typeSpecificFields, { abortEarly: false });
      }
      
      return true;
    } catch (error) {
      if (error.inner) {
        const errors = {};
        error.inner.forEach(err => {
          errors[err.path] = err.message;
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const addOption = () => setOptions((prev) => [...prev, '']);
  const removeOption = (idx) => {
    setOptions((prev) => prev.filter((_, i) => i !== idx));
    if (correctIndex >= options.length - 1) setCorrectIndex(0);
  };
  const setOption = (idx, value) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? value : o)));
  };

  const submit = async () => {
    if ((question || '').length < 5) return toast.error('Question must be at least 5 characters');
    const cleanOptions = options.map((o) => String(o || '').trim()).filter(Boolean);
    if (cleanOptions.length < 2) return toast.error('At least two non-empty options are required');
    if (correctIndex >= cleanOptions.length)
      return toast.error('Correct option must point to a valid option');

    // Validate type-specific fields
    const isValid = await validateTypeSpecificFields();
    if (!isValid) {
      toast.error('Please fix the validation errors');
      return;
    }

    const payload = {
      challengeType,
      question: question.trim(),
      options: cleanOptions,
      correctOptionIndex: Number(correctIndex),
      explanation: explanation.trim() || null,
      rewardCoins: Number(rewardCoins) || 0,
      isActive,
    };

    if (challengeType === 'daily') {
      if (typeSpecificFields.challengeDate) {
        payload.challengeDate = typeSpecificFields.challengeDate;
      }
    } else if (challengeType === 'weekly') {
      payload.weekNumber = Number(typeSpecificFields.weekNumber);
      payload.weekYear = Number(typeSpecificFields.weekYear);
    } else if (challengeType === 'special') {
      payload.startDate = typeSpecificFields.startDate;
      payload.endDate = typeSpecificFields.endDate;
    }

    onSave(payload);
  };

  return (
    <div className="space-y-4">
      <ChallengeTypeSelector
        value={challengeType}
        onChange={setChallengeType}
        disabled={busy}
      />

      <ConditionalChallengeFields
        challengeType={challengeType}
        values={typeSpecificFields}
        onChange={setTypeSpecificFields}
        errors={validationErrors}
        disabled={busy}
      />

      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Question</label>
        <textarea
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
          Options (select the correct one with the radio button)
        </label>
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct-option"
                checked={correctIndex === idx}
                onChange={() => setCorrectIndex(idx)}
                aria-label={`Mark option ${idx + 1} correct`}
              />
              <input
                value={opt}
                onChange={(e) => setOption(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
              />
              <button
                type="button"
                onClick={() => removeOption(idx)}
                disabled={options.length <= 2}
                className="text-xs text-rose-600 dark:text-rose-400 disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addOption}
          className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400"
        >
          <Plus className="w-3 h-3" /> Add option
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
          Explanation (optional)
        </label>
        <textarea
          rows={2}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Reward coins
          <input
            type="number"
            min={0}
            value={rewardCoins}
            onChange={(e) => setRewardCoins(Number(e.target.value) || 0)}
            className="ml-2 w-24 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
          />
        </label>
        <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-neutral-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>
    </div>
  );
}

export default function ChallengesTab() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [challengeTypeFilter, setChallengeTypeFilter] = useState('');

  const load = useCallback(async (nextSkip = 0) => {
    try {
      setLoading(true);
      const params = { skip: nextSkip, limit: PAGE_SIZE };
      if (challengeTypeFilter) {
        params.challengeType = challengeTypeFilter;
      }
      
      const res = await api.get('/admin/gamification/challenges', { params });
      setRows(res.items || []);
      setTotal(res.total || 0);
      setSkip(nextSkip);
    } catch {
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  }, [challengeTypeFilter]);

  useEffect(() => {
    load(0);
  }, [load]);

  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      const res = await api.post('/admin/gamification/challenges', payload);
      toast.success('Challenge created');
      setRows((prev) => [res, ...prev]);
      setTotal((t) => t + 1);
      setCreating(false);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to create challenge');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id, payload) => {
    setSaving(true);
    try {
      const res = await api.patch(`/admin/gamification/challenges/${id}`, payload);
      toast.success('Challenge updated');
      setRows((prev) => prev.map((r) => (r.id === res.id ? res : r)));
      setEditingId(null);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update challenge');
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (row) => {
    let inputHtml = '';
    let inputValue = '';
    
    if (row.challengeType === 'daily') {
      inputHtml = '<p class="text-sm mb-2">Assign challenge to a specific date:</p>';
      inputValue = (row.challengeDate || '').slice(0, 10);
    } else if (row.challengeType === 'weekly') {
      inputHtml = `<p class="text-sm mb-2">This is a weekly challenge for Week ${row.weekNumber}, ${row.weekYear}</p>`;
    } else if (row.challengeType === 'special') {
      inputHtml = `<p class="text-sm mb-2">This is a special challenge running from ${row.startDate} to ${row.endDate}</p>`;
    }

    if (row.challengeType === 'daily') {
      const { value: picked } = await Swal.fire({
        title: 'Assign challenge to a date',
        html: `${inputHtml}<p class="text-sm">${row.question}</p>`,
        input: 'date',
        inputValue,
        showCancelButton: true,
        confirmButtonColor: '#6366f1',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Assign',
      });
      if (!picked) return;
      
      try {
        await api.post(`/admin/gamification/challenges/${row.id}/assign-today`, {
          challengeDate: picked,
        });
        toast.success(`Assigned to ${picked}`);
        setRows((prev) =>
          prev.map((r) => (r.id === row.id ? { ...r, challengeDate: picked } : r)),
        );
      } catch (err) {
        toast.error(typeof err === 'string' ? err : 'Failed to assign date');
      }
    } else {
      Swal.fire({
        title: 'Challenge Info',
        html: `${inputHtml}<p class="text-sm mt-2">${row.question}</p>`,
        confirmButtonColor: '#6366f1',
        confirmButtonText: 'OK',
      });
    }
  };

  const getChallengeTypeDisplay = (row) => {
    if (row.challengeType === 'weekly') {
      return `Week ${row.weekNumber}, ${row.weekYear}`;
    } else if (row.challengeType === 'special') {
      return `${row.startDate} to ${row.endDate}`;
    } else {
      return row.challengeDate ? formatShortDate(row.challengeDate) : 'unassigned';
    }
  };

  const getChallengeTypeBadge = (type) => {
    const badges = {
      daily: 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
      weekly: 'bg-purple-50 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
      special: 'bg-orange-50 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400'
    };
    
    return badges[type] || badges.daily;
  };

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-4">
          {creating ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">New challenge</h3>
              </div>
              <ChallengeEditor
                initial={{
                  challengeType: 'daily',
                  question: '',
                  options: ['', ''],
                  correctOptionIndex: 0,
                  explanation: '',
                  rewardCoins: 0,
                  isActive: true,
                }}
                busy={saving}
                onSave={handleCreate}
                onCancel={() => setCreating(false)}
              />
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Challenges</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Create daily, weekly, and special challenges with different scheduling options.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                >
                  <Plus className="w-4 h-4" /> New challenge
                </button>
              </div>
              
              {/* Challenge Type Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={challengeTypeFilter}
                  onChange={(e) => setChallengeTypeFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                >
                  <option value="">All Types</option>
                  <option value="daily">Daily Challenges</option>
                  <option value="weekly">Weekly Challenges</option>
                  <option value="special">Special Challenges</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              No challenges yet.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-neutral-800">
              {rows.map((row) => (
                <li key={row.id} className="p-4">
                  {editingId === row.id ? (
                    <ChallengeEditor
                      initial={row}
                      busy={saving}
                      onSave={(payload) => handleUpdate(row.id, payload)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${getChallengeTypeBadge(row.challengeType)}`}>
                            {row.challengeType?.toUpperCase() || 'DAILY'}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {row.question}
                        </div>
                        <ol className="mt-1 text-xs text-slate-500 dark:text-slate-400 list-decimal list-inside space-y-0.5">
                          {row.options.map((opt, idx) => (
                            <li
                              key={idx}
                              className={
                                idx === row.correctOptionIndex
                                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                  : ''
                              }
                            >
                              {opt}
                            </li>
                          ))}
                        </ol>
                        {row.explanation && (
                          <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">
                            Explanation: {row.explanation}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>
                            Reward:{' '}
                            <span className="text-slate-900 dark:text-white font-semibold">
                              {row.rewardCoins} coins
                            </span>
                          </span>
                          <span>•</span>
                          <span>
                            Schedule:{' '}
                            <span className="text-slate-900 dark:text-white">
                              {getChallengeTypeDisplay(row)}
                            </span>
                          </span>
                          <span>•</span>
                          {row.isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-slate-400">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(row.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-200 text-xs"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAssign(row)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sky-50 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 text-xs"
                        >
                          <Calendar className="w-3 h-3" /> 
                          {row.challengeType === 'daily' ? 'Assign' : 'Info'}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
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

    </div>
  );
}

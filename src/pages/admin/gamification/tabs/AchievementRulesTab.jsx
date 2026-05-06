import { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, Save, Edit2, X, Trash2, Zap, Award, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';

const OPERATORS = [
  { value: '==', label: 'Equal to (==)' },
  { value: '!=', label: 'Not equal to (!=)' },
  { value: '>', label: 'Greater than (>)' },
  { value: '>=', label: 'Greater than or equal (>=)' },
  { value: '<', label: 'Less than (<)' },
  { value: '<=', label: 'Less than or equal (<=)' },
];

function CreateForm({ badges, titles, metrics, onCreated }) {
  const [achievementType, setAchievementType] = useState('badge');
  const [achievementId, setAchievementId] = useState('');
  const [metricName, setMetricName] = useState('');
  const [operator, setOperator] = useState('>=');
  const [targetValue, setTargetValue] = useState('');
  const [rewardCoins, setRewardCoins] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [autoAward, setAutoAward] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const achievements = achievementType === 'badge' ? badges : titles;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!achievementId) return toast.error('Please select a badge or title');
    if (!metricName) return toast.error('Please select a metric');
    if (!targetValue || isNaN(targetValue)) return toast.error('Please enter a valid target value');
    if (isNaN(rewardCoins)) return toast.error('Please enter a valid reward coins amount');

    setSubmitting(true);
    try {
      const payload = {
        achievementType,
        achievementId,
        metricName,
        operator,
        targetValue: parseFloat(targetValue),
        rewardCoins: parseInt(rewardCoins, 10),
        isActive,
        autoAward,
      };
      const res = await api.post('/admin/gamification/achievement-rules', payload);
      toast.success('Achievement rule created');
      setAchievementId('');
      setMetricName('');
      setTargetValue('');
      setRewardCoins('0');
      onCreated(res);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to create achievement rule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          New achievement rule
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Achievement Type */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Achievement type *
              </label>
              <select
                value={achievementType}
                onChange={(e) => {
                  setAchievementType(e.target.value);
                  setAchievementId('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
              >
                <option value="badge">Badge</option>
                <option value="title">Title</option>
              </select>
            </div>

            {/* Achievement Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                {achievementType === 'badge' ? 'Badge' : 'Title'} *
              </label>
              <select
                value={achievementId}
                onChange={(e) => setAchievementId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
              >
                <option value="">Select {achievementType}</option>
                {achievements.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Metric */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Metric *
              </label>
              <select
                value={metricName}
                onChange={(e) => setMetricName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
              >
                <option value="">Select metric</option>
                {metrics.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} - {m.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Operator */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Operator *
              </label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
              >
                {OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Value */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Target value *
              </label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="e.g., 7"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
              />
            </div>

            {/* Reward Coins */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Reward coins
              </label>
              <input
                type="number"
                value={rewardCoins}
                onChange={(e) => setRewardCoins(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Active
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={autoAward}
                  onChange={(e) => setAutoAward(e.target.checked)}
                />
                Auto-award
              </label>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create rule
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function EditCard({ rule, badges, titles, metrics, onSaved, onCancel }) {
  const [metricName, setMetricName] = useState(rule.metricName);
  const [operator, setOperator] = useState(rule.operator);
  const [targetValue, setTargetValue] = useState(rule.targetValue.toString());
  const [rewardCoins, setRewardCoins] = useState(rule.rewardCoins.toString());
  const [isActive, setIsActive] = useState(rule.isActive);
  const [autoAward, setAutoAward] = useState(rule.autoAward);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!targetValue || isNaN(targetValue)) return toast.error('Please enter a valid target value');
    if (isNaN(rewardCoins)) return toast.error('Please enter a valid reward coins amount');

    setSaving(true);
    try {
      const diff = {};
      if (metricName !== rule.metricName) diff.metricName = metricName;
      if (operator !== rule.operator) diff.operator = operator;
      if (parseFloat(targetValue) !== rule.targetValue) diff.targetValue = parseFloat(targetValue);
      if (parseInt(rewardCoins, 10) !== rule.rewardCoins) diff.rewardCoins = parseInt(rewardCoins, 10);
      if (isActive !== rule.isActive) diff.isActive = isActive;
      if (autoAward !== rule.autoAward) diff.autoAward = autoAward;

      if (Object.keys(diff).length === 0) {
        toast.info('No changes to save');
        setSaving(false);
        return;
      }

      const res = await api.patch(`/admin/gamification/achievement-rules/${rule.id}`, diff);
      onSaved(res);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update rule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 border rounded-xl border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {rule.achievementType === 'badge' ? (
            <Award className="w-4 h-4 text-amber-500" />
          ) : (
            <Crown className="w-4 h-4 text-purple-500" />
          )}
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {rule.achievementName}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Metric
          </label>
          <select
            value={metricName}
            onChange={(e) => setMetricName(e.target.value)}
            className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
          >
            {metrics.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Operator
          </label>
          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
          >
            {OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Target value
          </label>
          <input
            type="number"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Reward coins
          </label>
          <input
            type="number"
            value={rewardCoins}
            onChange={(e) => setRewardCoins(e.target.value)}
            className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>
        <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={autoAward} onChange={(e) => setAutoAward(e.target.checked)} />
          Auto-award
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 text-xs"
        >
          <X className="w-3 h-3" /> Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save
        </button>
      </div>
    </div>
  );
}

function RuleCard({ rule, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this achievement rule?')) return;
    
    setDeleting(true);
    try {
      await api.delete(`/admin/gamification/achievement-rules/${rule.id}`);
      toast.success('Achievement rule deleted');
      onDelete(rule.id);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to delete rule');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {rule.achievementType === 'badge' ? (
              <Award className="w-5 h-5 text-amber-500 flex-shrink-0" />
            ) : (
              <Crown className="w-5 h-5 text-purple-500 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {rule.achievementName}
              </div>
              <div className="text-[11px] text-slate-500">
                {rule.achievementType === 'badge' ? 'Badge' : 'Title'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {rule.isActive ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-slate-400">
                Inactive
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-neutral-900 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Condition:</span>
            <code className="px-2 py-0.5 rounded bg-white dark:bg-black border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white font-mono">
              {rule.metricName} {rule.operator} {rule.targetValue}
            </code>
          </div>
          {rule.rewardCoins > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Reward:</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                {rule.rewardCoins} coins
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Auto-award:</span>
            <span className={rule.autoAward ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>
              {rule.autoAward ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <Edit2 className="w-3 h-3" /> Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
            Delete
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AchievementRulesTab() {
  const [rules, setRules] = useState([]);
  const [badges, setBadges] = useState([]);
  const [titles, setTitles] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [rulesRes, badgesRes, titlesRes, metricsRes] = await Promise.all([
        api.get('/admin/gamification/achievement-rules'),
        api.get('/admin/gamification/badges'),
        api.get('/admin/gamification/titles'),
        api.get('/admin/gamification/metrics'),
      ]);
      setRules(rulesRes.items || []);
      setBadges(badgesRes.badges || []);
      setTitles(titlesRes.titles || []);
      setMetrics(metricsRes.metrics || []);
    } catch (err) {
      toast.error('Failed to load achievement rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading achievement rules…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-semibold mb-1">Achievement Rules</p>
            <p className="text-blue-700 dark:text-blue-300">
              Define conditions for automatically awarding badges and titles to users. Rules are
              evaluated in real-time when users perform actions like check-ins, completing missions,
              or winning predictions.
            </p>
          </div>
        </div>
      </div>

      <CreateForm
        badges={badges}
        titles={titles}
        metrics={metrics}
        onCreated={(newRule) => setRules((prev) => [newRule, ...prev])}
      />

      {rules.length === 0 ? (
        <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
          <CardContent className="p-8 text-center text-sm text-slate-500">
            <Zap className="w-8 h-8 inline mb-2 opacity-50" />
            <p>No achievement rules yet. Create one above to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {rules.map((rule) =>
            editingId === rule.id ? (
              <EditCard
                key={rule.id}
                rule={rule}
                badges={badges}
                titles={titles}
                metrics={metrics}
                onSaved={(updated) => {
                  setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <RuleCard
                key={rule.id}
                rule={rule}
                onEdit={() => setEditingId(rule.id)}
                onDelete={(id) => setRules((prev) => prev.filter((r) => r.id !== id))}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

export default function ConditionalChallengeFields({ 
  challengeType, 
  values, 
  onChange, 
  errors = {},
  disabled = false 
}) {
  const handleChange = (field, value) => {
    onChange({ ...values, [field]: value });
  };

  const getCurrentYear = () => new Date().getFullYear();
  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - start) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
  };

  if (challengeType === 'daily') {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Challenge Date (optional)
          </label>
          <input
            type="date"
            value={values.challengeDate || ''}
            onChange={(e) => handleChange('challengeDate', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
          />
          {errors.challengeDate && (
            <p className="mt-1 text-xs text-red-600">{errors.challengeDate}</p>
          )}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Leave empty to assign later, or select a specific date
          </p>
        </div>
      </div>
    );
  }

  if (challengeType === 'weekly') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Week Number <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="53"
              value={values.weekNumber || getCurrentWeek()}
              onChange={(e) => handleChange('weekNumber', parseInt(e.target.value) || '')}
              disabled={disabled}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
            {errors.weekNumber && (
              <p className="mt-1 text-xs text-red-600">{errors.weekNumber}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Year <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="2020"
              max="2030"
              value={values.weekYear || getCurrentYear()}
              onChange={(e) => handleChange('weekYear', parseInt(e.target.value) || '')}
              disabled={disabled}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
            {errors.weekYear && (
              <p className="mt-1 text-xs text-red-600">{errors.weekYear}</p>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Week numbers follow ISO 8601 standard (1-53). Current week: {getCurrentWeek()}
        </p>
      </div>
    );
  }

  if (challengeType === 'special') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={values.startDate || ''}
              onChange={(e) => handleChange('startDate', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
            {errors.startDate && (
              <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={values.endDate || ''}
              onChange={(e) => handleChange('endDate', e.target.value)}
              disabled={disabled}
              min={values.startDate || undefined}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
            {errors.endDate && (
              <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Special challenges run for a custom date range and can be attempted once per user
        </p>
      </div>
    );
  }

  return null;
}
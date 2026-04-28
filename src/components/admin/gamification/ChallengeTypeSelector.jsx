export default function ChallengeTypeSelector({ value, onChange, disabled = false }) {
  const challengeTypes = [
    { value: 'daily', label: 'Daily Challenge', description: 'Challenge for a specific date' },
    { value: 'weekly', label: 'Weekly Challenge', description: 'Challenge for a specific week' },
    { value: 'special', label: 'Special Challenge', description: 'Challenge with custom date range' }
  ];

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
        Challenge Type
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {challengeTypes.map((type) => (
          <label
            key={type.value}
            className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
              value === type.value
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name="challengeType"
              value={type.value}
              checked={value === type.value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="sr-only"
            />
            <div className="flex flex-col">
              <span className={`block text-sm font-medium ${
                value === type.value
                  ? 'text-indigo-900 dark:text-indigo-100'
                  : 'text-slate-900 dark:text-white'
              }`}>
                {type.label}
              </span>
              <span className={`mt-1 block text-xs ${
                value === type.value
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {type.description}
              </span>
            </div>
            {value === type.value && (
              <div className="absolute -inset-px rounded-lg border-2 border-indigo-600 pointer-events-none" />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
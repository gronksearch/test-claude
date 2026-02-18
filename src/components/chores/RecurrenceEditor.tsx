import type { RecurrenceRule, Frequency } from '../../types';

interface Props {
  value: RecurrenceRule | null;
  onChange: (rule: RecurrenceRule | null) => void;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_RULE: RecurrenceRule = {
  frequency: 'weekly',
  interval: 1,
  daysOfWeek: [1], // Monday
};

export function RecurrenceEditor({ value, onChange }: Props) {
  const enabled = value !== null;

  function toggle() {
    onChange(enabled ? null : DEFAULT_RULE);
  }

  function update(partial: Partial<RecurrenceRule>) {
    if (!value) return;
    onChange({ ...value, ...partial });
  }

  function setFrequency(frequency: Frequency) {
    if (!value) return;
    const base: RecurrenceRule = { frequency, interval: value.interval };
    if (frequency === 'weekly') base.daysOfWeek = [1];
    if (frequency === 'monthly') base.dayOfMonth = 1;
    onChange(base);
  }

  function toggleDay(day: number) {
    if (!value) return;
    const current = value.daysOfWeek ?? [];
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort();
    // At least one day must be selected
    if (next.length === 0) return;
    update({ daysOfWeek: next });
  }

  const inputClass = "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={toggle}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600"
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Recurring chore</span>
      </label>

      {enabled && value && (
        <div className="ml-7 space-y-3 border-l-2 border-blue-100 dark:border-blue-900 pl-4">
          {/* Frequency */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 dark:text-gray-300">Repeat every</span>
            <input
              type="number"
              min={1}
              max={99}
              value={value.interval}
              onChange={(e) => update({ interval: Math.max(1, parseInt(e.target.value) || 1) })}
              className={`w-16 text-center ${inputClass}`}
            />
            <select
              value={value.frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
              className={inputClass}
            >
              <option value="daily">day(s)</option>
              <option value="weekly">week(s)</option>
              <option value="monthly">month(s)</option>
            </select>
          </div>

          {/* Weekly: day picker */}
          {value.frequency === 'weekly' && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">On these days:</p>
              <div className="flex gap-1 flex-wrap">
                {DAY_LABELS.map((label, i) => {
                  const active = (value.daysOfWeek ?? []).includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Monthly: day of month */}
          {value.frequency === 'monthly' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">On day</span>
              <input
                type="number"
                min={1}
                max={31}
                value={value.dayOfMonth ?? 1}
                onChange={(e) =>
                  update({ dayOfMonth: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)) })
                }
                className={`w-16 text-center ${inputClass}`}
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">of the month</span>
            </div>
          )}

          {/* End date */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Ends</span>
            <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="radio"
                name="end"
                checked={!value.endDate}
                onChange={() => {
                  const { endDate: _, ...rest } = value;
                  onChange(rest);
                }}
                className="text-blue-600"
              />
              Never
            </label>
            <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="radio"
                name="end"
                checked={!!value.endDate}
                onChange={() => update({ endDate: new Date().toISOString().slice(0, 10) })}
                className="text-blue-600"
              />
              On
            </label>
            {value.endDate && (
              <input
                type="date"
                value={value.endDate}
                onChange={(e) => update({ endDate: e.target.value })}
                className={inputClass}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

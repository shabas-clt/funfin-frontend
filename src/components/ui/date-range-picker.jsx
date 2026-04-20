import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { Calendar, X } from 'lucide-react';
import 'react-day-picker/dist/style.css';

export function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const label =
    value?.from && value?.to
      ? `${format(value.from, 'MMM d')} - ${format(value.to, 'MMM d')}`
      : value?.from
      ? `${format(value.from, 'MMM d')} - ?`
      : 'Select range';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <Calendar className="w-4 h-4 text-slate-400" />
        {label}
        {value?.from && (
          <span
            onClick={(e) => { e.stopPropagation(); onChange(undefined); }}
            className="ml-1 text-slate-400 hover:text-rose-500"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3">
          <DayPicker
            mode="range"
            selected={value}
            onSelect={(range) => {
              onChange(range);
              if (range?.from && range?.to) setOpen(false);
            }}
            numberOfMonths={1}
            className="dark:[--rdp-accent-color:#818cf8] text-slate-800 dark:text-slate-100"
          />
        </div>
      )}
    </div>
  );
}

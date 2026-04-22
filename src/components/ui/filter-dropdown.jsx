import { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, Check } from 'lucide-react';

const STATUS_OPTIONS = ['All', 'Active', 'Suspend', 'Pending', 'Published', 'Pause', 'Upcoming'];

export function FilterDropdown({ options = STATUS_OPTIONS, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = value || 'All';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
      >
        <Filter className="w-4 h-4 text-slate-400" />
        {selected === 'All' ? 'Filter' : selected}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-44 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-xl py-1.5 overflow-hidden">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt === 'All' ? '' : opt); setOpen(false); }}
              className="w-full flex items-center justify-between px-3.5 py-2 text-[13px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
            >
              {opt}
              {selected === opt && <Check className="w-3.5 h-3.5 text-indigo-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

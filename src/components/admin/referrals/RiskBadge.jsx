import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

// Maps a fraud risk level (ADMIN.md §10) to its colour + icon.
const RISK_CONFIG = {
  low: {
    label: 'Low risk',
    icon: ShieldCheck,
    class: 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  },
  medium: {
    label: 'Medium risk',
    icon: ShieldAlert,
    class: 'bg-amber-100/70 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  },
  high: {
    label: 'High risk',
    icon: ShieldX,
    class: 'bg-rose-100/70 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
  },
};

export function getRiskConfig(level) {
  return RISK_CONFIG[level] || RISK_CONFIG.low;
}

export default function RiskBadge({ level, score, showLabel = true }) {
  // No assessment available (e.g. settled payouts may omit it).
  if (!level) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100/70 text-slate-500 dark:bg-neutral-800 dark:text-slate-400">
        N/A
      </span>
    );
  }

  const config = getRiskConfig(level);
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${config.class}`}>
      <Icon className="w-3 h-3" />
      {showLabel ? config.label : level}
      {typeof score === 'number' && <span className="opacity-70">· {score}</span>}
    </span>
  );
}

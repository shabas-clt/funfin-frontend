// Shared formatters used across admin pages.
//
// Keeping these centralized means the dashboard, commerce pages, and any
// future analytics tiles all render numbers the same way.

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatInr(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return inrFormatter.format(n);
}

const numberFormatter = new Intl.NumberFormat('en-IN');

export function formatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return numberFormatter.format(n);
}

export function formatShortDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatShortDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Label axis dates like "12 Apr" from a YYYY-MM-DD string. We explicitly
 * parse as local-midnight to keep the label stable regardless of TZ.
 */
export function formatChartDay(yyyyMmDd) {
  if (!yyyyMmDd) return '';
  const parts = String(yyyyMmDd).split('-');
  if (parts.length !== 3) return yyyyMmDd;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (Number.isNaN(d.getTime())) return yyyyMmDd;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

// Labels and badges shared by the Payments admin tabs.

export const KIND_LABELS = {
  funcoin: 'FunCoins',
  course: 'Course',
  pro_signal: 'Pro Signals',
  coins: 'FunCoins',
};

export const CHANNEL_LABELS = {
  stripe: 'Stripe',
  apple: 'App Store',
  google: 'Google Play',
  funcoin: 'Paid with coins',
  free: 'Free',
  admin: 'Admin grant',
  dev: 'Dev (no payment)',
  razorpay: 'Razorpay (legacy)',
  unknown: 'Unknown',
};

// Why a purchase was refunded, in words an admin can act on.
export const REFUND_REASON_LABELS = {
  stripe_refund: 'Refunded in Stripe',
  stripe_dispute: 'Chargeback',
  admin_refund: 'Refunded by admin',
  admin_revoke: 'Revoked by admin',
  apple_refund: 'Refunded by Apple',
  apple_revoke: 'Revoked by Apple',
  apple_revoked_on_verify: 'Refunded by Apple',
  google_refund: 'Refunded by Google Play',
};

export function refundReasonLabel(reason) {
  if (!reason) return null;
  return REFUND_REASON_LABELS[reason] || reason.replace(/_/g, ' ');
}

const STATUS_CLASSES = {
  paid: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  created: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  failed: 'bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-slate-400',
  refunded: 'bg-rose-50 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
};

const STATUS_LABELS = {
  paid: 'Paid',
  created: 'Not paid yet',
  failed: 'Failed',
  refunded: 'Refunded',
};

export function StatusBadge({ status }) {
  const cls = STATUS_CLASSES[status] || STATUS_CLASSES.failed;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${cls}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

const CHANNEL_CLASSES = {
  stripe: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300',
  apple: 'bg-slate-900 text-white dark:bg-white dark:text-black',
  google: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  admin: 'bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300',
  funcoin: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

export function ChannelBadge({ channel }) {
  const cls = CHANNEL_CLASSES[channel] || 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-300';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap ${cls}`}>
      {CHANNEL_LABELS[channel] || channel}
    </span>
  );
}

export const inputClass =
  'w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white';

export const selectClass =
  'px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white';

import { CreditCard, Smartphone, Landmark, Wallet, HelpCircle } from 'lucide-react';

// Shared presentational component for a single Razorpay payment instrument.
//
// The backend returns a normalized shape under `paymentInstrument`:
//   { method, cardNetwork, cardLast4, cardIssuer, bank, wallet, vpa }
//
// We keep the rendering logic here so every admin page (dashboard, course
// purchases page, funcoin purchases page, signal purchases page) shows
// the same visual for each method rather than half a dozen divergent
// copies.

const METHOD_STYLES = {
  card: {
    Icon: CreditCard,
    label: 'Card',
    badgeClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',
  },
  upi: {
    Icon: Smartphone,
    label: 'UPI',
    badgeClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  },
  netbanking: {
    Icon: Landmark,
    label: 'Net Banking',
    badgeClass: 'bg-sky-50 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400',
  },
  wallet: {
    Icon: Wallet,
    label: 'Wallet',
    badgeClass: 'bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
  },
  emi: {
    Icon: CreditCard,
    label: 'EMI',
    badgeClass: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  },
  paylater: {
    Icon: Wallet,
    label: 'Pay Later',
    badgeClass: 'bg-rose-50 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
  },
};

const FALLBACK_STYLE = {
  Icon: HelpCircle,
  label: 'Unknown',
  badgeClass: 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-300',
};

function styleFor(method) {
  const key = String(method || '').toLowerCase();
  return METHOD_STYLES[key] || FALLBACK_STYLE;
}

/**
 * Compact single-line summary of an instrument. Used inside dense table cells.
 */
export function PaymentInstrument({ instrument, channel }) {
  // `channel` is the high-level source for course purchases
  // ("free" | "funcoin" | "razorpay"). For free/funcoin we override the
  // Razorpay-level rendering since there is no Razorpay instrument.
  if (channel === 'free') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-300">
        Free
      </span>
    );
  }
  if (channel === 'funcoin') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
        FunCoins
      </span>
    );
  }

  const { Icon, label, badgeClass } = styleFor(instrument?.method);

  const secondary = (() => {
    if (!instrument) return null;
    if (instrument.cardNetwork || instrument.cardLast4) {
      const net = instrument.cardNetwork ? instrument.cardNetwork.toUpperCase() : 'CARD';
      const last = instrument.cardLast4 ? ` •••• ${instrument.cardLast4}` : '';
      return `${net}${last}`;
    }
    if (instrument.vpa) return instrument.vpa;
    if (instrument.bank) return instrument.bank.toUpperCase();
    if (instrument.wallet) return instrument.wallet;
    return null;
  })();

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold ${badgeClass}`}
      >
        <Icon className="w-3.5 h-3.5" /> {label}
      </span>
      {secondary && (
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          {secondary}
        </span>
      )}
    </div>
  );
}

export default PaymentInstrument;

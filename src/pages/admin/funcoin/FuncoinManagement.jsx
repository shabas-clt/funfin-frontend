import { useState } from 'react';
import { Coins, List, ArrowRightLeft, ShoppingBag } from 'lucide-react';
import PricingTab from './tabs/PricingTab';
import CategoriesTab from './tabs/CategoriesTab';
import TransactionsTab from './tabs/TransactionsTab';
import PurchasesTab from './tabs/PurchasesTab';

// Tabs are rendered in place (no route params) because most admins will
// flip between pricing / transactions / purchases while investigating a
// single user or a single day's numbers. Route-per-tab would force a
// full data reload each time which isn't worth the deep-link cost.

const TABS = [
  { id: 'pricing', label: 'Pricing', icon: Coins },
  { id: 'categories', label: 'Categories', icon: List },
  { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
  { id: 'purchases', label: 'Purchases', icon: ShoppingBag },
];

export default function FuncoinManagement() {
  const [tab, setTab] = useState('pricing');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white">
          FunCoin
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Set the INR price, manage earn/spend categories, review the ledger,
          and audit Razorpay-backed purchases.
        </p>
      </div>

      <div className="border-b border-slate-200 dark:border-neutral-800">
        <nav className="flex gap-1 overflow-x-auto -mb-px" role="tablist" aria-label="FunCoin admin sections">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div>
        {tab === 'pricing' && <PricingTab />}
        {tab === 'categories' && <CategoriesTab />}
        {tab === 'transactions' && <TransactionsTab />}
        {tab === 'purchases' && <PurchasesTab />}
      </div>
    </div>
  );
}

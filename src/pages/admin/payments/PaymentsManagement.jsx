import { useCachedState } from '@/lib/pageCache';
import { BarChart3, Receipt, UserSearch, AlertTriangle, ScrollText, Store } from 'lucide-react';
import OverviewTab from './tabs/OverviewTab';
import PurchasesTab from './tabs/PurchasesTab';
import CustomerTab from './tabs/CustomerTab';
import IssuesTab from './tabs/IssuesTab';
import AuditTab from './tabs/AuditTab';
import StoreProductsTab from './tabs/StoreProductsTab';

// Every purchase across Stripe, the App Store, FunCoins and admin grants, and
// the tools to act on them (refund, revoke, restore, grant). Clicking a user
// anywhere opens them in the Customer tab.

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'purchases', label: 'Purchases', icon: Receipt },
  { id: 'customer', label: 'Customer', icon: UserSearch },
  { id: 'issues', label: 'Refund issues', icon: AlertTriangle },
  { id: 'audit', label: 'Audit log', icon: ScrollText },
  { id: 'store', label: 'Store products', icon: Store },
];

export default function PaymentsManagement() {
  // Tab and the opened customer are cached, so coming back to Payments
  // reopens the same tab.
  const [tab, setTab] = useCachedState('payments:tab', 'overview');
  const [userId, setUserId] = useCachedState('payments:userId', null);

  const openUser = (id) => {
    setUserId(id);
    setTab('customer');
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white">
          Payments
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Coins, courses and Pro Signals bought through Stripe or the App Store. Refund,
          revoke, restore or grant access; every action is logged with a reason.
        </p>
      </div>

      <div className="border-b border-slate-200 dark:border-neutral-800">
        <nav className="flex gap-1 overflow-x-auto -mb-px" role="tablist" aria-label="Payments sections">
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
        {tab === 'overview' && <OverviewTab onGoTo={setTab} />}
        {tab === 'purchases' && <PurchasesTab onOpenUser={openUser} />}
        {tab === 'customer' && <CustomerTab userId={userId} onSelectUser={setUserId} />}
        {tab === 'issues' && <IssuesTab onOpenUser={openUser} />}
        {tab === 'audit' && <AuditTab onOpenUser={openUser} />}
        {tab === 'store' && <StoreProductsTab />}
      </div>
    </div>
  );
}

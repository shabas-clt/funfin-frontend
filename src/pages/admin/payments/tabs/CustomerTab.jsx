import { useCallback, useEffect, useState } from 'react';
import { Gift, Loader2, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import { paymentsApi, errorText } from '@/api/paymentsApi';
import { formatNumber, formatShortDate, formatShortDateTime, formatUsd } from '@/lib/format';
import PurchaseTable from '@/components/admin/payments/PurchaseTable';
import ActionDialog from '@/components/admin/payments/ActionDialog';
import { CHANNEL_LABELS, inputClass, selectClass } from '@/components/admin/payments/badges';

function UserSearch({ onSelect }) {
  const [input, setInput] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const search = async (e) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setLoading(true);
    try {
      const res = await paymentsApi.searchUsers(q);
      setResults(res.users || []);
      if (res.users?.length === 1) onSelect(res.users[0].id);
    } catch (err) {
      toast.error(errorText(err, 'Search failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <form onSubmit={search} className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Find a user by name, email or id, then press Enter"
          className={`${inputClass} pl-9`}
        />
        {loading && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />}
      </form>
      {results && results.length === 0 && <div className="text-sm text-slate-500">No users found.</div>}
      {results && results.length > 1 && (
        <ul className="divide-y divide-slate-100 dark:divide-neutral-800 border border-slate-100 dark:border-neutral-800 rounded-lg">
          {results.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => onSelect(u.id)}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-neutral-900"
              >
                <span className="text-sm text-slate-900 dark:text-white">{u.name}</span>
                <span className="text-xs text-slate-500 ml-2">{u.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GrantPanel({ user, onGranted }) {
  const [kind, setKind] = useState('course');
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [days, setDays] = useState(30);
  const [coins, setCoins] = useState(100);
  const [action, setAction] = useState(null);

  useEffect(() => {
    paymentsApi
      .courses()
      .then((res) => setCourses(res.courses || []))
      .catch(() => setCourses([]));
  }, []);

  const owned = new Set(user.courses.map((c) => c.courseId));
  const course = courses.find((c) => c.id === courseId);

  const summary =
    kind === 'course'
      ? course && `the course "${course.title}"`
      : kind === 'pro_signal'
        ? days > 0 && `${days} days of Pro Signals (added after any time they already have)`
        : coins > 0 && `${formatNumber(coins)} FunCoins`;

  const confirm = () => {
    if (!summary) return;
    setAction({
      title: 'Grant access',
      confirmLabel: 'Grant',
      description: (
        <p>
          Gives {user.user.name} {summary}. No payment is recorded; it shows as an admin grant.
        </p>
      ),
      run: async (reason) => {
        try {
          const payload = { userId: user.user.id, kind, reason };
          if (kind === 'course') payload.courseId = courseId;
          if (kind === 'pro_signal') payload.days = Number(days);
          if (kind === 'coins') payload.coins = Number(coins);
          await paymentsApi.grant(payload);
          toast.success('Granted');
          onGranted();
        } catch (err) {
          toast.error(errorText(err, 'Grant failed'));
          throw err;
        }
      },
    });
  };

  return (
    <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <Gift className="w-4 h-4" /> Grant
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={selectClass}>
            <option value="course">Course</option>
            <option value="pro_signal">Pro Signals days</option>
            <option value="coins">FunCoins</option>
          </select>
          {kind === 'course' && (
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className={`${selectClass} flex-1 min-w-0`}
            >
              <option value="">Choose a course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id} disabled={owned.has(c.id)}>
                  {c.title}
                  {owned.has(c.id) ? ' (already has it)' : ''}
                  {!c.isPublished ? ' (unpublished)' : ''}
                </option>
              ))}
            </select>
          )}
          {kind === 'pro_signal' && (
            <input
              type="number"
              min={1}
              max={3650}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              aria-label="Days"
              className={`${selectClass} w-32`}
            />
          )}
          {kind === 'coins' && (
            <input
              type="number"
              min={1}
              value={coins}
              onChange={(e) => setCoins(e.target.value)}
              aria-label="Coins"
              className={`${selectClass} w-40`}
            />
          )}
          <button
            type="button"
            onClick={confirm}
            disabled={!summary}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            Grant…
          </button>
        </div>
      </CardContent>
      <ActionDialog action={action} onClose={() => setAction(null)} />
    </Card>
  );
}

function Summary({ data }) {
  const { pro } = data;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-4">
          <div className="text-xs text-slate-500">Wallet</div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">
            {formatNumber(data.walletBalance)}
          </div>
          <div className="text-[11px] text-slate-400">FunCoins</div>
        </CardContent>
      </Card>
      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-4">
          <div className="text-xs text-slate-500">Pro Signals</div>
          <div
            className={`text-2xl font-semibold mt-1 ${
              pro.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
            }`}
          >
            {pro.isActive ? 'Active' : 'Inactive'}
          </div>
          <div className="text-[11px] text-slate-400">
            {pro.isActive ? `until ${formatShortDate(pro.endsAt)}` : 'No current pass'}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-4">
          <div className="text-xs text-slate-500">Courses owned</div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">
            {formatNumber(data.courses.length)}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-4">
          <div className="text-xs text-slate-500">Paid in total</div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">
            {formatUsd(data.stats.paidUsd)}
          </div>
          <div className="text-[11px] text-slate-400">
            {formatNumber(data.stats.purchases)} purchases · {formatNumber(data.stats.refunds)} refunded
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AccessLists({ data }) {
  return (
    <div className="grid lg:grid-cols-2 gap-3">
      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-4">
          <div className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Courses</div>
          {data.courses.length === 0 ? (
            <div className="text-sm text-slate-500">No courses.</div>
          ) : (
            <ul className="text-sm divide-y divide-slate-100 dark:divide-neutral-800">
              {data.courses.map((c) => (
                <li key={c.courseId} className="py-1.5 flex justify-between gap-3">
                  <span className="text-slate-700 dark:text-slate-200">{c.title}</span>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {c.via.length ? c.via.map((v) => CHANNEL_LABELS[v] || v).join(', ') : 'No paid purchase'}
                    {' · '}
                    {String(c.progress).replace('_', ' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-4">
          <div className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Pro Signals passes</div>
          {data.pro.passes.length === 0 ? (
            <div className="text-sm text-slate-500">No passes.</div>
          ) : (
            <ul className="text-sm divide-y divide-slate-100 dark:divide-neutral-800">
              {data.pro.passes.map((p) => (
                <li key={p.id} className="py-1.5 flex justify-between gap-3">
                  <span className="text-slate-700 dark:text-slate-200">
                    {formatShortDateTime(p.startsAt)} → {formatShortDateTime(p.endsAt)}
                  </span>
                  <span className="text-xs text-slate-500 capitalize">{p.status}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CustomerTab({ userId, onSelectUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setData(await paymentsApi.user(userId));
    } catch (err) {
      toast.error(errorText(err, 'Failed to load user'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <UserSearch onSelect={onSelectUser} />

      {!userId && (
        <div className="text-sm text-slate-500 py-8 text-center">
          Search for a user, or click a user in Purchases, to see everything they have paid for.
        </div>
      )}

      {userId && loading && !data && (
        <div className="py-12 text-center text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Loading…
        </div>
      )}

      {data && (
        <>
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">{data.user.name}</div>
            <div className="text-sm text-slate-500">
              {data.user.email} · joined {formatShortDate(data.user.createdAt)} · id {data.user.id}
            </div>
          </div>
          <Summary data={data} />
          <GrantPanel user={data} onGranted={load} />
          <AccessLists data={data} />
          <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
            <CardContent className="p-4">
              <div className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Purchase history</div>
              <PurchaseTable rows={data.purchases} loading={loading} onReload={load} showUser={false} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

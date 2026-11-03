import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import { paymentsApi, errorText } from '@/api/paymentsApi';
import { formatInr, formatNumber, formatUsd } from '@/lib/format';

// Store products: the App Store and Google Play product behind every
// paid item, and whether the apps offer it yet. A switch stays off until the
// store has approved that product; the apps then hide the store purchase
// (courses can still be unlocked with FunCoins).

function CopyId({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy');
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      title="Copy product ID"
      className="group inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-left break-all"
    >
      {value}
      {copied ? (
        <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
      ) : (
        <Copy className="w-3.5 h-3.5 shrink-0 opacity-40 group-hover:opacity-100" />
      )}
    </button>
  );
}

function Toggle({ on, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-40 ${
        on ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-neutral-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function Price({ usd, inr }) {
  return (
    <>
      {usd != null ? formatUsd(usd) : '—'}
      {inr ? <span className="block text-[11px] font-normal text-slate-400">{formatInr(inr)}</span> : null}
    </>
  );
}

const th = 'px-4 py-2.5 font-medium';
const td = 'px-4 py-2.5 align-top';

function Section({ title, type, hint, children }) {
  return (
    <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">{title}</div>
          <div className="text-xs text-slate-500">
            App Store type: <span className="font-medium text-slate-700 dark:text-slate-200">{type}</span>
          </div>
        </div>
        {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
        <div className="overflow-x-auto -mx-4">{children}</div>
      </CardContent>
    </Card>
  );
}

export default function StoreProductsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [showFree, setShowFree] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await paymentsApi.storeProducts());
    } catch (err) {
      toast.error(errorText(err, 'Failed to load store products'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Optimistic switch: flip locally, roll back if the save fails.
  const flip = async (key, apply, save) => {
    setBusy(key);
    const before = data;
    setData(apply(data));
    try {
      await save();
    } catch (err) {
      setData(before);
      toast.error(errorText(err, 'Could not save'));
    } finally {
      setBusy(null);
    }
  };

  if (loading || !data) {
    return (
      <div className="py-12 text-center text-slate-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
        Loading…
      </div>
    );
  }

  const courses = data.courses.filter((c) => showFree || !c.isFree);
  const paidCourses = data.courses.filter((c) => !c.isFree);
  const coursesLive = paidCourses.filter((c) => c.iosEnabled).length;

  return (
    <div className="space-y-4">
      <Card className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900">
        <CardContent className="p-4 text-sm text-slate-700 dark:text-slate-200 space-y-2">
          <div className="font-semibold text-slate-900 dark:text-white">Adding a product to the App Store</div>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              In App Store Connect → your app → <b>In-App Purchases</b>, create a product of the type shown
              below, with exactly the <b>Product ID</b> listed here (click to copy). Product IDs can never be
              reused or changed.
            </li>
            <li>Pick the price closest to the price shown, add a display name and a review screenshot.</li>
            <li>
              Submit it for review (the first products go with an app version; later ones on their own).
            </li>
            <li>
              Once Apple shows it as <b>Approved</b>, switch <b>iOS</b> on here. Until then the iPhone app
              doesn't offer it; courses can still be unlocked with FunCoins.
            </li>
          </ol>
          <div className="font-semibold text-slate-900 dark:text-white pt-2">Adding a product to Google Play</div>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              In Play Console → your app → <b>Monetize → Products → In-app products</b>, create a product with the
              same <b>Product ID</b> as listed here. All of them are one-time in-app products, including Pro Signals
              (each purchase is a 30-day pass).
            </li>
            <li>Set the price and title, then <b>Activate</b> it.</li>
            <li>Switch <b>Android</b> on here. Google needs no review, so it works right away.</li>
          </ol>
        </CardContent>
      </Card>

      <Section
        title="Pro Signals"
        type="Non-Renewing Subscription"
        hint="One product: a 30-day pass. On Google Play it is a one-time in-app product."
      >
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-neutral-900 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className={th}>Product ID</th>
              <th className={`${th} text-right`}>Price</th>
              <th className={`${th} text-center`}>iOS</th>
              <th className={`${th} text-center`}>Android</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={td}>
                <CopyId value={data.proSignal.appleProductId} />
              </td>
              <td className={`${td} text-right font-semibold text-slate-900 dark:text-white`}>
                <Price usd={data.proSignal.priceUsd} inr={data.proSignal.priceInr} />
              </td>
              {['iosEnabled', 'androidEnabled'].map((flag) => (
                <td key={flag} className={`${td} text-center`}>
                  <Toggle
                    on={data.proSignal[flag]}
                    disabled={busy === `pro:${flag}`}
                    label={`Pro Signals ${flag === 'iosEnabled' ? 'iOS' : 'Android'}`}
                    onChange={(on) =>
                      flip(
                        `pro:${flag}`,
                        (d) => ({ ...d, proSignal: { ...d.proSignal, [flag]: on } }),
                        () => paymentsApi.setProStore({ [flag]: on }),
                      )
                    }
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </Section>

      <Section
        title="Coin packs"
        type="Consumable"
        hint="Packs are created and priced in FunCoin → Coin Packs. Inactive packs aren't sold anywhere."
      >
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-neutral-900 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className={th}>Pack</th>
              <th className={th}>Product ID</th>
              <th className={`${th} text-right`}>Price</th>
              <th className={`${th} text-center`}>iOS</th>
              <th className={`${th} text-center`}>Android</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
            {data.coinPacks.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No coin packs yet.
                </td>
              </tr>
            )}
            {data.coinPacks.map((p) => (
              <tr key={p.id}>
                <td className={td}>
                  <div className="text-slate-900 dark:text-white">{p.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {formatNumber(p.coins)} coins{!p.isActive && ' · inactive'}
                  </div>
                </td>
                <td className={td}>
                  <CopyId value={p.appleProductId} />
                </td>
                <td className={`${td} text-right font-semibold text-slate-900 dark:text-white`}>
                  <Price usd={p.priceUsd} inr={p.priceInr} />
                </td>
                {['iosEnabled', 'androidEnabled'].map((flag) => (
                  <td key={flag} className={`${td} text-center`}>
                    <Toggle
                      on={!!p[flag]}
                      disabled={busy === `pack:${p.id}:${flag}`}
                      label={`${p.name} ${flag === 'iosEnabled' ? 'iOS' : 'Android'}`}
                      onChange={(on) =>
                        flip(
                          `pack:${p.id}:${flag}`,
                          (d) => ({
                            ...d,
                            coinPacks: d.coinPacks.map((x) => (x.id === p.id ? { ...x, [flag]: on } : x)),
                          }),
                          () => paymentsApi.setCoinPackStore(p.id, { [flag]: on }),
                        )
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section
        title={`Courses · ${coursesLive} of ${paidCourses.length} paid courses live on iOS`}
        type="Non-Consumable"
        hint="Each paid course needs its own product. Free courses don't need one."
      >
        <div className="px-4 pb-2">
          <label className="inline-flex items-center gap-2 text-xs text-slate-500">
            <input type="checkbox" checked={showFree} onChange={(e) => setShowFree(e.target.checked)} />
            Show free courses
          </label>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-neutral-900 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className={th}>Course</th>
              <th className={th}>Product ID</th>
              <th className={`${th} text-right`}>Price</th>
              <th className={`${th} text-center`}>iOS</th>
              <th className={`${th} text-center`}>Android</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
            {courses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No paid courses.
                </td>
              </tr>
            )}
            {courses.map((c) => (
              <tr key={c.id} className={c.isFree ? 'opacity-50' : ''}>
                <td className={td}>
                  <div className="text-slate-900 dark:text-white">{c.title}</div>
                  <div className="text-[11px] text-slate-500">
                    {c.isFree ? 'Free' : c.isPublished ? 'Published' : 'Not published'}
                  </div>
                </td>
                <td className={td}>{c.isFree ? '—' : <CopyId value={c.appleProductId} />}</td>
                <td className={`${td} text-right font-semibold text-slate-900 dark:text-white`}>
                  {c.isFree ? 'Free' : <Price usd={c.priceUsd} inr={c.priceInr} />}
                </td>
                {['iosEnabled', 'androidEnabled'].map((flag) => (
                  <td key={flag} className={`${td} text-center`}>
                    {c.isFree ? (
                      '—'
                    ) : (
                      <Toggle
                        on={c[flag]}
                        disabled={busy === `course:${c.id}:${flag}`}
                        label={`${c.title} ${flag === 'iosEnabled' ? 'iOS' : 'Android'}`}
                        onChange={(on) =>
                          flip(
                            `course:${c.id}:${flag}`,
                            (d) => ({
                              ...d,
                              courses: d.courses.map((x) => (x.id === c.id ? { ...x, [flag]: on } : x)),
                            }),
                            () => paymentsApi.setCourseStore(c.id, { [flag]: on }),
                          )
                        }
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

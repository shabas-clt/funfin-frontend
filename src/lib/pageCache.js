import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// In-memory cache that keeps page data (and the filters that produced it)
// alive while the admin moves between pages. A page that was opened before
// shows its last data at once and refreshes in the background, instead of
// starting empty behind a skeleton on every visit.
//
// The cache lives only in memory: a full reload starts fresh, and it is
// cleared on login and logout so one account never sees another's data.
const store = new Map();

/** True once `key` has been written by useCachedState. */
export function hasCached(key) {
  return store.has(key);
}

/** Drop every cached value. Called on login and logout. */
export function clearPageCache() {
  store.clear();
}

/**
 * useState that survives unmounting. Same API as useState; every update is
 * also written to the cache under `key`. Keys are global, so prefix them with
 * the page name (e.g. 'students:rows').
 */
export function useCachedState(key, initial) {
  const [value, setValue] = useState(() => {
    if (store.has(key)) return store.get(key);
    return typeof initial === 'function' ? initial() : initial;
  });

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        store.set(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, set];
}

/**
 * Guards against out-of-order responses. Call `begin()` before a request and
 * keep the id it returns; after the response, apply it only if
 * `isLatest(id)`. A slower response for an older search or filter can then
 * no longer overwrite newer results or switch the loader off early.
 */
export function useLatestRequest() {
  const latest = useRef(0);
  const begin = useCallback(() => {
    latest.current += 1;
    return latest.current;
  }, []);
  const isLatest = useCallback((id) => id === latest.current, []);

  // Invalidate in-flight requests when the page unmounts.
  useEffect(
    () => () => {
      latest.current += 1;
    },
    [],
  );

  // Same object every render, so it is safe in useCallback/useEffect deps.
  return useMemo(() => ({ begin, isLatest }), [begin, isLatest]);
}

/**
 * Picks the page to load when a list's fetch effect runs. On open it keeps
 * the cached page; once the deps (filters, search, sort, or the load
 * callback) change, it goes back to the first page. It compares deps rather
 * than counting runs, so React StrictMode's second effect run in development
 * doesn't reset the restored page.
 *
 *   const restorePage = usePageRestore();
 *   useEffect(() => { load(restorePage(skip, [search, status])); }, [search, status]);
 */
export function usePageRestore() {
  const prev = useRef(null);
  return useCallback((page, deps, firstPage = 0) => {
    const unchanged =
      prev.current === null ||
      (prev.current.length === deps.length && prev.current.every((d, i) => Object.is(d, deps[i])));
    prev.current = deps;
    return unchanged ? page : firstPage;
  }, []);
}

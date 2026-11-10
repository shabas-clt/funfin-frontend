import { lazy } from 'react';

const RELOAD_KEY = 'ff-chunk-reload-at';
const RELOAD_GAP_MS = 10_000;

/**
 * React.lazy for route pages, with one recovery step: each deploy replaces
 * the page files (rsync --delete), so a tab opened before a deploy can ask
 * for a file that no longer exists. When that import fails, reload once to
 * pick up the new build. A second failure within 10 s is thrown instead of
 * reloading again, so a real error can't cause a reload loop.
 */
export function lazyPage(factory) {
  return lazy(() =>
    factory().catch((error) => {
      let last = 0;
      try {
        last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
      } catch {
        // storage unavailable: fall through and throw
      }
      if (Date.now() - last > RELOAD_GAP_MS) {
        try {
          sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        } catch {
          throw error;
        }
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }),
  );
}

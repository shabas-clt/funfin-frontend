import { useEffect, useState } from 'react';

/**
 * Returns `value` once it has stopped changing for `delay` ms. Use it for
 * search boxes so a request goes out when the admin stops typing, not on
 * every keystroke. An empty value is applied at once, so clearing the box
 * resets the list without waiting.
 */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (value === '' || value == null) {
      setDebounced(value);
      return undefined;
    }
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

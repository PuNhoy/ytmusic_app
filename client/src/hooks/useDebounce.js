import { useState, useEffect } from 'react';

/**
 * Debounces a value by specified delay in milliseconds.
 * @template T
 * @param {T} value
 * @param {number} delay
 * @returns {T}
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

import { createSignal } from '@ld/reactivity';

/**
 * A React-compatible `useState` hook implemented with ld's signal.
 * @param initialValue The initial value.
 * @returns A stateful value, and a function to update it.
 */
export function useState<T>(initialValue: T): [() => T, (newValue: T) => void] {
  const [value, setValue] = createSignal(initialValue);
  return [value, setValue];
}

// More hooks like useEffect, useMemo, etc., will be added here.


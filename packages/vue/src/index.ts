import { createSignal } from '@ld/reactivity';

/**
 * A Vue-compatible `ref` implemented with ld's signal.
 * @param initialValue The initial value.
 * @returns A ref object with a `.value` property.
 */
export function ref<T>(initialValue: T): { value: T } {
  const [value, setValue] = createSignal(initialValue);

  return {
    get value() {
      return value();
    },
    set value(newValue: T) {
      setValue(newValue);
    },
  };
}

// More Composition API functions like computed, watchEffect, etc., will be added here.


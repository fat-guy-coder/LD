/**
 * @description Memory test for creating computed values.
 */

import { createSignal } from '../src/signal';
import { createComputed } from '../src/computed';
import type { Signal } from '../src/types';

export function run(): void {
  const computeds: { readonly value: number }[] = []
  for (let i = 0; i < 1000; i++) {
    const source: Signal<number> = createSignal(i)
    const computed = createComputed(() => source() * 2)
    computeds.push(computed)
  }
  ;(window as any).__retainedObjects = computeds
}


/**
 * @description Memory test for creating signals and effects.
 * This file will be executed in a Puppeteer environment by `scripts/memory.mts`.
 */

import { createSignal } from '../src/signal';
import { createEffect } from '../src/effect';
import type { Signal } from '../src/types';

/**
 * @description The main test function that the memory runner will execute.
 */
export function run(): void {
  const signals: Signal<number>[] = []
  for (let i = 0; i < 1000; i++) {
    const count: Signal<number> = createSignal(i)
    // Create an effect for each signal to simulate a more realistic usage scenario,
    // where signals are tracked by the reactivity system.
    createEffect(() => {
      // Read the signal's value to establish a dependency.
      count()
    })
    signals.push(count)
  }

  // Expose the created signals to the global scope (window).
  // This is crucial to prevent them from being garbage-collected by the JS engine
  // before Puppeteer has a chance to take the memory snapshot.
  ; (window as any).__retainedObjects = signals
}



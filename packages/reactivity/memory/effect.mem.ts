/**
 * @description Memory test for creating effects.
 */

import { createSignal } from '../src/signal';
import { createEffect, type ReactiveEffect } from '../src/effect';

export function run(): void {
  const effects: ReactiveEffect<any>[] = []
  for (let i = 0; i < 1000; i++) {
    const source = createSignal(i)
    const effect = createEffect(() => {
      // Read the signal's value to establish a dependency.
      source()
    })
    effects.push(effect)
  }
  // Retain the effects themselves to prevent them from being garbage-collected.
  ;(window as any).__retainedObjects = effects
}

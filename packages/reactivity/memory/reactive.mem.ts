/**
 * @description Memory test for creating reactive objects.
 */

import { createReactive } from '../src/reactive';
import { createEffect } from '../src/effect';

export function run(): void {
  const reactives: any[] = []
  for (let i = 0; i < 1000; i++) {
    const state = createReactive({
      count: i,
      nested: { value: `text-${i}` },
    })
    // Create an effect to simulate realistic usage and ensure
    // the reactive object's properties are tracked.
    createEffect(() => {
      // Access properties to create subscriptions
      const _ = state.count
      const __ = state.nested.value
    })
    reactives.push(state)
  }
  ;(window as any).__retainedObjects = reactives
}


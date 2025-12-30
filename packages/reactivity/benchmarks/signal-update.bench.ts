import type { Bench } from 'tinybench';
import { createSignal, createEffect } from '../src';

export default (bench: Bench): void => {
  const [count, setCount] = createSignal(0);

  // Create a dependency so the update has an effect to run.
  createEffect(() => count());

  bench.add('LD Signal Update', () => {
    for (let i = 0; i < 1000; i++) {
      setCount(c => c + 1);
    }
  });
};
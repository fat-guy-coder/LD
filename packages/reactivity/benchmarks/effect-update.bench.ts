import type { Bench } from 'tinybench';
import { createSignal, createEffect } from '../src';

export default (bench: Bench): void => {
  const [count, setCount] = createSignal(0);

  // Create the effect once, its updates will be measured.
  createEffect(() => {
    count();
  });

  bench.add('LD Effect Update', () => {
    setCount(i => i + 1);
  });
};

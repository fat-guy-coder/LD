import type { Bench } from 'tinybench';
import { createSignal } from '../src';

export default (bench: Bench) => {
  const [count] = createSignal(0);

  bench.add('LD Signal Get', () => {
    for (let i = 0; i < 1000; i++) {
      count();
    }
  });
};
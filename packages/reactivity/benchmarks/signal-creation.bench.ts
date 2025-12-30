import type { Bench } from 'tinybench';
import { createSignal } from '../src';

export default (bench: Bench) => {
  bench.add('LD Signal Creation', () => {
    for (let i = 0; i < 1000; i++) {
      createSignal(i);
    }
  });
};
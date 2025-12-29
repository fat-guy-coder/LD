import { describe, it, expect, vi } from 'vitest';
import { createSignal, createEffect, waitForJobs } from '../src';

describe('createEffect', () => {
  it('should run the effect function immediately', () => {
    const fn = vi.fn();
    createEffect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should re-run the effect when a dependency changes', async () => {
    const [count, setCount] = createSignal(0);
    const fn = vi.fn(() => count());

    createEffect(fn);
    expect(fn).toHaveBeenCalledTimes(1);

    setCount(1);
    await waitForJobs();
    expect(fn).toHaveBeenCalledTimes(2);

    setCount(2);
    await waitForJobs();
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should not re-run the effect when a dependency is set to the same value', async () => {
    const [count, setCount] = createSignal(0);
    const fn = vi.fn(() => count());

    createEffect(fn);
    expect(fn).toHaveBeenCalledTimes(1);

    setCount(0);
    await waitForJobs();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple dependencies', async () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    let sum = 0;

    const fn = vi.fn(() => {
      sum = a() + b();
    });

    createEffect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sum).toBe(3);

    setA(5);
    await waitForJobs();
    expect(fn).toHaveBeenCalledTimes(2);
    expect(sum).toBe(7);

    setB(10);
    await waitForJobs();
    expect(fn).toHaveBeenCalledTimes(3);
    expect(sum).toBe(15);
  });

  it('should support nested effects', async () => {
    const [a, setA] = createSignal(0);
    const [b, setB] = createSignal(0);

    const innerFn = vi.fn(() => b());
    const outerFn = vi.fn(() => {
      a();
      createEffect(innerFn);
    });

    createEffect(outerFn);

    expect(outerFn).toHaveBeenCalledTimes(1);
    expect(innerFn).toHaveBeenCalledTimes(1);

    setB(1);
    await waitForJobs();
    expect(outerFn).toHaveBeenCalledTimes(1);
    expect(innerFn).toHaveBeenCalledTimes(2);

    setA(1);
    await waitForJobs();
    expect(outerFn).toHaveBeenCalledTimes(2);
    // Inner effect is created again, so it runs once on creation
    expect(innerFn).toHaveBeenCalledTimes(3);
  });

  it('should return a stop function to manually stop the effect', async () => {
    const [count, setCount] = createSignal(0);
    const fn = vi.fn(() => count());

    const effect = createEffect(fn);
    expect(fn).toHaveBeenCalledTimes(1);

    setCount(1);
    await waitForJobs();
    expect(fn).toHaveBeenCalledTimes(2);

    effect.stop();
    setCount(2);
    setCount(3);
    await waitForJobs();

    // Should not have been called again after stopping
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { createSignal, createComputed, createEffect, waitForJobs } from '../src';

describe('createComputed', () => {
  it('should return a readonly value property', () => {
    const a = createComputed(() => 1);
    expect(a.value).toBe(1);
    // @ts-expect-error - value should be readonly
    expect(() => (a.value = 2)).toThrow();
  });

  it('should compute the value lazily', () => {
    const getter = vi.fn(() => 1);
    const c = createComputed(getter);

    // getter should not be called until the value is accessed
    expect(getter).not.toHaveBeenCalled();

    expect(c.value).toBe(1);
    expect(getter).toHaveBeenCalledTimes(1);

    // should not re-compute if value is accessed again
    c.value;
    expect(getter).toHaveBeenCalledTimes(1);
  });

  it('should re-compute when a dependency changes', () => {
    const [count, setCount] = createSignal(0);
    const double = createComputed(() => count() * 2);

    expect(double.value).toBe(0);

    setCount(5);
    expect(double.value).toBe(10);
  });

  it('should not re-compute if a dependency is set to the same value', () => {
    const [count, setCount] = createSignal(0);
    const getter = vi.fn(() => count() * 2);
    const double = createComputed(getter);

    expect(double.value).toBe(0);
    expect(getter).toHaveBeenCalledTimes(1);

    setCount(0);
    double.value; // access the value again
    expect(getter).toHaveBeenCalledTimes(1);
  });

  it('should trigger effects when its value changes', async () => {
    const [count, setCount] = createSignal(1);
    const double = createComputed(() => count() * 2);
    const effectFn = vi.fn(() => double.value);

    createEffect(effectFn);

    expect(effectFn).toHaveBeenCalledTimes(1);
    expect(double.value).toBe(2);

    setCount(2);
    await waitForJobs(); // Wait for the effect to run
    expect(effectFn).toHaveBeenCalledTimes(2);
    expect(double.value).toBe(4);
  });

  it('should chain with other computeds', () => {
    const [count, setCount] = createSignal(1);
    const double = createComputed(() => count() * 2);
    const quadruple = createComputed(() => double.value * 2);

    expect(quadruple.value).toBe(4);

    setCount(2);
    expect(quadruple.value).toBe(8);
  });
});

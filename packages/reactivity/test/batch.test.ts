import { describe, it, expect, vi } from 'vitest';
import { createSignal, batch, createEffect, waitForJobs } from '../src';

describe('batch', () => {
  it('should batch multiple signal updates into a single effect run', async () => {
    const [firstName, setFirstName] = createSignal('John');
    const [lastName, setLastName] = createSignal('Doe');
    const spy = vi.fn(() => {
      firstName();
      lastName();
    });

    createEffect(spy);

    expect(spy).toHaveBeenCalledTimes(1);

    batch(() => {
      setFirstName('Jane');
      setLastName('Smith');
      // Inside the batch, the effect should not have run yet.
      expect(spy).toHaveBeenCalledTimes(1);
    });

    // Wait for the microtask queue to be flushed.
    await waitForJobs();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should handle nested batch calls correctly', async () => {
    const [name, setName] = createSignal('A');
    const [age, setAge] = createSignal(10);
    const spy = vi.fn(() => {
      name();
      age();
    });

    createEffect(spy);

    expect(spy).toHaveBeenCalledTimes(1);

    batch(() => {
      setName('B');
      batch(() => {
        setAge(20);
      });
      // Still inside the outer batch, no effect run.
      expect(spy).toHaveBeenCalledTimes(1);
    });

    await waitForJobs();
    // Only after the outer batch completes, the effect runs once.
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should not trigger effects if batch is empty', async () => {
    const [count] = createSignal(0);
    const spy = vi.fn(() => count());

    createEffect(spy);

    expect(spy).toHaveBeenCalledTimes(1);

    batch(() => {
      // Empty batch
    });

    await waitForJobs();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should flush jobs correctly after batching', async () => {
    const [count, setCount] = createSignal(0);
    const spy = vi.fn(() => count());

    createEffect(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    setCount(1);
    await waitForJobs();
    expect(spy).toHaveBeenCalledTimes(2);

    batch(() => {
      setCount(10);
      setCount(20);
    });

    await waitForJobs();
    expect(spy).toHaveBeenCalledTimes(3);
    expect(count()).toBe(20);
  });
});

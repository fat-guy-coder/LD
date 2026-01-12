import { createSignal } from './signal';
import type { Signal } from './types';
import { globalState } from './store';

/**
 * @description 为一个对象创建一个深层响应式代理。
 * @template T - 对象的类型。
 * @param obj - 要使其响应式的对象。
 * @returns 原始对象的响应式代理。
 * @example
 * const state = createReactive({ count: 0, user: { name: 'John' } });
 * createEffect(() => {
 *   console.log('Count:', state.count, 'User:', state.user.name);
 * });
 * // 'Count: 0 User: John'
 * state.count++;
 * // 'Count: 1 User: John'
 * state.user.name = 'Jane';
 * // 'Count: 1 User: Jane'
 * @performance 代理会增加开销，但此实现通过缓存代理进行了优化。
 * @since v0.1.0
 */
export function createReactive<T extends object>(obj: T): T {
  const existingProxy = globalState.reactiveMap.get(obj);
  if (existingProxy) {
    return existingProxy as T;
  }

  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const signals = new Map<PropertyKey, Signal<unknown>>();

  const proxy = new Proxy(obj, {
    get(target, key, receiver) {
      let signal = signals.get(key);
      if (!signal) {
        const value = Reflect.get(target, key, receiver) as unknown;
        const initialValue =
          typeof value === 'object' && value !== null
            ? createReactive(value)
            : value;
        signal = createSignal(initialValue);
        signals.set(key, signal);
      }
      return signal();
    },
    set(target, key, value, receiver) {
      let signal = signals.get(key);
      const reactiveValue =
        typeof value === 'object' && value !== null
          ? createReactive(value as object)
          : value;

      if (!signal) {
        signal = createSignal(reactiveValue);
        signals.set(key, signal);
      } else {
        signal.set(reactiveValue);
      }
      return Reflect.set(target, key, value, receiver);
    },
  });

  globalState.reactiveMap.set(obj, proxy);
  return proxy;
}

import { track, trigger } from './effect';
import { globalState } from './store';
import type { SignalNode } from './store';
import type { Signal } from './types';

const BATCH_SIZE = 1000;

/**
 * @internal
 * @description 为对象池分配一批新的 SignalNode。
 */
function allocateBatch(): void {
  const batch: Array<SignalNode<unknown>> = new Array(BATCH_SIZE);
  for (let i = 0; i < BATCH_SIZE; i++) {
    batch[i] = { value: undefined, observers: null, next: null, version: 0 };
  }
  for (let i = 0; i < BATCH_SIZE - 1; i++) {
    const current = batch[i];
    const next = batch[i + 1];
    if (current && next) {
      current.next = next;
    }
  }
  const head = batch[0];
  if (head) {
    globalState.signalNodePool = head;
  }
}

/**
 * @internal
 * @description 从全局对象池中获取一个 SignalNode。
 */
function acquireSignalNode<T>(): SignalNode<T> {
  if (globalState.signalNodePool === null) {
    allocateBatch();
  }
  const node = globalState.signalNodePool as SignalNode<T>;
  globalState.signalNodePool = node.next;
  node.next = null;
  node.version = 0;
  return node;
}

/**
 * @description 创建一个可追踪变化的、性能极致的单一函数式 Signal。
 * @param initialValue - 信号的初始值。
 * @returns 一个单一函数，既是 getter 也是 setter。
 * @template T - 信号值的类型。
 * @example
 * const count = createSignal(0);
 * console.log(count()); // 读取: 0
 * count(1); // 写入: 1
 * @performance 目标: > 20M ops/sec for updates.
 * @since v0.2.0
 */
export function createSignal<T>(initialValue: T): Signal<T> {
  const node = acquireSignalNode<T>();
  node.value = initialValue;

  function signal(arg?: T | ((prev: T) => T)): T | void {
    // Getter: 无参数调用
    if (arguments.length === 0) {
      track(node);
      return node.value;
    }

    // Setter: 有参数调用
    const newValue = typeof arg === 'function'
      ? (arg as (prev: T) => T)(node.value)
      : arg;

    node.value = newValue as T;
    node.version = ++globalState.signalVersion;
    trigger(node);
  }

  // 将 setter 逻辑附加到 signal 函数上，作为 .set 方法
  signal.set = (valueOrUpdater: T | ((prev: T) => T)) => {
    const newValue = typeof valueOrUpdater === 'function'
      ? (valueOrUpdater as (prev: T) => T)(node.value)
      : valueOrUpdater;
    
    node.value = newValue;
    node.version = ++globalState.signalVersion;
    trigger(node);
  };

  return signal as Signal<T>;
}

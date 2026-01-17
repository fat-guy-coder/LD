import { track, trigger } from './effect';
import { globalState } from './store';
import type { SignalNode } from './store';
import type { Signal, EqualityFn } from './types';

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
  node.equals = undefined;  // 重置equals函数
  return node;
}

/**
 * @description 创建一个可追踪变化的、性能极致的单一函数式 Signal。
 * @param initialValue - 信号的初始值。
 * @param equals - 可选的相等性比较函数，用于判断值是否改变。默认为Object.is。如果设为false，则每次设置都会触发更新。
 * @returns 一个单一函数，既是 getter 也是 setter。
 * @template T - 信号值的类型。
 * @example
 * const count = createSignal(0);
 * console.log(count()); // 读取: 0
 * count(1); // 写入: 1
 * @performance 目标: > 20M ops/sec for updates.
 * @since v0.2.0
 */
export function createSignal<T>(
  initialValue: T,
  equals?: EqualityFn<T> | false
): Signal<T> {
  const node = acquireSignalNode<T>();
  node.value = initialValue;
  // 类型转换：将EqualityFn<T>转换为((a: unknown, b: unknown) => boolean)
  node.equals = equals === undefined 
    ? Object.is 
    : equals === false 
      ? false 
      : (equals as (a: unknown, b: unknown) => boolean);

  function signal(arg?: T | ((prev: T) => T)): T | void {
    // Getter: 无参数调用
    if (arguments.length === 0) {
      track(node);
      return node.value;
    }

    // Setter: 有参数调用
    // 性能优化：先检查observers，如果没有observers，使用最快路径
    if (!node.observers) {
      // 最快路径：Pure更新，直接赋值，跳过所有检查
      const newVal = typeof arg === 'function'
        ? (arg as (prev: T) => T)(node.value)
        : arg;
      node.value = newVal as T;
      return;
    }

    // 有observers时才进行完整处理
    const newValue = typeof arg === 'function'
      ? (arg as (prev: T) => T)(node.value)
      : arg;

    // 有observers时才进行相等性检查和版本号更新
    const oldValue = node.value;
    const equalsFn = node.equals;
    
    // 性能优化：快速路径 - 默认使用Object.is，直接内联比较
    // 对于大多数情况（基本类型），使用简单的 === 比较即可
    let shouldUpdate: boolean;
    if (equalsFn === undefined || equalsFn === Object.is) {
      // 优化：内联Object.is逻辑，避免函数调用
      // Object.is(a, b) = (a === b) || (a !== a && b !== b)
      const newVal = newValue as T;
      const isEqual = oldValue === newVal || (oldValue !== oldValue && newVal !== newVal);
      shouldUpdate = !isEqual;
    } else if (equalsFn === false) {
      shouldUpdate = true;  // equals为false时总是更新
    } else {
      shouldUpdate = !equalsFn(oldValue, newValue as T);  // 自定义equals函数
    }

    if (shouldUpdate) {
      node.value = newValue as T;
      node.version = ++globalState.signalVersion;
      trigger(node);
    }
  }

  // 将 setter 逻辑附加到 signal 函数上，作为 .set 方法
  signal.set = (valueOrUpdater: T | ((prev: T) => T)) => {
    // 性能优化：先检查observers，如果没有observers，使用最快路径
    if (!node.observers) {
      // 最快路径：Pure更新，直接赋值，跳过所有检查
      const newVal = typeof valueOrUpdater === 'function'
        ? (valueOrUpdater as (prev: T) => T)(node.value)
        : valueOrUpdater;
      node.value = newVal;
      return;
    }

    // 有observers时才进行完整处理
    const newValue = typeof valueOrUpdater === 'function'
      ? (valueOrUpdater as (prev: T) => T)(node.value)
      : valueOrUpdater;

    // 有observers时才进行相等性检查和版本号更新
    const oldValue = node.value;
    const equalsFn = node.equals;
    
    // 性能优化：快速路径 - 默认使用Object.is，直接内联比较
    // 对于大多数情况（基本类型），使用简单的 === 比较即可
    let shouldUpdate: boolean;
    if (equalsFn === undefined || equalsFn === Object.is) {
      // 优化：内联Object.is逻辑，避免函数调用
      // Object.is(a, b) = (a === b) || (a !== a && b !== b)
      const isEqual = oldValue === newValue || (oldValue !== oldValue && newValue !== newValue);
      shouldUpdate = !isEqual;
    } else if (equalsFn === false) {
      shouldUpdate = true;  // equals为false时总是更新
    } else {
      shouldUpdate = !equalsFn(oldValue, newValue);  // 自定义equals函数
    }

    if (shouldUpdate) {
      node.value = newValue;
      node.version = ++globalState.signalVersion;
      trigger(node);
    }
  };

  return signal as Signal<T>;
}

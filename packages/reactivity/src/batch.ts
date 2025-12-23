import { type ReactiveEffect } from './effect';
import { globalState } from './store';

/**
 * @description 将一个 effect 推入队列。如果在批处理模式下，则安排在下一个微任务中刷新队列；否则，同步执行 effect。
 * @param effect - 要加入队列的 ReactiveEffect。
 * @internal
 */
export function queueJob(effect: ReactiveEffect) {
  if (!globalState.isBatching) {
    // 如果不处于批处理模式，则立即同步运行 effect
    effect.run();
    return;
  }

  // 在批处理模式下，将 effect 添加到队列中以便稍后刷新
  if (!globalState.queue.has(effect)) {
    globalState.queue.add(effect);
    scheduleFlush();
  }
}

/**
 * @description 安排一个微任务来刷新 effect 队列。
 * @internal
 */
function scheduleFlush() {
  if (!globalState.isFlushing && !globalState.isBatching) {
    globalState.isFlushing = true;
    Promise.resolve().then(flushJobs);
  }
}

/**
 * @description 执行队列中的所有 effect。
 * @internal
 */
function flushJobs() {
  globalState.isFlushing = true;
  try {
    globalState.queue.forEach(job => job.run());
  } finally {
    globalState.queue.clear();
    globalState.isFlushing = false;
  }
}

/**
 * @description 将多个状态更新批量处理，以在单个微任务中触发所有相关的副作用。
 * @param fn - 包含多个状态更新的函数。
 * @example
 * const [count, setCount] = createSignal(0);
 * createEffect(() => console.log(count()));
 * batch(() => {
 *   setCount(1);
 *   setCount(2); // effect 只会在批处理结束后运行一次
 * });
 * @performance 通过减少 effect 的重复执行来显著提升性能。
 * @since v0.1.0
 */
export function batch(fn: () => void) {
  const wasBatching = globalState.isBatching;
  globalState.isBatching = true;
  try {
    fn();
  } finally {
    if (!wasBatching) {
      globalState.isBatching = false;
      flushJobs();
    }
  }
}

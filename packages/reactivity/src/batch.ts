import type { ReactiveEffect } from './effect';
import { globalState } from './store';

/**
 * @description 将一个 effect 加入队列，并安排一个微任务来刷新队列。
 * @param effect - 要加入队列的 ReactiveEffect 实例。
 * @since v0.1.0
 */
export function queueJob(effect: ReactiveEffect): void {
  if (!globalState.queue.has(effect)) {
    globalState.queue.add(effect);
    scheduleFlush();
  }
}

/**
 * @description 安排一个微任务来执行队列刷新。
 * @internal
 */
function scheduleFlush(): void {
  if (!globalState.isFlushing && !globalState.isBatching) {
    globalState.isFlushPending = true;
    Promise.resolve().then(flushJobs);
  }
}

/**
 * @description 刷新并执行队列中的所有 effect。
 * @internal
 */
function flushJobs(): void {
  if (!globalState.isFlushPending) {
    return;
  }
  globalState.isFlushPending = false;
  globalState.isFlushing = true;

  try {
    let safeguard = 0;
    while (globalState.queue.size) {
      if (++safeguard > 10000) {
        throw new Error('[LD] flushJobs exceeded max rounds (10000), possible infinite loop');
      }
      const effects = Array.from(globalState.queue);
      globalState.queue.clear();
      for (const effect of effects) {
        effect.run();
      }
    }
  } finally {
    globalState.isFlushing = false;
  }
}

/**
 * @description 将多个状态变更组合成一个“批处理”。
 * @param fn - 包含多个状态变更的函数。
 * @since v0.1.0
 */
export function batch(fn: () => void): void {
  if (globalState.isBatching) {
    fn();
    return;
  }
  globalState.isBatching = true;
  try {
    fn();
  } finally {
    globalState.isBatching = false;
    // 在 batch 结束后，如果队列中有待处理的 effect，则安排一次刷新。
    if (globalState.queue.size > 0) {
      scheduleFlush();
    }
  }
}

/**
 * @description 在非浏览器环境等待所有调度任务完成。
 * 返回一个 resolved 的 Promise，相当于等待下一个微任务 tick。
 */
export async function waitForJobs(): Promise<void> {
  return Promise.resolve();
}

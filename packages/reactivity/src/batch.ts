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
 * @description 安排刷新队列。当前实现保持同步刷新模型，以获得最低延迟。
 * 对于基准和测试场景，这意味着 `flushJobs` 会立即执行。
 */
function scheduleFlush(): void {
  // 任何时候只创建一次 Promise，用于外部 await（基准脚本 / 测试）
  if (!globalState.jobDonePromise) {
    globalState.jobDonePromise = new Promise(resolve => {
      globalState.resolveJobDone = resolve;
    });
  }

  if (!globalState.isFlushing && !globalState.isBatching) {
    flushJobs();
  }
}

/**
 * @description 刷新并执行队列中的所有 effect。
 * 采用“快照 + while 循环”策略，确保在 flush 过程中新入队的 effect 将在下一轮执行，避免无限循环。
 */
function flushJobs(): void {
  globalState.isFlushPending = false;
  globalState.isFlushing = true;

  try {
    let safeguard = 0; // 防御性上限，避免逻辑错误导致死循环
    const MAX_FLUSH_ROUNDS = 10_000;

    while (globalState.queue.size) {
      if (++safeguard > MAX_FLUSH_ROUNDS) {
        console.error('[LD] flushJobs exceeded max rounds, possible infinite loop');
        break;
      }

      // 快照当前队列并立即清空，防止运行过程中再次 track 进入的 effect 被本轮重复执行
      const effects = Array.from(globalState.queue);
      globalState.queue.clear();

      for (const effect of effects) {
        effect.run();
      }
    }
  } finally {
    globalState.isFlushing = false;
    if (globalState.resolveJobDone) {
      globalState.resolveJobDone();
      globalState.jobDonePromise = null;
      globalState.resolveJobDone = null;
    }
  }
}

/**
 * @description 批量更新：把多次 state 更新合并为一次 flush。
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
    if (globalState.queue.size > 0) {
      flushJobs();
    }
  }
}

/**
 * @description 在非浏览器环境等待所有调度任务完成（基准 / 测试专用）。
 */
export async function waitForJobs(): Promise<void> {
  if (globalState.isFlushing) {
    await Promise.resolve();
  }
  if (globalState.jobDonePromise) {
    await globalState.jobDonePromise;
  }
}

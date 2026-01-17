import type { ReactiveEffect } from './effect';

// ==================================================================================================
// Signal 节点定义 (Signal Node Definition)
// ==================================================================================================

/**
 * @internal
 * @description Signal 节点的内部结构，用于对象池复用。
 * @remarks
 * 我们使用单向链表来管理观察者（ReactiveEffect），避免 Map/Set 带来的额外开销。
 */
export interface SignalNode<T = unknown> {
  /** 当前信号的值 */
  value: T;
  /** 观察该信号的 effect 链表头 */
  observers: ReactiveEffect | null;
  /** 对象池中指向下一个空闲节点的指针 */
  next: SignalNode<T> | null;
  /** 版本号，用于实现极速的 setter */
  version: number;
  /** 相等性比较函数，用于判断值是否改变。如果为false，则总是触发更新。如果为undefined，使用Object.is */
  equals?: ((a: unknown, b: unknown) => boolean) | false | undefined;
}

// ==================================================================================================
// 全局状态 (Global State)
// ==================================================================================================

/**
 * @description LD 框架的内部全局状态存储。
 * @internal
 * @remarks
 * `globalState` 是框架唯一的全局状态源，负责：
 * 1. 调度中心：管理所有响应式更新的调度，包括 effect 队列和各种调度标志。
 * 2. 全局缓存：存储整个应用共享的缓存，如响应式代理缓存、对象池等。
 * 严禁在此之外的任何模块使用文件作用域变量来存储全局状态。
 */
export const globalState = {
  /** 用于批量处理的 effect 队列 */
  queue: new Set<ReactiveEffect>(),

  /** 缓存已创建的响应式代理，确保同一个对象只代理一次 */
  reactiveMap: new WeakMap<object, unknown>(),

  /** 调度器是否正在刷新队列的标志，防止重入 */
  isFlushing: false,

  /** 当前是否处于批量更新模式 */
  isBatching: false,

  /** 是否已经调度了一个微任务用于刷新队列 */
  isFlushPending: false,

  /** 全局 effect 调用栈，用于处理嵌套 effect */
  effectStack: [] as ReactiveEffect[],

  /** 用于通知所有待处理任务完成的 Promise 及其 resolver */
  jobDonePromise: null as Promise<void> | null,
  resolveJobDone: null as (() => void) | null,

  // --- 对象池相关 ----------------------------------------------------

  /** Signal 节点对象池的空闲链表头 */
  signalNodePool: null as SignalNode | null,

  /** 为 ReactiveEffect 分配唯一 ID 的计数器 */
  effectIdCounter: 0,

  /** 为 ComponentInstance 分配唯一 ID 的计数器 */
  componentUidCounter: 0,

  /** 全局信号版本计数器 */
  signalVersion: 0,
};

// ==================================================================================================
// 实例状态 (Instance State)
// ==================================================================================================

/**
 * @description 创建一个实例范围的状态存储。
 * @internal
 * @returns 一个隔离的实例状态容器。
 */
export function createInstanceStore(): { scope: Map<string, unknown> } {
  return {
    /** 存储实例私有状态的 Map */
    scope: new Map<string, unknown>(),
  };
}

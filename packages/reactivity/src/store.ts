import type { ReactiveEffect } from './effect';

// ==================================================================================================
// 全局状态 (Global State)
// ==================================================================================================

/**
 * @description LD 框架的内部全局状态存储。
 * @internal
 * @remarks
 * `globalState` 是框架唯一的全局状态源，主要负责两件事：
 * 1. **调度中心**：管理所有响应式更新的调度，包括 effect 队列和各种调度标志。
 * 2. **全局缓存**：存储整个应用共享的缓存，如响应式代理的缓存。
 * 严禁在此之外的任何模块中使用文件作用域的变量来存储全局状态。
 */
export const globalState = {
  /**
   * @description 用于批量处理的 effect 队列。所有待处理的 effect 更新都会被放入此队列。
   * @type {Set<ReactiveEffect>}
   */
  queue: new Set<ReactiveEffect>(),

  /**
   * @description 用于缓存已创建的响应式代理的 WeakMap，确保同一个原始对象只会被代理一次。
   * @type {WeakMap<object, any>}
   */
  reactiveMap: new WeakMap<object, any>(),

  /**
   * @description 调度器是否正在刷新队列的标志，用于防止重入刷新。
   * @type {boolean}
   */
  isFlushing: false,

  /**
   * @description 当前是否处于批量更新模式的标志。
   * @type {boolean}
   */
  isBatching: false,

  /**
   * @description 标志，表示一个微任务刷新是否已在计划中。
   * @type {boolean}
   */
  isFlushPending: false,
};

// ==================================================================================================
// 实例状态 (Instance State)
// ==================================================================================================

/**
 * @description 创建一个实例范围的状态存储。
 * @internal
 * @remarks
 * 此函数用于创建与特定上下文（如一个组件实例）绑定的独立状态容器。
 * 这确保了不同实例之间的状态隔离，是实现组件化系统的基础。
 * 所有非全局、与特定实例相关的状态都应通过此函数创建。
 * @returns 一个包含实例状态的对象。
 * @example
 * // 在未来的组件 setup 函数中可能会这样使用：
 * function setup() {
 *   const instanceState = createInstanceStore();
 *   // ... 使用 instanceState 存储该组件实例的私有状态
 * }
 */
export function createInstanceStore() {
  return {
    /**
     * @description 用于存储此实例范围内的私有响应式状态或其他数据。
     * @type {Map<string, any>}
     */
    scope: new Map<string, any>(),
    // 以后可以在这里添加与特定组件实例相关的其他状态，例如：
    // props: {},
    // effects: [],
  };
}

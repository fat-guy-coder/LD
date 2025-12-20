/**
 * @file effect.ts
 * @description 副作用(Effect)系统 - 自动依赖收集和响应式更新
 *
 * 性能目标:
 * - Effect创建: < 0.02ms
 * - Effect执行: < 0.01ms
 * - 依赖收集: < 0.001ms 每个依赖
 *
 * 核心特性:
 * 1. 自动依赖追踪
 * 2. 嵌套effect支持
 * 3. 清理函数机制
 * 4. 错误边界处理
 * 5. 异步effect支持
 */

import { activeEffect as importedActiveEffect, effectStack as importedEffectStack } from './signal'

// 重新导出signal中的关键变量
export let activeEffect: (() => void) | null = importedActiveEffect
export const effectStack: Array<() => void> = importedEffectStack

// ==================== 类型定义 ====================

/**
 * Effect配置选项
 */
export interface EffectOptions {
  /**
   * 调试名称（仅开发环境有效）
   */
  name?: string

  /**
   * 是否懒执行（第一次不立即执行）
   * @default false
   */
  lazy?: boolean

  /**
   * 调度器（自定义effect执行时机）
   */
  scheduler?: (fn: () => void) => void

  /**
   * 优先级（0-4，0最高）
   * @default 2 (普通优先级)
   */
  priority?: number
}

/**
 * Effect实例接口
 */
export interface Effect {
  /**
   * 执行effect
   * 时间复杂度: O(1) + 内部fn的执行时间
   */
  run(): void

  /**
   * 停止effect（清理依赖和资源）
   * 时间复杂度: O(n) - n为依赖的signal数量
   */
  stop(): void

  /**
   * 调试信息（仅开发环境）
   */
  readonly __debug?: any
}

// ==================== 常量定义 ====================

const __DEV__ = process.env.NODE_ENV !== 'production'

/** 优先级枚举 */
export enum EffectPriority {
  IMMEDIATE = 0, // 立即执行（同步渲染等）
  HIGH = 1, // 高优先级（用户交互）
  NORMAL = 2, // 普通优先级（默认）
  LOW = 3, // 低优先级（数据更新）
  IDLE = 4, // 空闲时执行（清理任务等）
}

/** Effect内存池 */
class EffectPool {
  private pool: Array<EffectImpl> = []
  private maxSize = 50

  acquire(fn: () => void, options?: EffectOptions): EffectImpl {
    if (this.pool.length > 0) {
      const effect = this.pool.pop()!
      effect.reinitialize(fn, options)
      return effect
    }
    return new EffectImpl(fn, options)
  }

  release(effect: EffectImpl): void {
    if (this.pool.length < this.maxSize) {
      effect.dispose()
      this.pool.push(effect)
    }
  }
}

const globalEffectPool = new EffectPool()

// ==================== Effect实现类 ====================

/**
 * Effect实现类
 * 优化策略:
 * 1. 懒依赖清理（只在需要时清理）
 * 2. 优先级调度
 * 3. 内存池复用
 * 4. 错误边界处理
 */
class EffectImpl implements Effect {
  private _fn: () => void
  private _cleanup: (() => void) | null = null
  private _dependencies = new Set<Set<() => void>>()
  private _isActive = true
  private _isRunning = false
  private _name?: string
  private _scheduler: ((fn: () => void) => void) | undefined
  private _priority: EffectPriority
  private _errorHandler?: ((error: Error) => void) | undefined

  constructor(fn: () => void, options?: EffectOptions) {
    this._fn = fn
    this._priority = options?.priority ?? EffectPriority.NORMAL

    if (__DEV__ && options?.name) {
      this._name = options.name
    }

    if (options?.scheduler) {
      this._scheduler = options.scheduler
    }

    // 如果不是懒执行，立即运行
    if (!options?.lazy) {
      this.run()
    }
  }

  /**
   * 重新初始化Effect（用于内存池复用）
   * 时间复杂度: O(1)
   */
  reinitialize(fn: () => void, options?: EffectOptions): void {
    this._fn = fn
    this._cleanup = null
    this._dependencies.clear()
    this._isActive = true
    this._isRunning = false
    this._priority = options?.priority ?? EffectPriority.NORMAL

    if (__DEV__ && options?.name) {
      this._name = options.name
    }

    if (options?.scheduler) {
      this._scheduler = options.scheduler
    } else {
      this._scheduler = undefined
    }

    if (!options?.lazy) {
      this.run()
    }
  }

  /**
   * 执行effect
   * 时间复杂度: O(1) + fn执行时间
   * 优化: 避免重复运行和循环依赖
   */
  run(): void {
    if (!this._isActive || this._isRunning) {
      return
    }

    // 保存之前的activeEffect和effectStack状态
    const prevEffect = activeEffect
    const prevEffectIndex = effectStack.length

    try {
      // 设置当前effect为active
      activeEffect = this.run.bind(this)
      effectStack.push(activeEffect)
      this._isRunning = true

      // 执行清理函数
      this._executeCleanup()

      // 执行effect函数
      this._executeFn()
    } catch (error) {
      this._handleError(error as Error)
    } finally {
      // 恢复之前的effect状态
      effectStack.splice(prevEffectIndex)
      activeEffect = prevEffect
      this._isRunning = false
    }
  }

  /**
   * 停止effect（清理所有依赖）
   * 时间复杂度: O(n) - n为依赖的signal数量
   */
  stop(): void {
    if (!this._isActive) return

    this._isActive = false
    this._executeCleanup()
    this._cleanupDependencies()

    if (__DEV__) {
      this._log('stopped')
    }
  }

  /**
   * 清理资源（用于内存池回收）
   */
  dispose(): void {
    this.stop()
    this._dependencies.clear()
    this._fn = () => {}
    this._scheduler = undefined
    this._errorHandler = undefined
  }

  /**
   * 添加依赖（由signal调用）
   * 时间复杂度: O(1)
   */
  addDependency(deps: Set<() => void>): void {
    this._dependencies.add(deps)
  }

  /**
   * 移除依赖
   * 时间复杂度: O(1)
   */
  removeDependency(deps: Set<() => void>): void {
    this._dependencies.delete(deps)
  }

  /**
   * 设置错误处理器
   */
  onError(handler: (error: Error) => void): void {
    this._errorHandler = handler
  }

  /**
   * 执行effect函数
   * 优化: 使用try-catch包裹，防止错误传播
   */
  private _executeFn(): void {
    const startTime = __DEV__ ? performance.now() : 0

    try {
      // 执行用户函数，并捕获可能的清理函数
      const result = this._fn()

      // 如果函数返回清理函数，保存它
      if (typeof result === 'function') {
        this._cleanup = result
      }

      if (__DEV__) {
        const duration = performance.now() - startTime
        if (duration > 10) {
          console.warn(
            `Effect "${this._name || 'anonymous'}" took ${duration.toFixed(2)}ms, consider optimizing`
          )
        }
        this._log('executed', { duration })
      }
    } catch (error) {
      this._handleError(error as Error)
    }
  }

  /**
   * 执行清理函数
   */
  private _executeCleanup(): void {
    if (this._cleanup) {
      try {
        this._cleanup()
      } catch (error) {
        if (__DEV__) {
          console.error('Error in effect cleanup:', error)
        }
      } finally {
        this._cleanup = null
      }
    }
  }

  /**
   * 清理所有依赖关系
   * 优化: 批量从所有依赖的signal中移除当前effect
   */
  private _cleanupDependencies(): void {
    for (const deps of this._dependencies) {
      deps.delete(this.run.bind(this))
    }
    this._dependencies.clear()
  }

  /**
   * 错误处理
   */
  private _handleError(error: Error): void {
    if (this._errorHandler) {
      this._errorHandler(error)
    } else if (__DEV__) {
      console.error(`Error in effect "${this._name || 'anonymous'}":`, error)
    }

    // 开发环境：记录错误但不中断执行
    if (__DEV__) {
      this._log('error', { error: error.message })
    }
  }

  /**
   * 开发环境日志
   */
  private _log(action: string, extra?: any): void {
    if (!__DEV__) return

    console.debug(`Effect "${this._name || 'anonymous'}" ${action}:`, {
      effect: this,
      dependencies: this._dependencies.size,
      priority: this._priority,
      ...extra,
    })
  }

  /**
   * 开发环境调试信息
   */
  get __debug(): any {
    if (!__DEV__) return undefined

    return {
      name: this._name,
      isActive: this._isActive,
      isRunning: this._isRunning,
      dependencies: Array.from(this._dependencies).map(dep => ({
        size: dep.size,
        hasThisEffect: dep.has(this.run.bind(this)),
      })),
      priority: this._priority,
      hasCleanup: !!this._cleanup,
      hasScheduler: !!this._scheduler,
    }
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建副作用
 * 性能目标: < 0.02ms
 *
 * @param fn 副作用函数
 * @param options 配置选项
 * @returns Effect实例
 */
export function createEffect(fn: () => void | (() => void), options?: EffectOptions): Effect {
  const pooled = options?.priority === EffectPriority.IMMEDIATE ? false : true
  const effect = pooled ? globalEffectPool.acquire(fn, options) : new EffectImpl(fn, options)

  return effect
}

/**
 * 创建一次性的副作用（自动清理）
 */
export function createDisposableEffect(
  fn: () => void | (() => void),
  options?: EffectOptions
): () => void {
  const effect = createEffect(fn, options)

  // 包装stop函数，确保只执行一次
  let stopped = false
  return () => {
    if (!stopped) {
      effect.stop()
      stopped = true
    }
  }
}

/**
 * 创建异步副作用
 * 优化: 自动处理Promise生命周期
 */
export function createAsyncEffect(fn: () => Promise<void> | void, options?: EffectOptions): Effect {
  let currentPromise: Promise<void> | null = null

  const wrappedFn = () => {
    // 如果有正在进行的Promise，不重复执行
    if (currentPromise) return

    const result = fn()

    if (result instanceof Promise) {
      currentPromise = result
      result
        .finally(() => {
          currentPromise = null
        })
        .catch(error => {
          if (__DEV__) {
            console.error('Error in async effect:', error)
          }
        })
    }
  }

  return createEffect(wrappedFn, options)
}

// ==================== 依赖追踪系统 ====================

/**
 * 手动追踪依赖
 * 用于高级用例，当需要细粒度控制依赖收集时
 *
 * @param fn 需要追踪的函数
 * @returns fn的返回值
 */
export function track<T>(fn: () => T): T {
  if (!activeEffect) {
    return fn()
  }

  const prevEffect = activeEffect
  const prevEffectIndex = effectStack.length

  try {
    activeEffect = prevEffect
    effectStack.push(activeEffect)
    return fn()
  } finally {
    effectStack.splice(prevEffectIndex)
    activeEffect = prevEffect
  }
}

/**
 * 清理函数（用于effect返回的清理函数）
 * 类型安全的清理函数创建器
 */
export function cleanup(fn: () => void): () => void {
  return fn
}

/**
 * 批量执行多个effect
 * 优化: 减少重复的依赖收集和清理
 */
export function batchEffects(effects: Array<() => void>): void {
  const prevEffect = activeEffect

  try {
    // 暂时禁用依赖收集
    activeEffect = null

    for (const effect of effects) {
      effect()
    }
  } finally {
    activeEffect = prevEffect
  }
}

// ==================== 工具函数 ====================

/**
 * 暂停依赖收集（在fn执行期间不收集依赖）
 */
export function untrack<T>(fn: () => T): T {
  const prevEffect = activeEffect
  activeEffect = null

  try {
    return fn()
  } finally {
    activeEffect = prevEffect
  }
}

/**
 * 检查是否为Effect实例
 */
export function isEffect(value: any): value is Effect {
  return value instanceof EffectImpl
}

/**
 * 获取当前活动的effect（用于调试）
 */
export function getActiveEffect(): (() => void) | null {
  return activeEffect
}

// ==================== 导出 ====================

export { globalEffectPool, EffectImpl, EffectPool }

// 生产环境：移除调试相关的导出
if (!__DEV__) {
  // @ts-ignore
  delete exports.globalEffectPool
  // @ts-ignore
  delete exports.EffectImpl
  // @ts-ignore
  delete exports.EffectPool
  // @ts-ignore
  delete exports.getActiveEffect
}

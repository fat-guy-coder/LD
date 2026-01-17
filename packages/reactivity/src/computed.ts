import { ReactiveEffect, track, trigger } from './effect';
import { globalState } from './store';
import type { SignalNode } from './store';
import type { EqualityFn } from './types';

/**
 * @description 计算属性的内部实现类。
 * @template T
 * @internal
 */
class ComputedImpl<T> {
  public readonly effect: ReactiveEffect<T>;
  private readonly node: SignalNode<void> = { value: undefined, observers: null, next: null, version: 0 };
  private _value!: T;
  private _isInitialized = false;

  constructor(getter: () => T, private readonly equals: EqualityFn<T> | false) {
    // 创建effect但不立即运行，实现真正的惰性求值
    // 使用null scheduler避免自动加入队列，手动控制执行时机
    this.effect = new ReactiveEffect(getter, null, false);
    // 设置自定义scheduler，当依赖变化时触发
    this.effect.scheduler = () => {
      trigger(this.node);
    };
  }

  /**
   * @description 获取计算属性的值。
   * effect.run() 内部的版本检查会自动处理是否需要重新计算。
   */
  get value(): T {
    track(this.node);
    
    // 惰性初始化：第一次访问时才计算并建立依赖关系
    if (!this._isInitialized) {
      // 使用effect.run()来建立依赖关系
      // 由于effect在创建时没有运行，deps.size为0，isDirty()会返回true
      // 所以第一次会执行getter并建立依赖
      this._value = this.effect.run();
      this._isInitialized = true;
      this.node.version = ++globalState.signalVersion;
      return this._value;
    }
    
    // 后续访问：检查是否需要重新计算
    // 如果没有依赖（deps.size === 0），直接返回缓存值
    if (this.effect.deps.size === 0) {
      return this._value;
    }
    
    // 有依赖时，使用effect.run()检查是否需要重新计算
    // effect.run()会检查isDirty()，如果依赖没有变化，直接返回缓存值
    const newValue = this.effect.run();
    // 仅在值实际改变时才更新并递增版本号
    if (this.equals === false ? true : !this.equals(this._value, newValue)) {
        this._value = newValue;
        this.node.version = ++globalState.signalVersion;
    }
    return this._value;
  }
}

/**
 * @description 创建一个只读的计算属性，其值是根据getter函数动态计算的。
 * @template T
 * @param getter - 用于计算值的函数。
 * @param equals - 可选的自定义相等函数，用于确定值是否已更改。默认为Object.is。
 * @returns 一个包含 `value` 属性的对象，该属性为只读的计算结果。
 * @example
 * const count = createSignal(1);
 * const double = createComputed(() => count() * 2);
 * console.log(double.value); // 2
 * setCount(2);
 * console.log(double.value); // 4
 * @performance 惰性求值，只有在访问时且依赖项已更改时才重新计算。
 * @since v0.1.0
 */
export function createComputed<T>(getter: () => T, equals: EqualityFn<T> | false = Object.is): { readonly value: T } {
  return new ComputedImpl(getter, equals);
}

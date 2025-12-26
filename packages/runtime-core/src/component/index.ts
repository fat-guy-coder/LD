import { createInstanceStore } from '@ld/reactivity';
import type { ReactiveEffect } from '@ld/reactivity';

// ==================================================================================================
// 类型定义 (Type Definitions)
// ==================================================================================================

/**
 * @description 定义一个组件的公共接口。
 * @public
 * @since v0.1.0
 */
export interface Component {
  /**
   * @description 组件的 setup 函数，用于定义组件的响应式状态和逻辑。
   * @param props - 组件接收的属性。
   * @param context - 组件上下文，未来可用于暴露 emit, slots 等。
   * @returns 一个对象，其属性将作为渲染上下文。
   */
  setup: (props: Record<string, any>, context: any) => Record<string, any>;
  /**
   * @description 组件的渲染函数。
   * @param ctx - 渲染上下文，通常是 setup 函数的返回值。
   * @returns 描述UI的结构，对于VDOM渲染器，这是一个VNode。
   */
  render?: (ctx: any) => any;
}

/**
 * @description 代表一个组件在运行时的实例。
 * @internal
 * @since v0.1.0
 */
export interface ComponentInstance {
  uid: number;
  component: Component;
  props: Record<string, any>;
  state: Record<string, any>; // 由 setup 返回的响应式状态
  instanceStore: ReturnType<typeof createInstanceStore>; // 实例独有的状态容器
  isMounted: boolean;
  subTree: any; // VDOM-renderer specific, using 'any' to avoid circular deps
  effect: ReactiveEffect | null; // The render effect for this component
  // 生命周期钩子队列
  onMount: (() => void)[];
  onUpdate: (() => void)[];
  onUnmount: (() => void)[];
}

// ==================================================================================================
// 实例创建 (Instance Creation)
// ==================================================================================================

let uidCounter = 0;

/**
 * @description 创建一个组件实例。
 * @param component - 组件定义对象。
 * @param props - 传递给组件的属性。
 * @returns 一个组件实例对象。
 * @internal
 * @since v0.1.0
 */
export function createComponentInstance(component: Component, props: Record<string, any>): ComponentInstance {
  const instance: ComponentInstance = {
    uid: uidCounter++,
    component,
    props,
    state: {},
    instanceStore: createInstanceStore(),
    isMounted: false,
    subTree: null,
    effect: null,
    onMount: [],
    onUpdate: [],
    onUnmount: [],
  };

  // 设置当前实例，以便生命周期钩子能够正确注册
  setCurrentInstance(instance);

  // 调用 setup 函数来获取响应式状态
  // TODO: props 应该被转换为响应式的
  const setupContext = {}; // 未来会包含 emit, slots 等
  instance.state = component.setup(props, setupContext) || {};

  // 重置当前实例
  setCurrentInstance(null);

  return instance;
}

// ==================================================================================================
// 生命周期钩子 (Lifecycle Hooks)
// ==================================================================================================

/**
 * @description 当前正在被设置的组件实例。
 * @internal
 */
let currentInstance: ComponentInstance | null = null;

/**
 * @description 设置当前组件实例，仅在内部调用。
 * @internal
 */
const setCurrentInstance = (instance: ComponentInstance | null) => {
  currentInstance = instance;
};

/**
 * @description 注册一个在组件挂载后调用的回调函数。
 * @param fn - 要执行的回调函数。
 * @public
 * @since v0.1.0
 */
export function onMount(fn: () => void): void {
  if (currentInstance) {
    currentInstance.onMount.push(fn);
  } else {
    console.warn('onMount must be called within a component setup function.');
  }
}

/**
 * @description 注册一个在组件更新后调用的回调函数。
 * @param fn - 要执行的回调函数。
 * @public
 * @since v0.1.0
 */
export function onUpdate(fn: () => void): void {
  if (currentInstance) {
    currentInstance.onUpdate.push(fn);
  } else {
    console.warn('onUpdate must be called within a component setup function.');
  }
}

/**
 * @description 注册一个在组件卸载前调用的回调函数。
 * @param fn - 要执行的回调函数。
 * @public
 * @since v0.1.0
 */
export function onUnmount(fn: () => void): void {
  if (currentInstance) {
    currentInstance.onUnmount.push(fn);
  } else {
    console.warn('onUnmount must be called within a component setup function.');
  }
}

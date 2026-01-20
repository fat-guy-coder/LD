/**
 * @description LD框架类型定义文件
 * 提供Vue3和React Hooks的完整类型定义，底层转发到LD实现
 * 开发者可以无缝使用Vue3和React语法，但实际运行的是LD框架
 */

// JSX 运行时声明
declare module 'ld/jsx-runtime' {
  export function jsx(type: any, props: any, key?: any): any
  export function jsxs(type: any, props: any, key?: any): any
  export function Fragment(props: { children?: any }): any
}

// ============================================================================
// Vue3 Composition API 类型定义
// ============================================================================

export interface Ref<T> {
  value: T
}

export type UnwrapRef<T> = T extends Ref<infer V> ? UnwrapRef<V> : T

export interface ComputedRef<T = any> extends Ref<T> {
  readonly value: T
}

export interface WatchOptions {
  immediate?: boolean
  deep?: boolean
  flush?: 'pre' | 'post' | 'sync'
}

// ============================================================================
// React Hooks API 类型定义
// ============================================================================

export type Dispatch<A> = (value: A) => void
export type SetStateAction<S> = S | ((prevState: S) => S)
export type DependencyList = ReadonlyArray<any>
export type EffectCallback = () => void | (() => void)

export interface MutableRefObject<T> {
  current: T
}

export interface RefObject<T> {
  readonly current: T | null
}

export interface Context<T> {
  Provider: React.Provider<T>
  Consumer: React.Consumer<T>
  displayName?: string
}

export type Reducer<S, A> = (prevState: S, action: A) => S
export type DispatchReducer<A> = (action: A) => void

export interface TransitionStartFunction {
  (callback: () => void): void
}

export interface StoreSubscribe<Snapshot> {
  (onStoreChange: () => void): () => void
}

export interface StoreGetSnapshot<Snapshot> {
  (): Snapshot
}

// ============================================================================
// React JSX 类型定义
// ============================================================================

declare namespace React {
  type ElementType = any
  type Element = any
  type ReactNode = any
  type ReactElement = any
  type ComponentType<P = {}> = any
  type FunctionComponent<P = {}> = (props: P) => ReactElement | null
  type Component<P = {}, S = {}> = any
  type Ref<T> = any
  type Provider<T> = any
  type Consumer<T> = any

  interface HTMLAttributes<T> extends DOMAttributes<T> {
    [key: string]: any
  }

  interface DOMAttributes<T> {
    [key: string]: any
  }

  interface Attributes {
    key?: any
  }

  interface ClassAttributes<T> extends Attributes {
    ref?: Ref<T>
  }

  interface ComponentClass<P = {}, S = {}> {
    new (props: P, context?: any): Component<P, S>
  }
}

// ============================================================================
// React 事件类型
// ============================================================================

export interface SyntheticEvent<T = Element, E = Event> {
  currentTarget: EventTarget & T
  target: EventTarget & T
  bubbles: boolean
  cancelable: boolean
  defaultPrevented: boolean
  eventPhase: number
  isTrusted: boolean
  nativeEvent: E
  preventDefault(): void
  isDefaultPrevented(): boolean
  stopPropagation(): void
  isPropagationStopped(): boolean
  persist(): void
  timeStamp: number
  type: string
}

export interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
  target: EventTarget & T
}

export interface KeyboardEvent<T = Element> extends SyntheticEvent<T, KeyboardEventInit> {
  altKey: boolean
  charCode: number
  ctrlKey: boolean
  code: string
  key: string
  keyCode: number
  locale: string
  location: number
  metaKey: boolean
  repeat: boolean
  shiftKey: boolean
  getModifierState(key: string): boolean
}

export interface MouseEvent<T = Element> extends SyntheticEvent<T, MouseEventInit> {
  altKey: boolean
  button: number
  buttons: number
  clientX: number
  clientY: number
  ctrlKey: boolean
  getModifierState(key: string): boolean
  metaKey: boolean
  movementX: number
  movementY: number
  pageX: number
  pageY: number
  relatedTarget: EventTarget | null
  screenX: number
  screenY: number
  shiftKey: boolean
}

export interface FocusEvent<T = Element> extends SyntheticEvent<T, FocusEventInit> {
  relatedTarget: EventTarget | null
}

export interface FormEvent<T = Element> extends SyntheticEvent<T> {}

export interface TouchEvent<T = Element> extends SyntheticEvent<T, TouchEventInit> {
  altKey: boolean
  changedTouches: TouchList
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  targetTouches: TouchList
  touches: TouchList
  getModifierState(key: string): boolean
}

export interface WheelEvent<T = Element> extends MouseEvent<T, WheelEventInit> {
  deltaMode: number
  deltaX: number
  deltaY: number
  deltaZ: number
}

export interface AnimationEvent<T = Element> extends SyntheticEvent<T, AnimationEventInit> {
  animationName: string
  elapsedTime: number
  pseudoElement: string
}

export interface TransitionEvent<T = Element> extends SyntheticEvent<T, TransitionEventInit> {
  elapsedTime: number
  propertyName: string
  pseudoElement: string
}

// ============================================================================
// 模块声明：让 TypeScript 知道 'ld' 模块存在
// ============================================================================

declare module 'ld' {
  // Vue3 Composition API
  export function ref<T>(value: T): Ref<T>
  export function ref<T = any>(): Ref<T | undefined>
  export function reactive<T extends object>(target: T): T
  export function computed<T>(getter: () => T): ComputedRef<T>
  export function computed<T>(options: {
    get: () => T
    set?: (value: T) => void
  }): ComputedRef<T>
  export function watch<T>(
    source: () => T,
    callback: (newValue: T, oldValue: T) => void,
    options?: WatchOptions
  ): () => void
  export function watch<T>(
    source: Ref<T>,
    callback: (newValue: T, oldValue: T) => void,
    options?: WatchOptions
  ): () => void
  export function watch<T extends object>(
    source: T,
    callback: (newValue: T, oldValue: T) => void,
    options?: WatchOptions
  ): () => void
  export function watchEffect(
    effect: () => void,
    options?: WatchOptions
  ): () => void
  export function onMounted(hook: () => void): void
  export function onUpdated(hook: () => void): void
  export function onUnmounted(hook: () => void): void
  export function onBeforeMount(hook: () => void): void
  export function onBeforeUpdate(hook: () => void): void
  export function onBeforeUnmount(hook: () => void): void
  export function readonly<T>(target: T): T
  export function toRef<T extends object, K extends keyof T>(
    object: T,
    key: K
  ): Ref<T[K]>
  export function toRefs<T extends object>(
    object: T
  ): { [K in keyof T]: Ref<T[K]> }
  export function unref<T>(ref: T | Ref<T>): T
  export function isRef<T>(value: any): value is Ref<T>
  export function toRaw<T>(observed: T): T
  export function markRaw<T extends object>(value: T): T

  // React Hooks API
  export function useState<S>(
    initialState: S | (() => S)
  ): [S, Dispatch<SetStateAction<S>>]
  export function useState<S = undefined>(): [
    S | undefined,
    Dispatch<SetStateAction<S | undefined>>
  ]
  export function useEffect(
    effect: EffectCallback,
    deps?: DependencyList
  ): void
  export function useMemo<T>(
    factory: () => T,
    deps: DependencyList
  ): T
  export function useCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: DependencyList
  ): T
  export function useRef<T>(initialValue: T): MutableRefObject<T>
  export function useRef<T>(initialValue: T | null): RefObject<T>
  export function useRef<T = undefined>(): MutableRefObject<T | undefined>
  export function useContext<T>(context: Context<T>): T
  export function useReducer<S, A>(
    reducer: Reducer<S, A>,
    initialState: S
  ): [S, DispatchReducer<A>]
  export function useLayoutEffect(
    effect: EffectCallback,
    deps?: DependencyList
  ): void
  export function useTransition(): [boolean, TransitionStartFunction]
  export function useDeferredValue<T>(value: T): T
  export function useSyncExternalStore<Snapshot>(
    subscribe: StoreSubscribe<Snapshot>,
    getSnapshot: StoreGetSnapshot<Snapshot>
  ): Snapshot

  // React 命名空间（用于 JSX）
  export namespace React {
    type ElementType = any
    type Element = any
    type ReactNode = any
    type ReactElement = any
    type ComponentType<P = {}> = any
    type FunctionComponent<P = {}> = (props: P) => ReactElement | null
    type Component<P = {}, S = {}> = any
    type Ref<T> = any
    type Provider<T> = any
    type Consumer<T> = any
  }

  // 类型导出
  export type {
    Ref,
    ComputedRef,
    WatchOptions,
    UnwrapRef,
    Dispatch,
    SetStateAction,
    DependencyList,
    EffectCallback,
    MutableRefObject,
    RefObject,
    Context,
    Reducer,
    DispatchReducer,
    TransitionStartFunction,
    StoreSubscribe,
    StoreGetSnapshot,
    ChangeEvent,
    SyntheticEvent,
    KeyboardEvent,
    MouseEvent,
    FocusEvent,
    FormEvent,
    TouchEvent,
    WheelEvent,
    AnimationEvent,
    TransitionEvent,
  }
}

// ============================================================================
// 全局类型声明（用于 JSX）
// ============================================================================

declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> {}
    interface ElementClass extends React.Component<any> {}
    interface ElementAttributesProperty {
      props: {}
    }
    interface ElementChildrenAttribute {
      children: {}
    }
    interface IntrinsicAttributes extends React.Attributes {}
    interface IntrinsicClassAttributes<T> extends React.ClassAttributes<T> {}
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }

  // 全局 React 命名空间（用于 JSX，无需导入）
  namespace React {
    type ElementType = any
    type Element = any
    type ReactNode = any
    type ReactElement = any
    type ComponentType<P = {}> = any
    type FunctionComponent<P = {}> = (props: P) => ReactElement | null
    type Component<P = {}, S = {}> = any
    type Ref<T> = any
    type Provider<T> = any
    type Consumer<T> = any

    interface HTMLAttributes<T> extends DOMAttributes<T> {
      [key: string]: any
    }

    interface DOMAttributes<T> {
      [key: string]: any
    }

    interface Attributes {
      key?: any
    }

    interface ClassAttributes<T> extends Attributes {
      ref?: Ref<T>
    }

    interface ComponentClass<P = {}, S = {}> {
      new (props: P, context?: any): Component<P, S>
    }
  }
}

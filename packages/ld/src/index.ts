/**
 * @description LD框架主入口
 * 提供Vue3和React Hooks兼容API，底层转发到LD Signal实现
 * 
 * 注意：这是类型定义占位符，实际实现会在编译时替换
 */

// 从 @ld/reactivity 导入实际实现
import {
  createSignal,
  createComputed,
  createEffect,
  createReactive,
} from '@ld/reactivity'

// Vue3 Composition API 兼容层
export function ref<T>(value: T) {
  const [get, set] = createSignal(value)
  return {
    get value() {
      return get()
    },
    set value(newValue: T) {
      set(newValue)
    }
  }
}

export function reactive<T extends object>(target: T): T {
  return createReactive(target) as T
}

export function computed<T>(getter: () => T) {
  const computed = createComputed(getter)
  return {
    get value() {
      return computed()
    }
  }
}

export function watch<T>(
  source: (() => T) | { value: T },
  callback: (newValue: T, oldValue: T) => void,
  options?: { immediate?: boolean; deep?: boolean; flush?: 'pre' | 'post' | 'sync' }
) {
  const getter = typeof source === 'function' ? source : () => source.value
  createEffect(() => {
    callback(getter() as T, getter() as T)
  })
  return () => {}
}

export function watchEffect(
  effect: () => void,
  options?: { immediate?: boolean; deep?: boolean; flush?: 'pre' | 'post' | 'sync' }
) {
  createEffect(effect)
  return () => {}
}

export function onMounted(hook: () => void): void {
  // 在编译时会被替换为实际的DOM挂载逻辑
  if (typeof window !== 'undefined') {
    hook()
  }
}

export function onUpdated(hook: () => void): void {
  // 在编译时会被替换为实际的更新逻辑
}

export function onUnmounted(hook: () => void): void {
  // 在编译时会被替换为实际的卸载逻辑
}

export function onBeforeMount(hook: () => void): void {
  // 在编译时会被替换为实际的挂载前逻辑
}

export function onBeforeUpdate(hook: () => void): void {
  // 在编译时会被替换为实际的更新前逻辑
}

export function onBeforeUnmount(hook: () => void): void {
  // 在编译时会被替换为实际的卸载前逻辑
}

export function readonly<T>(target: T): T {
  return target
}

export function toRef<T extends object, K extends keyof T>(object: T, key: K) {
  return ref(object[key])
}

export function toRefs<T extends object>(object: T) {
  const refs: any = {}
  for (const key in object) {
    refs[key] = toRef(object, key)
  }
  return refs
}

export function unref<T>(ref: T | { value: T }): T {
  return (ref as any).value ?? ref
}

export function isRef<T>(value: any): value is { value: T } {
  return value && typeof value === 'object' && 'value' in value
}

export function toRaw<T>(observed: T): T {
  return observed
}

export function markRaw<T extends object>(value: T): T {
  return value
}

// React Hooks API 兼容层
export function useState<S>(
  initialState: S | (() => S)
): [S, (value: S | ((prev: S) => S)) => void] {
  const initial = typeof initialState === 'function' ? (initialState as () => S)() : initialState
  const [get, set] = createSignal(initial)
  return [
    get() as S,
    (value: S | ((prev: S) => S)) => {
      if (typeof value === 'function') {
        set((value as (prev: S) => S)(get() as S))
      } else {
        set(value)
      }
    }
  ]
}

export function useEffect(
  effect: () => void | (() => void),
  deps?: ReadonlyArray<any>
): void {
  createEffect(effect)
}

export function useMemo<T>(
  factory: () => T,
  deps: ReadonlyArray<any>
): T {
  return createComputed(factory)()
}

export function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: ReadonlyArray<any>
): T {
  return callback
}

export function useRef<T>(initialValue: T): { current: T }
export function useRef<T>(initialValue: T | null): { current: T | null }
export function useRef<T = undefined>(): { current: T | undefined }
export function useRef<T>(initialValue?: T): { current: T | undefined } {
  return { current: initialValue }
}

export function useContext<T>(context: any): T {
  // 在编译时会被替换为实际的Context逻辑
  return context as T
}

export function useReducer<S, A>(
  reducer: (prevState: S, action: A) => S,
  initialState: S
): [S, (action: A) => void] {
  const [state, setState] = useState(initialState)
  return [
    state,
    (action: A) => {
      setState((prev: S) => reducer(prev, action))
    }
  ]
}

export function useLayoutEffect(
  effect: () => void | (() => void),
  deps?: ReadonlyArray<any>
): void {
  useEffect(effect, deps)
}

export function useTransition(): [boolean, (callback: () => void) => void] {
  return [false, (callback: () => void) => callback()]
}

export function useDeferredValue<T>(value: T): T {
  return value
}

export function useSyncExternalStore<Snapshot>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot
): Snapshot {
  const [state, setState] = useState(getSnapshot())
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setState(getSnapshot())
    })
    return unsubscribe
  }, [])
  return state
}

// React 命名空间（用于 JSX 类型）
export namespace React {
  export type ElementType = any
  export type Element = any
  export type ReactNode = any
  export type ReactElement = any
  export type ComponentType<P = {}> = any
  export type FunctionComponent<P = {}> = (props: P) => ReactElement | null
  export type Component<P = {}, S = {}> = any
  export type Ref<T> = any
  export type Provider<T> = any
  export type Consumer<T> = any
}

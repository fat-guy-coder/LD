import { queueJob } from './batch';
import { globalState } from './store';
import type { SignalNode } from './store';

export interface EffectOptions {
  scheduler?: ((effect: ReactiveEffect) => void) | null;
  dynamic?: boolean;
}

export class ReactiveEffect<T = any> {
  public id: number;
  next: ReactiveEffect | null = null;
  deps: Set<SignalNode> = new Set();
  depVersions: Map<SignalNode, number> = new Map();
  private _value: T | undefined;
  public isStatic: boolean;

  constructor(
    public fn: () => T,
    public scheduler: ((effect: ReactiveEffect<T>) => void) | null = null,
    isStatic = false
  ) {
    this.id = globalState.effectIdCounter++;
    this.isStatic = isStatic;
  }

  private isDirty(): boolean {
    if (this.deps.size === 0) return true;
    for (const dep of this.deps) {
      if (dep.version !== this.depVersions.get(dep)) {
        return true;
      }
    }
    return false;
  }

  run(): T {
    if (this.isStatic) {
      return this.fn();
    }

    if (!globalState.effectStack.includes(this)) {
      if (!this.isDirty()) {
        return this._value as T;
      }

      try {
        cleanupEffect(this);
        globalState.effectStack.push(this);
        this._value = this.fn();
        return this._value;
      } finally {
        globalState.effectStack.pop();
      }
    }
    // This path should not be taken in normal execution, but tsc needs a return path.
    return this._value as T;
  }

  stop(): void {
    cleanupEffect(this);
  }
}

function cleanupEffect(effect: ReactiveEffect): void {
  for (const dep of effect.deps) {
    let current = dep.observers;
    let prev: ReactiveEffect | null = null;
    while (current) {
      if (current === effect) {
        if (prev) {
          prev.next = current.next;
        } else {
          dep.observers = current.next;
        }
        break;
      }
      prev = current;
      current = current.next;
    }
  }
  effect.deps.clear();
}

export function getActiveEffect(): ReactiveEffect | undefined {
  return globalState.effectStack[globalState.effectStack.length - 1];
}

export function track(node: SignalNode): void {
  const effect = getActiveEffect();
  if (effect) {
    if (!effect.deps.has(node)) {
      effect.next = node.observers;
      node.observers = effect;
      effect.deps.add(node);
    }
    // 记录版本号
    effect.depVersions.set(node, node.version);
  }
}

export function trigger(node: SignalNode): void {
  let effect = node.observers;
  while (effect) {
    if (effect.scheduler) {
      effect.scheduler(effect);
    } else {
      effect.run();
    }
    effect = effect.next;
  }
}

export function createEffect(fn: () => void, options?: EffectOptions): ReactiveEffect {
  const scheduler = options?.scheduler === undefined ? queueJob : options.scheduler;
  const isStatic = options?.dynamic === false;
  const effect = new ReactiveEffect(fn, scheduler, isStatic);
  
  const originalIsStatic = effect.isStatic;
  effect.isStatic = false;
  effect.run();
  effect.isStatic = originalIsStatic;

  return effect;
}

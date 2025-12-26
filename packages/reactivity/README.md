# @ld/reactivity

`@ld/reactivity` 是 LD 框架的核心响应式系统。它实现了一个零虚拟 DOM、基于 Signal 的细粒度更新机制，旨在提供极致的性能。

## 核心理念

- **Signal**: 响应式系统的基础，是包含值的原子化容器。
- **Effect**: 当 Signal 的值发生变化时自动执行的副作用。
- **细粒度更新**: 变更直接精确地应用到需要更新的地方，无需虚拟 DOM diff。

## 安装

```bash
npm install @ld/reactivity
```

## API 参考

### `createSignal<T>`

创建一个可追踪变化的响应式值容器（Signal）。

**签名**
```typescript
function createSignal<T>(
  initialValue: T,
  equals?: EqualityFn<T> | false
): [() => T, (newValue: T) => void];
```

**参数**
- `initialValue`: 信号的初始值。
- `equals` (可选): 自定义相等函数，用于确定值是否已更改。默认为 `Object.is`。如果设为 `false`，则每次设置都会触发更新。

**返回**
一个元组，包含：
- `getter`: 一个无参函数，返回信号的当前值。
- `setter`: 一个函数，用于更新信号的值。

**示例**
```typescript
import { createSignal, createEffect } from '@ld/reactivity';

const [count, setCount] = createSignal(0);

createEffect(() => {
  console.log('The count is:', count());
});
// The count is: 0

setCount(5);
// The count is: 5
```

### `createEffect`

创建一个副作用，当其依赖的 Signal 变化时会自动重新运行。

**签名**
```typescript
function createEffect(fn: () => void): ReactiveEffect;
```

**参数**
- `fn`: 要运行的副作用函数。

**返回**
一个 `ReactiveEffect` 实例，包含一个 `stop` 方法，可用于手动停止副作用的追踪。

**示例**
```typescript
import { createSignal, createEffect } from '@ld/reactivity';

const [count, setCount] = createSignal(0);

const effect = createEffect(() => {
  console.log(count());
});

setCount(10); // 会打印 10

effect.stop();

setCount(20); // 不会再打印
```

### `createComputed<T>`

创建一个只读的计算属性，其值是根据 getter 函数动态计算的，并且只有在依赖项变化时才会重新计算。

**签名**
```typescript
function createComputed<T>(getter: () => T): { readonly value: T };
```

**参数**
- `getter`: 用于计算值的函数。

**返回**
一个包含只读 `value` 属性的对象。

**示例**
```typescript
import { createSignal, createComputed } from '@ld/reactivity';

const [count, setCount] = createSignal(1);
const double = createComputed(() => count() * 2);

console.log(double.value); // 2

setCount(5);
console.log(double.value); // 10
```

### `createReactive<T>`

为一个对象创建一个深层响应式代理。

**签名**
```typescript
function createReactive<T extends object>(obj: T): T;
```

**参数**
- `obj`: 要使其响应式的对象。

**返回**
原始对象的响应式代理。

**示例**
```typescript
import { createReactive, createEffect } from '@ld/reactivity';

const state = createReactive({ count: 0, user: { name: 'John' } });

createEffect(() => {
  console.log('Count:', state.count, 'User:', state.user.name);
});

state.count++;
// Count: 1 User: John

state.user.name = 'Jane';
// Count: 1 User: Jane
```

### `batch`

将多个状态变更组合成一个“批处理”，在所有变更完成后只触发一次 effect 更新，以优化性能。

**签名**
```typescript
function batch(fn: () => void): void;
```

**参数**
- `fn`: 包含多个状态变更的函数。

**示例**
```typescript
import { createSignal, createEffect, batch } from '@ld/reactivity';

const [firstName, setFirstName] = createSignal('John');
const [lastName, setLastName] = createSignal('Doe');

createEffect(() => {
  console.log(`Name: ${firstName()} ${lastName()}`);
});
// Name: John Doe

batch(() => {
  setFirstName('Jane');
  setLastName('Smith');
});
// Name: Jane Smith (只打印一次)
```


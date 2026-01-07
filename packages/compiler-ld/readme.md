# LD 单文件组件 (`.ld`) 官方文档

本文档为 LD 单文件组件 (`.ld` 文件) 的语法和功能提供了全面的指南，所有示例和说明均源自 `counter.ld` 示例文件。

## 目录

1.  [模板语法 (`<template>`)](#1-模板语法-template)
    - [属性绑定: `class` 与 `style`](#属性绑定-class-与-style)
    - [事件处理与修饰符](#事件处理与修饰符)
    - [条件渲染](#条件渲染)
    - [列表渲染](#列表渲染)
    - [组件与 Props](#组件与-props)
    - [插槽 (Slots)](#插槽-slots)
    - [引用 (Refs)](#引用-refs)
2.  [脚本语法 (`<script>`)](#2-脚本语法-script)
    - [核心概念：自动提升](#核心概念自动提升)
    - [响应式 API: `signal` 与 `computed`](#响应式-api-signal-与-computed)
    - [Props API](#props-api)
    - [插槽 API (脚本中)](#插槽-api-脚本中)
    - [Ref API (脚本中)](#ref-api-脚本中)
    - [组件定义 (TSX)](#组件定义-tsx)
    - [异步组件](#异步组件)
    - [副作用 `effect`](#副作用-effect)
    - [监听器 `watch`](#监听器-watch)
    - [生命周期钩子](#生命周期钩子)
3.  [样式 (`<style scoped>`)](#3-样式-style-scoped)

---

## 1. 模板语法 (`<template>`)

### 属性绑定: `class` 与 `style`

多个 `class` 或 `style` 属性会智能合并，后面的声明会覆盖前面的。

```html
<p class={classNamesObject} class={classNamesArray} class="classA">... </p>
<p style={styleObject} style={styleArray} style="color: red">... </p>
```

### 事件处理与修饰符

使用 `eventName={handler}` 的语法绑定事件。

-   **默认参数**: 不传递任何参数时，处理函数默认接收 `event` 对象。
    ```html
    <button onClick={increment}>Increment</button>
    ```
-   **传递参数**: 可以显式传递 `event` 对象和其他自定义参数。
    ```html
    <button onClick={increment(event, 'hello')}>Increment</button>
    ```
-   **事件修饰符**: 支持与 Vue 相同的事件修饰符，如 `.stop`, `.prevent`, `.self`, `.once`, `.capture`, `.passive`, `.native`。
    ```html
    <button onClick.stop={increment(event, 'hello')}>Increment</button>
    ```

### 条件渲染

-   **`if`/`else` 指令**: 类似于 Vue 的 `v-if`，用于块级条件渲染。
    ```html
    <div if={count === 1}>show</div>
    <div else>hide</div>
    ```
-   **TSX 风格**: 支持标准的三元运算符。
    ```html
    {count === 1 ? <div>show</div> : <div>hide</div>}
    ```
-   **`show`/`hide` 指令**: 通过切换 `display` 样式来控制元素的显示和隐藏。
    ```html
    <div show={count === 1}>show</div>
    ```

### 列表渲染

支持多种数据源的列表渲染。

```html
<!-- for...in (带索引) -->
<div for={(item, index) in list}>item</div>

<!-- for...of (仅值) -->
<div for={item of list}>{item}</div>

<!-- 遍历数字 -->
<div for={item in 5}>{item}</div>
```

### 组件与 Props

使用大驼峰或短横线风格引入组件，并通过属性传递 Props。

```html
<MyComponent />
<my-component count={count} />
```

### 插槽 (Slots)

-   **在父组件中定义内容**: 在父组件中，通过 `<slot name="...">` 的形式为子组件的具名插槽提供内容。
    ```html
    <AsyncComponent>
      <slot name="A">default slot</slot>
    </AsyncComponent>
    ```
-   **在子组件中使用插槽**: 在子组件中，通过 `<slotA />` 或 `<slotB>默认值</slotB>` 的形式来使用父组件传递过来的插槽内容。
-   **作用域插槽**: 子组件可以通过属性向父组件传递数据，父组件通过 `slot-props` (或 `slotprops`) 接收。
    ```html
    <!-- 子组件向父组件传值 -->
    <slotC age="10" count={count}></slotC>

    <!-- 父组件接收 -->
    <AsyncComponent>
      <slot name="A" slot-props={props}>{props.age}</slot>
      <slot name="B" slotprops={age,count}>{age} + {count}</slot>
    </AsyncComponent>
    ```

### 引用 (Refs)

通过 `ref` 属性获取组件实例或 DOM 元素。

```html
<AsyncComponent ref="asyncComponentRef"/>
```

## 2. 脚本语法 (`<script>`)

### 核心概念：自动提升

在 `.ld` 文件中，`import`, `export`, 类型定义，组件和变量可以声明在 `<script>` 块的任何位置。LD 编译器会自动将它们提升到各自作用域的顶部，以便打包工具正确处理。未在模板中使用的导入组件不会被打包。

### 响应式 API: `signal` 与 `computed`

用于声明响应式状态和计算属性。

-   **完整语法**: `signal<Type>: varName = value`
-   **简写语法**: `S<Type>: varName = value` 或 `S:varName:Type = value` (推荐小写 `s` 和 `c`)

```typescript
// 响应式变量
signal<number>: count = 0
// 计算属性
computed<boolean>: isEven = count % 2 === 0
```

### Props API

用于定义组件的 Props。

-   **完整语法**: `const props = Props<Type>({ default values })`
-   **简写语法**: `const props = P<Type>({ default values })`
-   **解构赋值**: `const { propName = 'default' } = props<Type>()` (自动解包并保持响应性)

### 插槽 API (脚本中)

用于在脚本中访问插槽。`slot` 和 `children` 是别名。

-   **完整语法**: `slot: varName = Slot('slotName')`
-   **简写语法**: `SL: varName = Slot('slotName')`
-   `Slot()` 或 `Slot('default')` 获取默认插槽。
-   `Slot('all')` 获取所有插槽的集合。

### Ref API (脚本中)

用于在脚本中声明一个 Ref。

-   **完整语法**: `ref: varName = Ref<Type>()`
-   **简写语法**: `R: varName = Ref<Type>()`

### 组件定义 (TSX)

可以直接使用 TSX 语法在脚本中定义组件。

```typescript
// 静态组件
export const Tips = <div>this is a tips component</div>

// 函数式组件
export const functionTips = (props: { name: string }) => <div>{props.name}</div>

// 包装现有组件
export const MyComponentWithWrapper = <div class="wrapper"><MyComponent /></div>
```

### 异步组件

使用 `LazyLoad` 函数可以轻松地定义异步组件，实现代码分割和按需加载。

-   **简单用法**: 直接传递一个返回 `import()` 调用的函数。
    ```typescript
    const AsyncComponent = LazyLoad(() => import('./MyComponent.ld'))
    ```

-   **动态导入**: 可以在异步函数中执行逻辑，例如，根据 props 修改导入的组件。
    ```typescript
    const AsyncComponent = LazyLoad(async () => {
      const { default: MyComponent } = await import('@component/my-component')
      // 可以在返回前对组件进行包装或修改
      return <MyComponent name="test" count={count}/>
    })
    ```

-   **高级用法 (带选项)**: 传递一个配置对象，可以自定义加载、错误、延迟和超时等行为。
    ```typescript
    export const AsyncComponent = LazyLoad({
      // 要加载的组件
      component: () => import('@component/my-component'),

      // 加载中状态下显示的组件
      loading: <div>加载中...</div>,

      // 加载失败时显示的组件
      error: <div>加载错误...</div>,

      // 延迟显示 loading 组件的时间 (ms)
      delay: 1000,

      // 加载超时时间 (ms)
      timeout: 10000,

      // 加载方式: 'import' (默认) 或 'fetch'
      loadWay: 'import',

      // 自定义 import 加载逻辑
      import: (options: ILazyLoadOptions) => Promise<IComponent>,

      // 自定义 fetch 加载逻辑
      fetch: async (options: IFetchOptions) => {
        // 可以在加载组件前执行其他异步操作，例如请求接口
        const response = await fetch('https://api.github.com')
        if (!response.ok) {
          throw new Error('Failed to fetch data')
        }
        const data = await response.json()
        // 将获取的数据传递给组件
        return await options.component({ data })
      },

      // CSS 加载方式: 'link' (默认) 或 'style'
      cssLoadWay: 'link'
    })
    ```

-   **类型定义**:
    ```typescript
    type ILazyLoadOptions = {
      component: () => Promise<IComponent>
      loading: IComponent
      error: IComponent
      delay: number
      timeout: number
    }

    type IFetchOptions = ILazyLoadOptions & {
      url: string
      method: 'GET' | 'POST' | 'PUT' | 'DELETE'
      headers: Record<string, string>
      body: any
    }
    ```

-   **编译产物**:
    编译器会将异步组件打包成原生的 JS (一个创建 DOM 节点和事件的函数) 和 CSS (一个创建 `<link>` 或 `<style>` 标签的函数)，以实现最高效的加载和渲染。

### 副作用 `effect`

当依赖项变化时自动执行，类似于 `useEffect`。返回一个包含 `stop`, `pause`, `resume` 方法的控制器。接受与 Vue `watch` 相同的选项对象。

```typescript
effect(() => {
  console.log(`Count is: ${count}`)
  return () => { /* cleanup */ }
}, [count], { immediate: true, flush: 'post', /* ... */ })
```

### 监听器 `watch`

监听一个响应式源的变化，类似于 Vue 的 `watch`。返回控制器并接受相同的选项。

### 生命周期钩子

-   `onCreated()`: Fragment 创建后，DOM 插入前。
-   `onBeforeUpdate()`: 状态更新后，Fragment 创建前。
-   `onUpdated()`: 更新的 Fragment 插入 DOM 后。
-   `onMounted()`: DOM 插入后。
-   `onUnmounted()`: Fragment 卸载前。

## 3. 样式 (`<style scoped>`)

使用 `scoped` 属性来确保样式只应用于当前组件。

```css
<style scoped>
  .counter { text-align: center; }
</style>
```

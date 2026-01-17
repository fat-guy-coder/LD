# LD单文件格式需求分析

## 核心目标

1. **统一语法支持**：在`.ld`文件中同时支持Vue3和React Hooks语法
2. **导出能力**：解决Vue文件无法导出变量和TS类型的痛点
3. **极致编译**：编译成无虚拟DOM、无运行时的原生JS + CSS
4. **未来扩展**：支持Rust/C++语法，编译成WebAssembly

## 1. LD文件格式设计

### 1.1 基本结构
```ld
<template>
  <!-- Vue3模板语法 + React JSX语法混合 -->
  <div>
    <h1>{count}</h1>
    <button @click={increment}>Increment</button>
  </div>
</template>

<script setup lang="ts">
  // 支持Vue3 Composition API
  import { ref, computed } from 'vue'
  const count = ref(0)
  
  // 同时支持React Hooks
  import { useState, useEffect } from 'react'
  const [name, setName] = useState('LD')
  
  // 导出变量和类型（解决Vue痛点）
  export const exportedValue = 42
  export type ExportedType = { name: string }
  
  // 可选：从外部TS文件导入类型和变量
  import type { User } from './types.ts'
  import { constants } from './constants.ts'
</script>

<style scoped>
  /* CSS样式 */
</style>
```

### 1.2 类型和变量分离（可选）
```typescript
// types.ts - 类型定义文件
export type User = { name: string; age: number }
export interface ComponentProps { id: string }

// constants.ts - 常量定义文件
export const API_URL = 'https://api.example.com'
export const MAX_COUNT = 100
```

```ld
<script setup lang="ts">
  // 从外部文件导入类型和变量
  import type { User, ComponentProps } from './types.ts'
  import { API_URL, MAX_COUNT } from './constants.ts'
  
  // 组件逻辑
  const user: User = { name: 'LD', age: 1 }
</script>
```

## 2. 编译策略

### 2.1 编译流程
```
.ld文件
  ↓ [@vue/compiler-sfc解析]
SFC Descriptor (template + script + style)
  ↓ [@ld/compiler-core转换]
LD IR (中间表示)
  ↓ [@ld/compiler-core代码生成]
原生JS + CSS (无虚拟DOM，无运行时)
```

### 2.2 编译目标
- **输出格式**：单个JS文件 + 单个CSS文件
- **性能要求**：
  - 直接DOM操作（createElement, appendChild, setAttribute）
  - Signal集成（自动生成createSignal调用）
  - 事件绑定（直接addEventListener）
  - 静态提升（编译时提取静态节点）
  - 常量折叠（编译时计算常量表达式）

### 2.3 语法转换规则

#### Vue3 → LD
```typescript
// 输入 (Vue3)
const count = ref(0)
const doubled = computed(() => count.value * 2)

// 输出 (LD原生JS)
const [count, setCount] = createSignal(0)
const doubled = createComputed(() => count() * 2)
```

#### React Hooks → LD
```typescript
// 输入 (React)
const [count, setCount] = useState(0)
useEffect(() => { console.log(count) }, [count])

// 输出 (LD原生JS)
const [count, setCount] = createSignal(0)
createEffect(() => { console.log(count()) })
```

## 3. 导出功能实现

### 3.1 导出变量
```ld
<script setup lang="ts">
  export const config = { api: 'https://api.example.com' }
  export const version = '1.0.0'
</script>
```

编译后：
```javascript
// 编译后的JS文件
export const config = { api: 'https://api.example.com' }
export const version = '1.0.0'
```

### 3.2 导出类型
```ld
<script setup lang="ts">
  export type User = { name: string }
  export interface Config { api: string }
</script>
```

编译后：
```typescript
// 编译后的.d.ts文件
export type User = { name: string }
export interface Config { api: string }
```

## 4. 未来扩展：Rust/C++支持

### 4.1 语法支持
```ld
<script setup lang="ts">
  // 引入Rust包
  import { calculate } from './heavy-compute.rs'
  
  // 引入C++包
  import { renderCanvas } from './canvas-render.cpp'
  
  // 使用WebAssembly函数
  const result = calculate(1000000) // 调用Rust函数
  renderCanvas(canvas, data) // 调用C++函数
</script>
```

### 4.2 编译流程
```
.ld文件
  ↓
识别Rust/C++导入
  ↓
分别编译：
  - TypeScript → JavaScript
  - Rust → WebAssembly (.wasm)
  - C++ → WebAssembly (.wasm)
  ↓
生成胶水代码
  ↓
最终输出：
  - component.js (主JS文件)
  - component.css (样式文件)
  - component.wasm (WebAssembly模块)
  - component.wasm.d.ts (类型定义)
```

### 4.3 WebAssembly集成
```typescript
// 自动生成的胶水代码
import initWasm, { calculate, renderCanvas } from './component.wasm'

// 初始化WebAssembly模块
await initWasm()

// 在Canvas/SVG渲染中使用
function render() {
  const data = new Float32Array(1000000)
  renderCanvas(canvas, data) // 高性能渲染
}
```

## 5. 实现优先级

### Phase 1: 核心功能（当前）
1. ✅ 支持Vue3语法（使用@vue/compiler-sfc）
2. ✅ 支持React Hooks语法（转换层）
3. ⏳ 实现导出变量和类型功能
4. ⏳ 优化编译输出（无虚拟DOM，无运行时）

### Phase 2: 类型分离（短期）
1. 支持从外部TS文件导入类型和变量
2. 优化类型推导和检查
3. 生成.d.ts类型定义文件

### Phase 3: WebAssembly支持（中期）
1. Rust语法识别和编译
2. C++语法识别和编译
3. WebAssembly胶水代码生成
4. Canvas/SVG高性能渲染集成

## 6. 技术实现要点

### 6.1 编译器架构
```
@ld/compiler-ld (主编译器)
  ├── parser (解析.ld文件)
  ├── transformer (Vue3/React → LD IR)
  ├── codegen (LD IR → 原生JS)
  └── wasm-bridge (WebAssembly集成)

@ld/compiler-core (核心转换)
  ├── vue-transformer (Vue3 → LD)
  ├── react-transformer (React → LD)
  └── optimizer (静态提升、常量折叠等)
```

### 6.2 关键挑战
1. **语法混合**：如何在同一文件中支持Vue3和React语法
2. **类型推导**：如何正确推导和导出类型
3. **性能优化**：如何生成最优的原生JS代码
4. **WebAssembly集成**：如何无缝集成Rust/C++代码

## 7. 下一步行动

1. 更新`gemini-optimized-guidance.json`，添加LD文件格式规范
2. 扩展`@ld/compiler-ld`，支持导出功能
3. 实现Vue3和React Hooks的混合语法支持
4. 优化代码生成器，确保输出无运行时依赖
5. 规划WebAssembly支持的技术方案

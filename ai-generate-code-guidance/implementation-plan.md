# LD文件格式实现方案

## 一、核心需求总结

### 1.1 用户需求
1. **统一语法**：在`.ld`文件中同时支持Vue3和React Hooks语法
2. **导出功能**：解决Vue文件无法导出变量和TS类型的痛点
3. **极致编译**：编译成无虚拟DOM、无运行时的原生JS + CSS
4. **类型分离**：可选地将类型和变量放在外部TS文件中
5. **未来扩展**：支持Rust/C++语法，编译成WebAssembly

### 1.2 设计原则
- **职责单一**：类型和变量可以放在TS文件中（可选）
- **性能优先**：编译输出必须是最优算法（最小时间/空间复杂度）
- **零运行时**：生成的代码不依赖任何运行时框架
- **完全兼容**：支持Vue3和React Hooks的完整语法

## 二、技术实现方案

### 2.1 编译器架构

```
┌─────────────────────────────────────────┐
│         @ld/compiler-ld                 │
│  (主编译器，处理.ld文件)                │
└─────────────────────────────────────────┘
              │
              ├─── 解析阶段
              │    ├── @vue/compiler-sfc (解析template/script/style)
              │    └── 提取导出声明 (export const/type)
              │
              ├─── 转换阶段
              │    ├── Vue3语法 → LD Signal API
              │    ├── React Hooks → LD Signal API
              │    └── 导出处理 (生成export语句)
              │
              └─── 代码生成阶段
                   ├── LD IR → 原生JS (直接DOM操作)
                   ├── 样式提取 → CSS文件
                   └── 类型导出 → .d.ts文件
```

### 2.2 关键模块

#### 模块1: `@ld/compiler-ld/src/export-handler.ts`
**职责**：处理`.ld`文件中的导出声明

```typescript
/**
 * @description 处理.ld文件中的导出声明
 * @param scriptAST - 解析后的script AST
 * @returns 导出信息（变量、类型、函数等）
 */
export function extractExports(scriptAST: t.File): ExportInfo {
  // 1. 识别export const/let/var
  // 2. 识别export type/interface
  // 3. 识别export function
  // 4. 返回导出信息
}

/**
 * @description 生成导出代码
 * @param exports - 导出信息
 * @returns 生成的export语句代码
 */
export function generateExports(exports: ExportInfo): string {
  // 生成export语句，确保在编译后的JS文件中保留
}
```

#### 模块2: `@ld/compiler-core/src/vue-transformer.ts`
**职责**：将Vue3语法转换为LD Signal API

```typescript
/**
 * @description 转换Vue3 Composition API到LD Signal API
 * @param vueAST - Vue3 script AST
 * @returns LD Signal API AST
 */
export function transformVue3ToLD(vueAST: t.File): t.File {
  // ref() → createSignal()
  // computed() → createComputed()
  // watch() → createEffect()
  // reactive() → createReactive()
}
```

#### 模块3: `@ld/compiler-core/src/react-transformer.ts`
**职责**：将React Hooks转换为LD Signal API

```typescript
/**
 * @description 转换React Hooks到LD Signal API
 * @param reactAST - React script AST
 * @returns LD Signal API AST
 */
export function transformReactToLD(reactAST: t.File): t.File {
  // useState() → createSignal()
  // useEffect() → createEffect()
  // useMemo() → createComputed()
  // useCallback() → 优化处理
}
```

#### 模块4: `@ld/compiler-core/src/codegen-native.ts`
**职责**：生成无运行时的原生JS代码

```typescript
/**
 * @description 将LD IR编译为原生JavaScript代码
 * @param ir - LD中间表示
 * @returns 原生JS代码字符串
 */
export function generateNativeJS(ir: LDIR): string {
  // 1. 静态提升：提取静态节点
  // 2. 常量折叠：编译时计算常量
  // 3. Signal优化：直接DOM操作
  // 4. 事件绑定：直接addEventListener
  // 5. 确保零运行时依赖
}
```

## 三、实现步骤

### Phase 1: 导出功能（优先级最高）

#### 步骤1.1: 扩展解析器
**文件**: `packages/compiler-ld/src/export-handler.ts`

```typescript
import traverse from '@babel/traverse'
import * as t from '@babel/types'

export interface ExportInfo {
  variables: Array<{ name: string; type: 'const' | 'let' | 'var' }>
  types: Array<{ name: string; kind: 'type' | 'interface' | 'enum' }>
  functions: Array<{ name: string; isAsync: boolean }>
}

export function extractExports(scriptAST: t.File): ExportInfo {
  const exports: ExportInfo = {
    variables: [],
    types: [],
    functions: []
  }

  traverse(scriptAST, {
    ExportNamedDeclaration(path) {
      const { declaration, specifiers } = path.node
      
      // 处理 export const/let/var
      if (declaration) {
        if (t.isVariableDeclaration(declaration)) {
          declaration.declarations.forEach(decl => {
            if (t.isIdentifier(decl.id)) {
              exports.variables.push({
                name: decl.id.name,
                type: declaration.kind as 'const' | 'let' | 'var'
              })
            }
          })
        }
        
        // 处理 export type/interface
        if (t.isTSInterfaceDeclaration(declaration)) {
          exports.types.push({
            name: declaration.id.name,
            kind: 'interface'
          })
        }
        
        if (t.isTSTypeAliasDeclaration(declaration)) {
          exports.types.push({
            name: declaration.id.name,
            kind: 'type'
          })
        }
      }
      
      // 处理 export { name } from './file'
      if (specifiers) {
        specifiers.forEach(spec => {
          if (t.isExportSpecifier(spec)) {
            // 处理重导出
          }
        })
      }
    },
    
    ExportDefaultDeclaration(path) {
      // 处理默认导出
    }
  })

  return exports
}
```

#### 步骤1.2: 更新代码生成器
**文件**: `packages/compiler-ld/src/script-compiler.ts`

在`compileScript`函数中添加导出处理：

```typescript
import { extractExports, generateExports } from './export-handler'

export function compileScript(
  scriptAst: t.File,
  macros: ReturnType<typeof parseScript>['macros']
): { code: string; exports: ExportInfo } {
  // ... 现有的转换逻辑 ...
  
  // 提取导出信息
  const exports = extractExports(scriptAst)
  
  // 生成代码
  const { code } = generate(scriptAst)
  
  // 确保导出语句被保留
  const finalCode = ensureExportsPreserved(code, exports)
  
  return { code: finalCode, exports }
}
```

#### 步骤1.3: 生成类型定义文件
**文件**: `packages/compiler-ld/src/type-generator.ts`

```typescript
/**
 * @description 生成.d.ts类型定义文件
 * @param exports - 导出信息
 * @param scriptAST - 原始script AST
 * @returns TypeScript类型定义代码
 */
export function generateTypeDefinitions(
  exports: ExportInfo,
  scriptAST: t.File
): string {
  // 1. 提取类型定义
  // 2. 生成export type/interface声明
  // 3. 生成export const类型声明
  // 4. 返回.d.ts文件内容
}
```

### Phase 2: Vue3/React混合语法支持

#### 步骤2.1: 语法识别
**文件**: `packages/compiler-core/src/syntax-detector.ts`

```typescript
/**
 * @description 检测script中使用的语法类型
 * @param scriptAST - script AST
 * @returns 检测到的语法类型
 */
export function detectSyntax(scriptAST: t.File): {
  hasVue3: boolean
  hasReact: boolean
  imports: string[]
} {
  const imports: string[] = []
  let hasVue3 = false
  let hasReact = false

  traverse(scriptAST, {
    ImportDeclaration(path) {
      const source = path.node.source.value
      imports.push(source)
      
      if (source === 'vue' || source.startsWith('vue/')) {
        hasVue3 = true
      }
      if (source === 'react' || source.startsWith('react/')) {
        hasReact = true
      }
    },
    
    CallExpression(path) {
      // 检测Vue3 API调用
      if (t.isIdentifier(path.node.callee)) {
        const name = path.node.callee.name
        if (['ref', 'computed', 'watch', 'reactive'].includes(name)) {
          hasVue3 = true
        }
        if (['useState', 'useEffect', 'useMemo'].includes(name)) {
          hasReact = true
        }
      }
    }
  })

  return { hasVue3, hasReact, imports }
}
```

#### 步骤2.2: 统一转换
**文件**: `packages/compiler-core/src/unified-transformer.ts`

```typescript
/**
 * @description 统一转换Vue3和React语法到LD Signal API
 * @param scriptAST - script AST
 * @returns 转换后的AST
 */
export function transformToLD(scriptAST: t.File): t.File {
  const syntax = detectSyntax(scriptAST)
  
  // 先转换Vue3语法
  if (syntax.hasVue3) {
    scriptAST = transformVue3ToLD(scriptAST)
  }
  
  // 再转换React语法
  if (syntax.hasReact) {
    scriptAST = transformReactToLD(scriptAST)
  }
  
  return scriptAST
}
```

### Phase 3: 原生JS代码生成优化

#### 步骤3.1: 静态提升
**文件**: `packages/compiler-core/src/optimizer/static-hoisting.ts`

```typescript
/**
 * @description 静态节点提升优化
 * @param ir - LD IR
 * @returns 优化后的IR
 */
export function hoistStaticNodes(ir: LDIR): LDIR {
  // 1. 识别静态节点（无响应式绑定）
  // 2. 提取到组件外部
  // 3. 在render函数中引用
}
```

#### 步骤3.2: 直接DOM操作生成
**文件**: `packages/compiler-core/src/codegen/dom-generator.ts`

```typescript
/**
 * @description 生成直接DOM操作代码
 * @param node - DOM节点IR
 * @returns JavaScript代码字符串
 */
export function generateDOMOperations(node: DOMNodeIR): string {
  // 生成类似这样的代码：
  // const el = document.createElement('div')
  // el.className = 'container'
  // el.addEventListener('click', handler)
  // parent.appendChild(el)
}
```

## 四、测试策略

### 4.1 导出功能测试
```typescript
// packages/compiler-ld/test/export-handler.test.ts
describe('导出功能', () => {
  it('应该能导出变量', () => {
    const source = `
      <script setup lang="ts">
        export const config = { api: 'https://api.example.com' }
      </script>
    `
    const result = compile(source)
    expect(result.exports.variables).toContainEqual({ name: 'config', type: 'const' })
    expect(result.code).toContain('export const config')
  })
  
  it('应该能导出类型', () => {
    const source = `
      <script setup lang="ts">
        export type User = { name: string }
      </script>
    `
    const result = compile(source)
    expect(result.exports.types).toContainEqual({ name: 'User', kind: 'type' })
    expect(result.typeDefinitions).toContain('export type User')
  })
})
```

### 4.2 混合语法测试
```typescript
// packages/compiler-core/test/unified-transformer.test.ts
describe('混合语法支持', () => {
  it('应该同时支持Vue3和React语法', () => {
    const source = `
      <script setup lang="ts">
        import { ref } from 'vue'
        import { useState } from 'react'
        
        const count = ref(0)
        const [name, setName] = useState('LD')
      </script>
    `
    const result = transformToLD(parseScript(source))
    // 验证都转换成了createSignal
  })
})
```

## 五、下一步行动

1. **立即开始**：实现导出功能（Phase 1）
2. **短期目标**：支持Vue3/React混合语法（Phase 2）
3. **中期目标**：优化代码生成，确保零运行时（Phase 3）
4. **长期目标**：规划WebAssembly支持

## 六、注意事项

1. **向后兼容**：确保现有的.ld文件仍然可以正常编译
2. **类型安全**：导出的类型必须正确生成.d.ts文件
3. **性能优先**：生成的代码必须是最优的
4. **零运行时**：确保编译后的代码不依赖任何框架运行时

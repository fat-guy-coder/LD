# LD 框架示例文件

本目录包含用于测试 LD 框架编译器和 VSCode 扩展的示例文件。

## 文件说明

### LD 文件（.ld）

1. **counter.ld** - 基础计数器示例
   - 展示 LD Signal 宏语法
   - 包含响应式状态和计算属性
   - 事件绑定和样式

2. **todo-list.ld** - 待办事项列表
   - **混合语法**：同时使用 Vue3 和 React Hooks
   - 状态管理：Vue3 `ref` + React `useState`
   - 计算属性：Vue3 `computed`
   - 副作用：React `useEffect`
   - 导出功能：导出类型和常量
   - 本地存储：自动保存/加载

3. **user-profile.ld** - 用户资料卡片
   - Vue3 Composition API
   - 响应式对象（`reactive`）
   - 计算属性
   - 条件渲染（`v-if`）
   - 双向绑定（`v-model`）
   - 导出类型和常量

4. **canvas-chart.ld** - Canvas 数据可视化
   - Canvas 渲染
   - 性能监控
   - 动画循环
   - 生命周期钩子
   - 导出类型和常量

### Vue 文件（.vue）

1. **todo-list.vue** - Vue 版本的待办事项列表
   - 纯 Vue3 Composition API
   - 模板语法
   - 响应式状态
   - 计算属性
   - 生命周期和 watch

### TSX 文件（.tsx）

1. **todo-list.tsx** - React TSX 版本的待办事项列表
   - React Hooks API
   - TypeScript 类型
   - 状态管理
   - 副作用处理
   - 外部 CSS 文件

## 测试要点

### 1. VSCode 扩展测试

- [ ] 语法高亮是否正确
- [ ] 代码格式化是否正常
- [ ] 自动补全是否工作
- [ ] 错误检测是否准确
- [ ] 悬停提示是否显示

### 2. 编译器测试

- [ ] LD 文件能否正确解析
- [ ] Vue3 语法能否正确转换
- [ ] React Hooks 能否正确转换
- [ ] 混合语法是否支持
- [ ] 导出功能是否正常
- [ ] 样式是否提取
- [ ] 生成的 JS 是否高效
- [ ] 是否零运行时依赖

### 3. 功能测试

- [ ] DOM 是否正确生成
- [ ] 状态是否独立
- [ ] 事件是否绑定
- [ ] 样式是否应用
- [ ] 计算属性是否工作
- [ ] 副作用是否执行

## 编译测试

```bash
# 编译 LD 文件
pnpm --filter @ld/compiler-ld run build

# 测试编译
node packages/compiler-ld/dist/index.js examples/basic/todo-list.ld

# 编译 Vue 文件
pnpm --filter @ld/compiler-sfc run build

# 编译 TSX 文件
pnpm --filter @ld/babel-plugin-ld run build
```

## 预期输出

每个文件编译后应该生成：

1. **JavaScript 文件**（.js）
   - 直接 DOM 操作代码
   - Signal 系统集成
   - 事件绑定
   - 零运行时依赖

2. **CSS 文件**（.css）
   - 提取的样式
   - Scoped 样式处理

3. **类型定义文件**（.d.ts，如果导出了类型）
   - 导出的类型
   - 导出的接口

## 注意事项

1. **混合语法**：`todo-list.ld` 展示了在同一个文件中使用 Vue3 和 React 语法
2. **导出功能**：`user-profile.ld` 和 `canvas-chart.ld` 展示了导出类型和常量
3. **性能优化**：所有文件都应该编译成高效的、零运行时的原生 JavaScript
4. **样式隔离**：使用 `scoped` 样式确保样式不冲突

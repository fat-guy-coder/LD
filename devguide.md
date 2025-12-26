# LD - 极致性能前端框架

## 🚀 项目概述

LD（Vue & React Light & Fast）是一个追求极致性能的前端框架，旨在提供比现有方案更快的响应式系统和渲染性能。框架完全兼容Vue3语法和生态系统React(Hooks)语法和生态系统，同时实现了零虚拟DOM的细粒度更新系统。

核心理念: light! fast! performance! typescript! vue! react!

## 🎯 性能目标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| Signal创建时间 | <0.01ms | 创建响应式信号的性能 |
| Signal读取时间 | <0.001ms | 读取信号值的性能 |
| Signal设置时间 | <0.005ms | 更新信号值的性能 |
| 组件挂载时间 | <0.1ms | 组件初始渲染性能 |
| 组件更新时间 | <0.05ms | 组件重新渲染性能 |
| 打包体积 | <10KB (gzipped) | 最小化运行时体积 |

## 📁 项目结构

```
packages/
├── reactivity/ # 响应式系统核心
│ ├── src/
│ │ ├── signal.ts # Signal工厂，依赖收集
│ │ ├── effect.ts # 副作用追踪
│ │ ├── computed.ts # 计算属性
│ │ ├── reactive.ts # Proxy响应式对象
│ │ ├── batch.ts # 批量更新
│ │ └── index.ts # 模块导出
│ └── test/ # 单元测试
├── runtime-core/ # 组件渲染引擎
├── runtime-dom/ # DOM环境适配器
├── compiler-core/ # 模板编译器
├── compiler-sfc/ # 单文件组件编译
├── router/ # 路由系统
├── ld/ # 框架主入口
├── vite-plugin/ # Vite插件
├── cli/ # 命令行工具
└── devtools/ # 开发者工具
```

## 🔧 核心特性

### 1. 信号响应式系统

- 零虚拟DOM，细粒度更新
- 自定义相等函数优化
- 内存池复用 Signal 实例
- WeakMap 缓存依赖关系

### 2. 智能副作用追踪

- 自动依赖收集与清理
- 嵌套 effect 支持
- 优先级调度系统
- effect 去重与批量执行

### 3. 高性能计算属性

- 惰性求值 + 缓存机制
- 脏标记优化
- 循环计算检测
- 类型安全的依赖追踪

### 4. 深层响应式代理

- Proxy 深度拦截
- 数组方法优化
- WeakMap 代理缓存
- 生产环境去调试代码

### 5. 智能批量更新

- 微任务调度
- 嵌套 batch 支持
- effect 去重执行
- 性能统计与监控

## 🏗️ 实现步骤

### 第一阶段：响应式系统（当前进行中）

- ✅ signal.ts - Signal 基础实现
- ✅ effect.ts - 副作用追踪系统
- ✅ computed.ts - 计算属性实现
- ✅ reactive.ts - Proxy 响应式对象
- 🔄 batch.ts - 批量更新系统（当前任务）
- ⏳ scheduler.ts - 调度器系统
- ⏳ store.ts - 全局状态管理

### 第二阶段：运行时系统

- ⏳ runtime-core - 组件渲染引擎
- ⏳ runtime-dom - DOM 操作适配器

### 第三阶段：编译系统

- ⏳ compiler-core - 模板到 AST 转换
- ⏳ compiler-sfc - 单文件组件编译

### 第四阶段：生态工具

- ⏳ router - 路由系统
- ⏳ ld-main - 框架主入口
- ⏳ vite-plugin - Vite 集成
- ⏳ cli - 命令行工具
- ⏳ devtools - 开发者工具

## ⚡ 优化策略

### 架构优化

- 无虚拟DOM: 直接操作 DOM，减少中间层
- 信号驱动: 细粒度更新，最小化渲染
- Tree Shaking: 按需导入，最小打包体积
- ES Modules: 原生模块支持

### 性能优化

- AOT 编译: 提前编译，减少运行时开销
- 静态提升: 静态节点编译时提取
- 常量折叠: 编译时计算常量表达式
- 内存池: 对象复用，减少 GC 压力
- 全面缓存: 频繁计算的结果缓存
- 惰性求值: 延迟计算直到需要时

### 代码质量

- 100% 类型安全: 严格的 TypeScript 配置
- 零 Bug 原则: 完善的测试覆盖
- 内存安全: 自动资源清理
- 最小化包体积: 持续优化大小

## 📋 注意事项

### 开发规范

- 中文文档: 所有代码注释、JSDoc 和说明性文本必须使用中文
- 状态管理: 所有跨模块共享的内部状态必须在专用的 store.ts 模块中管理
- 全局 vs 实例状态: 明确区分全局状态（globalState）和实例状态（createInstanceStore）
- 类型安全: 禁止使用 any 类型，必须明确定义类型

### 测试要求

- 测试驱动: 每个文件生成后必须立即生成/更新对应的测试文件
- 测试覆盖: 必须包含正常用例、边界用例和错误用例
- 失败验证: 先添加可能导致测试不通过的用例，修复后再继续
- 独立运行: 修改单个文件后只运行对应的测试文件

### 工作流程

- 依赖分析: 生成代码前必须分析现有模块导出和依赖关系
- 状态更新: 每次操作后必须立即更新配置文件中的当前状态
- 测试验证: 所有测试通过后才能继续下一步
- 文档同步: 模块完成后必须生成 README.md 和 rollup.config.js

## 🛠️ 开发命令

### 基础命令

```bash
# 开发模式
pnpm dev:all # 启动所有开发服务

# 构建
pnpm build:fast # 快速构建（跳过测试和类型检查）
pnpm build:prod # 生产构建

# 测试
pnpm test # 运行所有测试
pnpm test:watch # 监听模式运行测试
pnpm test:coverage # 生成覆盖率报告
pnpm test:ui # 启动测试UI界面
```

### AI 开发专用命令

```bash
# AI测试运行器
pnpm test:ai # 运行测试并生成AI友好的报告
pnpm test:ai:results # 读取上次测试结果
node scripts/ai-test-helper.mts analyze # 分析测试失败原因
node scripts/ai-test-helper.mts check # 检查是否可以继续下一步

# 基准测试
pnpm bench # 运行所有基准测试
pnpm bench:reactivity # 运行响应式系统基准测试
pnpm bench:render # 运行渲染基准测试
pnpm bench:compiler # 运行编译基准测试
pnpm bench:memory # 运行内存基准测试
```

### 代码质量

```bash
# 代码检查
pnpm lint # ESLint检查
pnpm lint:fix # 自动修复ESLint问题
pnpm type-check # TypeScript类型检查

# 代码格式化
pnpm format # Prettier格式化代码
pnpm format:check # 检查代码格式

# 综合检查
pnpm check # 运行完整检查
pnpm ci # CI流程（lint + type-check + test + build）
```

## 🔍 模块依赖关系

```
reactivity (独立)
├── runtime-core
│ ├── runtime-dom
│ └── compiler-core
│ └── compiler-sfc
└── router
└── ld-main
├── vite-plugin
├── cli
└── devtools
```

## 📈 质量保证

### 测试覆盖率要求

- 语句覆盖率: ≥95%
- 分支覆盖率: ≥95%
- 函数覆盖率: ≥95%
- 行覆盖率: ≥95%

### 代码检查规则

- ESLint: @typescript-eslint/recommended 规则集
- 禁止 any: 必须使用明确定义的类型
- 无未使用变量: 所有声明必须被使用
- 导入导出规范: 统一导入导出格式

### 构建配置

- Rollup: 每个模块独立的 rollup.config.js
- 输出格式: ESM 和 CJS 双格式
- 类型生成: 独立的 .d.ts 类型声明文件
- 最小化: 生产环境代码压缩和优化

## 🚧 当前状态

- **当前模块**: reactivity
- **当前文件**: batch.ts (进行中)
- **已完成文件**: signal.ts, effect.ts, computed.ts, reactive.ts

**下一步:**

- 完成 batch.ts 的实现
- 生成对应的测试文件
- 运行测试并验证
- 更新模块导出和全局导出
- 生成 README.md 和 rollup.config.js

## 🤝 贡献指南

### 开发流程

- 读取配置: 开发前必须仔细阅读 generate-code-guidance.json
- 依赖分析: 分析现有模块导出，确保依赖关系正确
- 代码生成: 按照配置生成高质量的 TypeScript 代码
- 测试验证: 立即运行测试，确保所有用例通过
- 文档更新: 更新相关文档和配置

### 提交规范

- 提交前: 必须通过所有测试和 lint 检查
- 提交信息: 使用中文描述，清晰说明变更内容
- 分支策略: feature/模块名-功能 分支命名

### 版本发布

- 语义化版本: 严格遵循 SemVer 规范
- 变更记录: 使用 Changesets 管理变更日志
- 自动发布: CI/CD 流程自动发布到 NPM

## 📄 许可证

MIT License - 详见 LICENSE 文件

---

LD 框架 - 重新定义前端框架的性能极限，为下一代 Web 应用提供极致性能的解决方案。

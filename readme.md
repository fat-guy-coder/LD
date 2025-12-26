# LD - 极致性能前端框架

LD（Very Light & Fast）是一个面向极致性能的现代前端框架，专为追求高性能、小体积和快速渲染的现代 Web 应用而设计。框架采用模块化架构，结合信号（Signals）响应式系统和先进的编译器技术，提供卓越的开发体验和运行时性能。

## 核心特性

### 性能优先
- 极速渲染：基于信号的细粒度响应式更新
- 超小体积：极致代码压缩与 Tree Shaking 优化
- 高效编译：先进的模板编译技术
- 低内存占用：优化的内存管理策略

### 现代化开发体验
- TypeScript 原生支持  
- 模块化架构设计  
- 完善的开发工具链  
- 丰富的性能测试套件

### 模块化设计
- 可独立使用的子模块
- 清晰的模块边界
- 灵活的集成方案

## 项目结构

```text
ld/
├── packages/           # 核心模块包
│   ├── @ld/reactivity # 响应式系统核心
│   ├── @ld/runtime    # 运行时核心
│   ├── @ld/compiler   # 模板编译器
│   └── ...             # 其他模块
├── scripts/            # 构建和开发脚本
└── tools/              # 开发工具
```

## 核心模块介绍

### 1. @ld/reactivity - 响应式系统
基于信号的响应式引擎，提供比传统响应式系统更高的性能和更精确的更新机制。

特点：
- 基于 Signal 的细粒度响应式
- 零依赖追踪开销
- 自动依赖收集与清理
- 批量更新优化
- 内存泄漏防护

### 2. @ld/runtime - 运行时核心
框架的核心运行时，处理组件生命周期、虚拟 DOM、渲染调度等核心功能。

特点：
- 虚拟 DOM 优化
- 差异化渲染算法
- 组件生命周期管理
- 渲染调度器
- 错误边界处理

### 3. @ld/compiler - 模板编译器
将模板编译为高性能的渲染函数，支持多种优化策略。

特点：
- 静态内容提升
- 动态节点标记
- 指令编译优化
- 树结构扁平化
- 体积感知编译

### 4. @ld/cli - 命令行工具
项目脚手架和开发工具，提供开发、构建、测试等一站式解决方案。

特点：
- 项目创建和初始化
- 开发服务器
- 构建优化
- 代码生成
- 性能分析

## package.json 详解

### 基础信息
- name: ld
- version: 0.1.0
- type: module
- license: MIT

### 核心配置
- workspaces: 使用 pnpm workspaces 管理多包
- engines: Node.js ≥ 18.0.0, pnpm ≥ 8.0.0
- packageManager: 指定 pnpm 版本

### 开发依赖概览

#### 构建工具链
- esbuild
- rollup
- tsup
- vite

#### TypeScript 生态
- typescript
- ts-node
- tsx
- @typescript-eslint/*

#### 测试工具
- vitest
- @vitest/ui
- @vitest/coverage-v8
- jsdom

#### 代码质量
- eslint
- prettier
- lint-staged
- husky

#### 开发工具
- chokidar
- concurrently
- cross-env
- ora
- chalk
- cli-table3
- semver
- rimraf

#### 发布管理
- @changesets/cli
- inquirer

## 脚本命令

### 开发相关
- `pnpm dev`：使用 tsx 运行开发脚本
- `pnpm dev:reactivity`：针对 @ld/reactivity 包开发
- `pnpm dev:cli`：CLI 开发模式
- `pnpm dev:watch`：TypeScript 监视类型检查
- `pnpm dev:all`：并行启动多个开发服务

### 构建相关
- `pnpm build`：标准构建
- `pnpm build:all`：构建所有模块
- `pnpm build:prod`：生产环境构建
- `pnpm build:types`：生成类型声明
- `pnpm build:clean`：清理构建产物
- `pnpm build:fast`：快速构建（跳过测试与类型）

### 类型检查
- `pnpm type-check`
- `pnpm type-check:all`
- `pnpm type-check:watch`

### 测试相关
- `pnpm test`
- `pnpm test:watch`
- `pnpm test:coverage`
- `pnpm test:ui`
- `pnpm test:bench`

### AI 辅助测试
- `pnpm test:ai`：运行为 AI 设计的测试套件，输出 JSON 格式的结果。
- `pnpm test:ai:watch`：在监听模式下运行 AI 测试。
- `pnpm test:ai:coverage`：运行 AI 测试并生成覆盖率报告。
- `pnpm test:ai:results`：读取并显示上一次 AI 测试的结果。
- `pnpm test:ai:clean`：清理 AI 测试结果缓存。
- `pnpm test:ai:filter=<keyword>`：运行包含特定关键词的 AI 测试。

### 性能基准
- `pnpm bench`
- `pnpm bench:reactivity`
- `pnpm bench:render`
- `pnpm bench:compiler`
- `pnpm bench:memory`

### 代码质量
- `pnpm lint`
- `pnpm lint:fix`
- `pnpm lint:staged`
- `pnpm format`
- `pnpm format:check`

### 检查与分析
- `pnpm check`
- `pnpm check:quick`
- `pnpm analyze`
- `pnpm analyze:size`
- `pnpm analyze:deps`

### 发布管理
- `pnpm release`
- `pnpm release:dry`
- `pnpm release:patch | minor | major`
- `pnpm publish`
- `pnpm publish:dry`
- `pnpm changeset`
- `pnpm version`

### 清理与维护
- `pnpm clean`
- `pnpm clean:all`
- `pnpm clean:reports`

### CI/CD
- `pnpm ci`
- `pnpm ci:quick`

### 其他
- `pnpm prepare`
- `pnpm postinstall`

## 技术架构亮点

### 信号响应式系统
- 基于现代信号理念的响应式实现
- 细粒度更新，避免不必要的渲染
- 零配置依赖追踪
- 优秀的 TypeScript 支持

### 编译器优化
- 编译时静态分析
- 模板预编译优化
- 运行时代码生成
- 体积感知优化

### 模块化设计
- 每个模块可独立使用
- 清晰的 API 边界
- 灵活的集成方案
- 渐进式采用

### 开发者体验
- 完整的 TypeScript 支持
- 丰富的开发工具
- 详尽的性能分析
- 完善的测试套件

## 性能目标
- 体积：< 10KB gzipped（运行时核心）
- 启动时间：< 50ms（冷启动）
- 更新速度：< 1ms（典型组件更新）
- 内存占用：< 1MB（基础应用）

## 快速开始

```bash
# 克隆项目
git clone https://github.com/fat-guy-coder/ld.git
cd ld

# 安装依赖
pnpm install

# 启动开发
pnpm dev

# 运行测试
pnpm test

# 构建项目
pnpm build:prod
```

## 学习资源
- API 文档
- 性能指南
- 迁移指南
- 示例项目

## 贡献指南
我们欢迎各种形式的贡献！请查看贡献指南了解详细信息。

## 许可证
本项目基于 MIT License 开源。

> LD - 为极致性能而生的前端框架，让每一次渲染都更快、更轻、更好！

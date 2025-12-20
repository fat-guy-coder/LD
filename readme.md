# VLD - 极致性能前端框架

<p align="center">
  <img src="https://img.shields.io/badge/性能-极致-blue" alt="性能极致">
  <img src="https://img.shields.io/badge/体积-<10KB-green" alt="体积小于10KB">
  <img src="https://img.shields.io/badge/更新延迟-<1ms-red" alt="更新延迟小于1ms">
  <img src="https://img.shields.io/badge/Vue3-完全兼容-orange" alt="Vue3完全兼容">
</p>

VLD（Vue Light & Fast）是一个极致性能的前端框架，采用 Signal 响应式系统、多线程渲染和编译时优化，提供与 Vue 3 完全兼容的语法体验。

## 📦 包结构

### 核心包
- **@vld/reactivity** - Signal 响应式系统，更新延迟 <1ms
- **@vld/router** - Vue Router 兼容路由，支持动态路由和守卫
- **@vld/compiler-core** - 模板编译器，编译为直接 DOM 操作
- **@vld/compiler-sfc** - .vue 单文件组件编译器
- **@vld/runtime-core** - 运行时核心，支持多线程渲染
- **@vld/runtime-dom** - DOM 运行时适配器
- **@vld/vld** - 主框架入口，Vue 3 兼容 API

### 工具包
- **@vld/vite-plugin** - Vite 插件，支持 .vue 文件热更新
- **@vld/cli** - 命令行工具，项目脚手架
- **@vld/devtools** - 浏览器开发者工具扩展

## 🚀 脚本命令

### 开发命令
```bash
# 启动完整开发环境
pnpm dev

# 仅启动响应式系统开发
pnpm dev:reactivity

# 启动 CLI 开发模式（监听文件变化）
pnpm dev:cli

# TypeScript 监听编译
pnpm dev:watch

# 启动所有开发服务
pnpm dev:all
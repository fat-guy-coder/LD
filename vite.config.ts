import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { vitePluginDevConsole } from './scripts/vite-plugin-dev-console.mts'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = __dirname
const packagesDir = resolve(rootDir, 'packages')

/**
 * LD 框架开发服务器配置
 * @description 提供开发环境的热更新、路径别名和模块解析
 */
export default defineConfig({
  // 根目录设置为项目根目录，以便访问所有包
  root: rootDir,
  
  // 服务器配置
  server: {
    port: 3000,
    host: true,
    open: true,
    cors: true,
    fs: {
      // 允许访问项目根目录和所有包目录
      allow: [rootDir, packagesDir],
    },
  },

  // 路径别名配置
  resolve: {
    alias: {
      '@ld/reactivity': resolve(packagesDir, 'reactivity/src'),
      '@ld/runtime-core': resolve(packagesDir, 'runtime-core/src'),
      '@ld/runtime-dom': resolve(packagesDir, 'runtime-dom/src'),
      '@ld/compiler-core': resolve(packagesDir, 'compiler-core/src'),
      '@ld/compiler-sfc': resolve(packagesDir, 'compiler-sfc/src'),
      '@ld/router': resolve(packagesDir, 'router/src'),
      '@ld/ld': resolve(packagesDir, 'ld/src'),
      '@ld/vite-plugin': resolve(packagesDir, 'vite-plugin/src'),
      '@ld/cli': resolve(packagesDir, 'cli/src'),
      '@ld/devtools': resolve(packagesDir, 'devtools/src'),
      // 通用别名，匹配所有 @ld/* 模块
      '@ld': resolve(packagesDir),
    },
  },

  // 依赖优化
  optimizeDeps: {
    include: ['@ld/reactivity', '@ld/router'],
    exclude: [],
  },

  // 构建配置
  build: {
    target: 'esnext',
    minify: false,
    sourcemap: true,
  },

  // TypeScript 配置
  esbuild: {
    target: 'esnext',
    format: 'esm',
  },

  // 插件配置
  plugins: [
    vitePluginDevConsole(),
  ],
})


import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { vitePluginDevConsole } from './scripts/vite-plugin-dev-console.mts'
import fs from 'fs'
import path from 'path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = __dirname
const srcDir = resolve(projectRoot, 'src')
const packagesDir = resolve(projectRoot, 'packages')

/**
 * LD 框架开发服务器配置
 * @description 提供开发环境的热更新、路径别名和模块解析
 */
export default defineConfig({
  // 1. 将 root 设置为 src 目录
  root: srcDir,

  // 服务器配置
  server: {
    port: 3000,
    host: true,
    open: false, // 禁用自动打开
    cors: true,
    fs: {
      // 2. 允许 Vite 服务器从 src 目录访问到项目根目录
      allow: [projectRoot],
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
      '@ld/vite-plugin': resolve(packagesDir, 'vite-plugin/src/'),
      '@ld/cli': resolve(packagesDir, 'cli/src'),
      '@ld/devtools': resolve(packagesDir, 'devtools/src'),
      '@ld': resolve(packagesDir),
    },
  },

  // 依赖优化
  optimizeDeps: {
    include: ['@ld/reactivity', '@ld/router'],
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
    // @ld/vite-plugin: provides .vue export enhancements + AOT PoC transforms
    (await import('@ld/vite-plugin')).default(),
    {
      name: 'serve-statistics-json',
      configureServer(server) {
        server.middlewares.use('/statistics', (req, res, next) => {
          if (!req.url) {
            return next();
          }
          const filePath = path.join(projectRoot, 'statistics', req.url);

          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            fs.createReadStream(filePath).pipe(res);
          } else {
            next();
          }
        });
      },
    },
  ],
})

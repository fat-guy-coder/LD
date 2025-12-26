import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '**/*.d.ts'],
    
    /* 性能测试配置 */
    benchmark: {
      include: ['packages/**/*.bench.{ts,tsx}']
    },
    
    /* 覆盖率为100%目标 */
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/vitest.config.{ts,js}',
        '**/vitest.setup.{ts,js}'
      ],
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95
      }
    },
    
    /* 测试超时设置 */
    testTimeout: 10000,
    hookTimeout: 10000,
    
    /* 类型检查测试 */
    typecheck: {
      enabled: true,
      include: ['packages/**/*.{test,spec}.{ts,tsx}']
    }
  },
  resolve: {
    alias: {
      '@ld/reactivity': resolve(__dirname, 'packages/reactivity/src'),
      '@ld/router': resolve(__dirname, 'packages/router/src'),
      '@ld/compiler-core': resolve(__dirname, 'packages/compiler-core/src'),
      '@ld/compiler-sfc': resolve(__dirname, 'packages/compiler-sfc/src'),
      '@ld/runtime-core': resolve(__dirname, 'packages/runtime-core/src'),
      '@ld/runtime-dom': resolve(__dirname, 'packages/runtime-dom/src'),
      '@ld/ld': resolve(__dirname, 'packages/ld/src'),
      '@ld/vite-plugin': resolve(__dirname, 'packages/vite-plugin/src'),
      '@ld/cli': resolve(__dirname, 'packages/cli/src'),
      '@ld/devtools': resolve(__dirname, 'packages/devtools/src')
    }
  }
})
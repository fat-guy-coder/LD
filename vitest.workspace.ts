import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  // reactivity 包
  {
    extends: './packages/reactivity/vitest.config.ts',
    test: {
      name: 'reactivity',
      include: ['packages/reactivity/src/**/*.test.ts'],
      environment: 'node'
    }
  },
  
  // router 包
  {
    extends: './packages/router/vitest.config.ts',
    test: {
      name: 'router',
      include: ['packages/router/src/**/*.test.ts'],
      environment: 'jsdom'
    }
  },
  
  // compiler-core 包
  {
    extends: './packages/compiler-core/vitest.config.ts',
    test: {
      name: 'compiler-core',
      include: ['packages/compiler-core/src/**/*.test.ts'],
      environment: 'node'
    }
  },
  
  // runtime-core 包
  {
    extends: './packages/runtime-core/vitest.config.ts',
    test: {
      name: 'runtime-core',
      include: ['packages/runtime-core/src/**/*.test.ts'],
      environment: 'jsdom'
    }
  },
  
  // 所有包的集成测试
  {
    test: {
      name: 'integration',
      include: ['tests/**/*.test.ts'],
      environment: 'jsdom'
    }
  }
])
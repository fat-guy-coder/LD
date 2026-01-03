import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: [
      { find: '@ld/reactivity', replacement: resolve(__dirname, 'packages/reactivity/src') },
      { find: '@ld/runtime-core', replacement: resolve(__dirname, 'packages/runtime-core/src') },
      { find: '@ld/runtime-dom', replacement: resolve(__dirname, 'packages/runtime-dom/src') },
      { find: '@ld/compiler-core', replacement: resolve(__dirname, 'packages/compiler-core/src') },
      { find: '@ld/compiler-sfc', replacement: resolve(__dirname, 'packages/compiler-sfc/src') },
      { find: '@ld/router', replacement: resolve(__dirname, 'packages/router/src') },
      { find: '@ld/ld', replacement: resolve(__dirname, 'packages/ld/src') },
      { find: '@ld/vite-plugin', replacement: resolve(__dirname, 'packages/vite-plugin/src') },
      { find: '@ld/cli', replacement: resolve(__dirname, 'packages/cli/src') },
      { find: '@ld/devtools', replacement: resolve(__dirname, 'packages/devtools/src') },
      { find: '@ld/runtime-jsx', replacement: resolve(__dirname, 'packages/runtime-jsx/src') },
      { find: '@ld/react', replacement: resolve(__dirname, 'packages/react/src') },
      { find: '@ld/vue', replacement: resolve(__dirname, 'packages/vue/src') },
      { find: '@ld/babel-plugin-ld', replacement: resolve(__dirname, 'packages/babel-plugin-ld/src') },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});

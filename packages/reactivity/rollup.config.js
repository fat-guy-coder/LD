import { defineConfig } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { babel } from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'
import dts from 'rollup-plugin-dts'

const packageJson = require('./package.json')

const external = id => !id.startsWith('.') && !id.startsWith('/')

export default defineConfig([
    // ES模块构建
  {
    input: 'src/index.ts',
    external,
    output: [
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
        exports: 'named'
      }
    ],
    plugins: [
      nodeResolve({
        extensions: ['.ts', '.js']
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationDir: null
      }),
      babel({
        babelHelpers: 'bundled',
        extensions: ['.ts'],
        presets: [
          ['@babel/preset-env', { targets: '>0.2%, not dead, not op_mini all' }],
          '@babel/preset-typescript'
        ]
      }),
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false
        }
      })
    ]
  },
  
  // CommonJS构建
  {
    input: 'src/index.ts',
    external,
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      }
    ],
    plugins: [
      nodeResolve({
        extensions: ['.ts', '.js']
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationDir: null
      }),
      babel({
        babelHelpers: 'bundled',
        extensions: ['.ts'],
        presets: [
          ['@babel/preset-env', { targets: '>0.2%, not dead, not op_mini all' }],
          '@babel/preset-typescript'
        ]
      })
    ]
  },
  
  // 类型声明
  {
    input: 'src/index.ts',
    output: [{ file: 'dist/types/index.d.ts', format: 'es' }],
    plugins: [dts()]
  },
  
  // 单独的文件构建（用于树摇优化）
  {
    input: {
      'signal': 'src/signal.ts',
      'effect': 'src/effect.ts',
      'computed': 'src/computed.ts',
      'reactive': 'src/reactive.ts',
      'batch': 'src/batch.ts',
      'scheduler': 'src/scheduler.ts',
      'untracked': 'src/untracked.ts',
      'utils/equals': 'src/utils/equals.ts'
    },
    external,
    output: [
      {
        dir: 'dist',
        format: 'esm',
        entryFileNames: '[name].esm.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        sourcemap: true
      }
    ],
    plugins: [
      nodeResolve({
        extensions: ['.ts', '.js']
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationDir: null
      }),
      babel({
        babelHelpers: 'bundled',
        extensions: ['.ts'],
        presets: [
          ['@babel/preset-env', { targets: '>0.2%, not dead, not op_mini all' }],
          '@babel/preset-typescript'
        ]
      })
    ]
  }
])
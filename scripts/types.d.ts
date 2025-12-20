/// <reference types="node" />
/// <reference types="vitest" />

declare module 'chalk' {
    export const cyan: (text: string) => string
    export const green: (text: string) => string
    export const red: (text: string) => string
    export const yellow: (text: string) => string
    export const gray: (text: string) => string
    export const bold: (text: string) => string
    export const magenta: (text: string) => string
    export const blue: (text: string) => string
  }
  
  declare module 'ora' {
    export default function ora(options: string | { text: string }): {
      start: () => any
      succeed: (text?: string) => void
      fail: (text?: string) => void
      warn: (text?: string) => void
      info: (text?: string) => void
      stop: () => void
    }
  }
  
  declare module 'cli-table3' {
    export default class Table {
      constructor(options?: any)
      push(row: any[]): void
      toString(): string
    }
  }
  
  declare module 'inquirer' {
    export function prompt(questions: any[]): Promise<any>
  }
  
  declare module 'semver' {
    export function inc(version: string, release: string): string | null
    export function valid(version: string): string | null
  }
  
  declare module 'zlib' {
    export function gzipSync(data: Buffer): Buffer
  }
  
  declare global {
    namespace NodeJS {
      interface ProcessEnv {
        NODE_ENV: 'development' | 'production' | 'test'
        npm_package_version: string
        FORCE_COLOR: string
      }
    }
  }
  
  export {}
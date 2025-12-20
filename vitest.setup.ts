import { vi } from 'vitest'

// 全局测试设置
vi.mock('@vld/reactivity', () => import('./packages/reactivity/src'))

// 设置全局测试超时
vi.setConfig({ testTimeout: 10000 })

// 模拟浏览器环境
if (typeof globalThis.window === 'undefined') {
  const { window } = new (await import('@vitest/utils')).JSDOM('<!DOCTYPE html>')
  globalThis.window = window
  globalThis.document = window.document
  globalThis.navigator = window.navigator
  globalThis.HTMLElement = window.HTMLElement
  globalThis.SVGElement = window.SVGElement
  globalThis.Text = window.Text
  globalThis.Comment = window.Comment
}
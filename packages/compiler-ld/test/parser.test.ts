import { describe, it, expect } from 'vitest'
import { parse } from '../src/index'

describe('LD Compiler - Parser', () => {
  it('should correctly parse a simple .ld file', () => {
    const source = `
      <template>
        <div>{msg}</div>
      </template>

      <script>
        S: msg: string = 'hello world'
      </script>

      <style scoped>
        div {
          color: red;
        }
      </style>
    `

    const descriptor = parse(source, 'test-component')

    // Check if the descriptor and its id are correct
    expect(descriptor).not.toBeNull()
    expect(descriptor.id).toBe('test-component')

    // Check template block
    expect(descriptor.template).not.toBeNull()
    expect(descriptor.template?.content.trim()).toBe('<div>{msg}</div>')

    // Check script block
    // Note: @vue/compiler-sfc treats <script> as <script setup> by default
    expect(descriptor.scriptSetup).not.toBeNull()
    expect(descriptor.scriptSetup?.content.trim()).toBe("S: msg: string = 'hello world'")

    // Check style block
    expect(descriptor.styles).toHaveLength(1)
    expect(descriptor.styles[0].scoped).toBe(true)
    expect(descriptor.styles[0].content.trim()).toContain('color: red;')
  })

  it('should throw an error for malformed source code', () => {
    const source = `<template><div></template><script` // Incomplete script tag
    expect(() => parse(source, 'error-component')).toThrowError('[LD Compiler] Failed to parse error-component.ld')
  })

  it('should handle files with missing blocks', () => {
    const source = `<template><div>Just a template</div></template>`
    const descriptor = parse(source, 'template-only')

    expect(descriptor.template).not.toBeNull()
    expect(descriptor.script).toBeNull()
    expect(descriptor.scriptSetup).toBeNull()
    expect(descriptor.styles).toHaveLength(0)
  })
})

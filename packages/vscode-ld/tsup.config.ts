import { defineConfig } from 'tsup'
import { readFileSync } from 'fs'
import { join } from 'path'

export default defineConfig({
  entry: ['src/extension.ts'],
  format: ['cjs'],
  platform: 'node',
  target: 'node18',
  outDir: 'out',
  clean: true,
  splitting: false,
  bundle: true,
  sourcemap: false,
  external: ['vscode', '@vue/compiler-sfc'],
  noExternal: ['prettier'],
  // 构建后验证：确保 diagnostics 相关文件没有被包含
  // 这可以防止意外导入导致运行时错误（因为 @vue/compiler-sfc 可能未安装）
  onSuccess: async () => {
    try {
      const outputFile = join(process.cwd(), 'out', 'extension.js')
      const content = readFileSync(outputFile, 'utf-8')
      
      // 检查是否意外包含了 diagnostics 相关的类定义
      // 如果 extension.ts 没有导入这些文件，这些类不应该出现在输出中
      if (content.includes('class LDDiagnosticsProvider') || 
          content.includes('class LDLazyDiagnosticsProvider')) {
        console.warn('⚠️  警告：构建输出中包含了 diagnostics 相关代码')
        console.warn('   这可能导致运行时错误，因为 @vue/compiler-sfc 可能未安装')
        console.warn('   请检查 extension.ts 是否意外导入了 diagnostics 相关文件')
      } else {
        console.log('✓ 构建验证通过：diagnostics 相关文件未被包含，可以安全运行')
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // 文件不存在，可能是首次构建或 watch 模式，跳过验证
        return
      }
      throw error
    }
  },
})

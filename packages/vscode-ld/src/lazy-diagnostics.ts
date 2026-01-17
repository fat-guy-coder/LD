import * as vscode from 'vscode'

/**
 * 诊断提供者懒加载包装：避免扩展激活阶段因诊断逻辑/依赖问题导致激活失败。
 */
export class LDLazyDiagnosticsProvider {
  private provider: { updateDiagnostics(document: vscode.TextDocument): void; dispose(): void } | null = null
  private initError: unknown = null

  private ensureProvider(): { updateDiagnostics(document: vscode.TextDocument): void; dispose(): void } | null {
    if (this.provider || this.initError) return this.provider

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('./diagnostics') as { LDDiagnosticsProvider?: new () => any }
      if (typeof mod.LDDiagnosticsProvider === 'function') {
        this.provider = new mod.LDDiagnosticsProvider()
        return this.provider
      }
      this.initError = new Error('LDDiagnosticsProvider not found')
      return null
    } catch (e) {
      this.initError = e
      return null
    }
  }

  public updateDiagnostics(document: vscode.TextDocument): void {
    const p = this.ensureProvider()
    if (!p) return
    try {
      p.updateDiagnostics(document)
    } catch {
      // ignore
    }
  }

  public dispose(): void {
    try {
      this.provider?.dispose()
    } catch {
      // ignore
    }
  }
}

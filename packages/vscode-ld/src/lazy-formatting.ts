import * as vscode from 'vscode'
import { LDFormatter } from './formatter'

/**
 * 仅在真正触发格式化时才加载prettier格式化器，避免扩展激活阶段因依赖/路径问题失败。
 */
export class LDLazyFormattingProvider implements vscode.DocumentFormattingEditProvider {
  private readonly basic: LDFormatter
  private prettierProvider: vscode.DocumentFormattingEditProvider | null = null
  private prettierInitError: unknown = null

  constructor() {
    this.basic = new LDFormatter()
  }

  provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    if (!this.prettierProvider && !this.prettierInitError) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require('./prettier-formatter') as { LDPrettierFormatter?: new () => vscode.DocumentFormattingEditProvider }
        if (typeof mod.LDPrettierFormatter === 'function') {
          this.prettierProvider = new mod.LDPrettierFormatter()
        } else {
          this.prettierInitError = new Error('LDPrettierFormatter not found')
        }
      } catch (e) {
        this.prettierInitError = e
      }
    }

    if (this.prettierProvider) {
      try {
        return this.prettierProvider.provideDocumentFormattingEdits(document, options, token)
      } catch {
        // ignore and fallback
      }
    }

    return this.basic.provideDocumentFormattingEdits(document, options, token)
  }
}

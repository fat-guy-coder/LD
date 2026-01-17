import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';

// 动态加载 @vue/compiler-sfc，避免把它作为硬依赖（VSIX 不包含时也能正常激活）
// 将 require 移到函数内部，避免在模块加载时执行
let sfcParse: ((source: string, options: { filename?: string; sourceMap?: boolean }) => { descriptor: any; errors: unknown[] }) | null = null;
let sfcParseLoaded = false;

function loadSfcParse(): ((source: string, options: { filename?: string; sourceMap?: boolean }) => { descriptor: any; errors: unknown[] }) | null {
  if (sfcParseLoaded) {
    return sfcParse;
  }
  sfcParseLoaded = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sfc = require('@vue/compiler-sfc') as { parse?: unknown };
    if (typeof (sfc as any).parse === 'function') {
      sfcParse = (sfc as any).parse;
      return sfcParse;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * LD文件诊断提供者
 */
export class LDDiagnosticsProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('ld');
  }

  /**
   * 更新诊断信息
   */
  public updateDiagnostics(document: vscode.TextDocument): void {
    const diagnostics: vscode.Diagnostic[] = [];

    try {
      const text = document.getText();

      // 优先使用 @vue/compiler-sfc 解析（如果可用）；否则降级为纯文本结构检查
      // 延迟加载 sfcParse，避免在模块加载时执行
      const parseFn = loadSfcParse();
      if (!parseFn) {
        const structureDiagnostics = this.checkStructure(text, document);
        diagnostics.push(...structureDiagnostics);
        this.diagnosticCollection.set(document.uri, diagnostics);
        return;
      }

      // 确保 filename 是一个有效的绝对路径字符串
      // 使用函数来确保返回值始终是有效的字符串
      const getValidFilename = (): string => {
        try {
          // 尝试从 document.fileName 获取
      let filename: string | undefined = document.fileName;
          if (filename && filename !== '' && typeof filename === 'string') {
            try {
              if (path.isAbsolute(filename)) {
                return filename;
              }
              const resolved = path.resolve(filename);
              if (resolved && resolved !== '' && typeof resolved === 'string') {
                return resolved;
              }
            } catch {
              // 忽略错误，继续尝试其他方法
            }
          }
          
          // 尝试从 URI 获取
        if (document.uri.scheme === 'file') {
          filename = document.uri.fsPath;
            if (filename && filename !== '' && typeof filename === 'string') {
              try {
                if (path.isAbsolute(filename)) {
                  return filename;
        }
                const resolved = path.resolve(filename);
                if (resolved && resolved !== '' && typeof resolved === 'string') {
                  return resolved;
                }
              } catch {
                // 忽略错误，继续尝试其他方法
              }
            }
          }
        } catch {
          // 忽略所有错误，使用临时路径
        }
        
        // 如果所有方法都失败，使用临时路径（确保是绝对路径）
        try {
          const tempFilename = path.join(os.tmpdir(), `ld-${Date.now()}-${Math.random().toString(36).substring(7)}.ld`);
          // 确保返回的路径是绝对路径
          return path.isAbsolute(tempFilename) ? tempFilename : path.resolve(tempFilename);
        } catch {
          // 最后的兜底方案
          return path.join(os.tmpdir(), 'ld-temp.ld');
        }
      };

      let finalFilename: string;
      try {
        finalFilename = getValidFilename();
      } catch (error) {
        // 如果获取文件名失败，使用默认临时文件
        finalFilename = path.join(os.tmpdir(), 'ld-temp.ld');
      }
      
      // 最终安全检查：确保 finalFilename 绝对不是 undefined
      if (!finalFilename || typeof finalFilename !== 'string' || finalFilename === '') {
        finalFilename = path.join(os.tmpdir(), 'ld-temp.ld');
      }
      
      // 确保是绝对路径
      if (!path.isAbsolute(finalFilename)) {
        try {
          finalFilename = path.resolve(finalFilename);
        } catch {
          finalFilename = path.join(os.tmpdir(), 'ld-temp.ld');
        }
      }

      // 最终验证：确保 finalFilename 是有效的绝对路径字符串
      if (!finalFilename || typeof finalFilename !== 'string' || finalFilename === '' || !path.isAbsolute(finalFilename)) {
        // 如果仍然无效，使用绝对路径的临时文件
        finalFilename = path.resolve(path.join(os.tmpdir(), `ld-${Date.now()}-${Math.random().toString(36).substring(7)}.ld`));
      }

      // 再次确保是绝对路径（双重保险）
      try {
        if (!path.isAbsolute(finalFilename)) {
          finalFilename = path.resolve(finalFilename);
        }
      } catch {
        // 如果解析失败，使用系统临时目录
        finalFilename = path.join(os.tmpdir(), 'ld-temp.ld');
        if (!path.isAbsolute(finalFilename)) {
          finalFilename = path.resolve(finalFilename);
        }
      }

      // 验证 finalFilename 绝对不是 undefined 或空
      if (!finalFilename || typeof finalFilename !== 'string' || finalFilename === '') {
        console.error('无法生成有效的文件名，跳过诊断');
        this.diagnosticCollection.set(document.uri, diagnostics);
        return;
      }

      // 调用 sfcParse 前再次验证
      let descriptor: any;
      let errors: unknown[] = [];
      
      try {
        const result = parseFn(text, {
          sourceMap: false,
          filename: finalFilename,
        });
        descriptor = result.descriptor;
        errors = result.errors || [];
      } catch (parseError) {
        // 如果 sfcParse 调用失败，记录错误但不抛出
        console.error('sfcParse 调用失败:', parseError);
        // 使用基础结构检查作为降级方案
        const structureDiagnostics = this.checkStructure(text, document);
        diagnostics.push(...structureDiagnostics);
        this.diagnosticCollection.set(document.uri, diagnostics);
        return;
      }

      if (errors.length) {
        // 解析有错误，但不抛出异常，只记录诊断
        console.warn('LD文件解析有错误:', errors);
        // 继续处理，不中断
      }

      if (descriptor) {
        (descriptor as any).id = finalFilename;
      }

      // 检查template块
      if (descriptor.template) {
        const templateDiagnostics = this.checkTemplate(descriptor.template.content, document);
        diagnostics.push(...templateDiagnostics);
      }

      // 检查script块
      if (descriptor.scriptSetup || descriptor.script) {
        const scriptContent = descriptor.scriptSetup?.content || descriptor.script?.content || '';
        const scriptDiagnostics = this.checkScript(scriptContent, document);
        diagnostics.push(...scriptDiagnostics);
      }

      // 检查style块
      if (descriptor.styles && descriptor.styles.length > 0) {
        descriptor.styles.forEach((style: { content: string }) => {
          const styleDiagnostics = this.checkStyle(style.content, document);
          diagnostics.push(...styleDiagnostics);
        });
      }

      // 检查基本结构
      const structureDiagnostics = this.checkStructure(text, document);
      diagnostics.push(...structureDiagnostics);

    } catch (error) {
      // 解析错误
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 0),
        `LD文件解析错误: ${errorMessage}`,
        vscode.DiagnosticSeverity.Error
      );
      diagnostics.push(diagnostic);
    }

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  /**
   * 检查template块
   */
  private checkTemplate(content: string, document: vscode.TextDocument): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    // 检查未闭合的标签
    const openTags: string[] = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
      const tagName = match[1];
      const isClosing = match[0].startsWith('</');

      if (isClosing) {
        const lastOpenTag = openTags.pop();
        if (lastOpenTag !== tagName) {
          const position = document.positionAt(match.index);
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(position, position.translate(0, match[0].length)),
              `标签未正确闭合: ${tagName}`,
              vscode.DiagnosticSeverity.Warning
            )
          );
        }
      } else if (!match[0].endsWith('/>')) {
        // 不是自闭合标签
        openTags.push(tagName);
      }
    }

    // 检查未闭合的标签
    if (openTags.length > 0) {
      const position = document.positionAt(content.length);
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(position, position),
          `未闭合的标签: ${openTags.join(', ')}`,
          vscode.DiagnosticSeverity.Warning
        )
      );
    }

    return diagnostics;
  }

  /**
   * 检查script块
   */
  private checkScript(content: string, document: vscode.TextDocument): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    // 检查常见的TypeScript/JavaScript错误
    // 这里可以集成ESLint或其他工具

    // 检查未使用的导入（简单检查）
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const imports = new Set<string>();
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.add(match[1]);
    }

    // 检查Vue3和React的混合使用（警告）
    const hasVue3 = content.includes('ref(') || content.includes('computed(') || content.includes('watch(');
    const hasReact = content.includes('useState') || content.includes('useEffect');

    if (hasVue3 && hasReact) {
      const position = document.positionAt(0);
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(position, position),
          '检测到Vue3和React语法混合使用，请确保这是预期的行为',
          vscode.DiagnosticSeverity.Information
        )
      );
    }

    return diagnostics;
  }

  /**
   * 检查style块
   */
  private checkStyle(content: string, document: vscode.TextDocument): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    // 检查CSS语法错误（简单检查）
    const unclosedBraces = (content.match(/\{/g) || []).length - (content.match(/\}/g) || []).length;

    if (unclosedBraces !== 0) {
      const position = document.positionAt(content.length);
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(position, position),
          `CSS块未正确闭合，缺少 ${Math.abs(unclosedBraces)} 个大括号`,
          vscode.DiagnosticSeverity.Error
        )
      );
    }

    return diagnostics;
  }

  /**
   * 检查基本结构
   */
  private checkStructure(text: string, document: vscode.TextDocument): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    // 检查是否有template、script、style块
    const hasTemplate = /<template[^>]*>/.test(text);
    const hasScript = /<script[^>]*>/.test(text);
    const hasStyle = /<style[^>]*>/.test(text);

    if (!hasTemplate) {
      const position = document.positionAt(0);
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(position, position),
          'LD文件应该包含<template>块',
          vscode.DiagnosticSeverity.Warning
        )
      );
    }

    if (!hasScript) {
      const position = document.positionAt(0);
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(position, position),
          'LD文件应该包含<script>块',
          vscode.DiagnosticSeverity.Information
        )
      );
    }

    return diagnostics;
  }

  /**
   * 清除诊断信息
   */
  public clearDiagnostics(): void {
    this.diagnosticCollection.clear();
  }

  /**
   * 销毁
   */
  public dispose(): void {
    this.diagnosticCollection.dispose();
  }
}

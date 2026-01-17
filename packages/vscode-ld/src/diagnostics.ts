import * as vscode from 'vscode';
import { parse } from '@ld/compiler-ld';

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
      // 解析LD文件
      const text = document.getText();
      const descriptor = parse(text, document.fileName);

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
        descriptor.styles.forEach((style) => {
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

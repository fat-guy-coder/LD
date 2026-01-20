import * as vscode from 'vscode';
// 注意：在实际使用时需要确保@ld/compiler-ld已构建
// import { parse } from '@ld/compiler-ld';

/**
 * LD文件格式化器
 */
export class LDFormatter implements vscode.DocumentFormattingEditProvider {
  /**
   * 格式化文档
   */
  provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    console.log('LD格式化器被调用');
    
    const config = vscode.workspace.getConfiguration('ld.format');
    if (!config.get<boolean>('enable', true)) {
      console.log('LD格式化已禁用');
      return [];
    }

    // 检查取消令牌
    if (token.isCancellationRequested) {
      console.log('格式化被取消');
      return [];
    }

    try {
      const text = document.getText();
      console.log('开始格式化LD文件，长度:', text.length, '语言ID:', document.languageId);
      
      if (!text || text.length === 0) {
        console.log('文档为空，跳过格式化');
        return [];
      }

      const formatted = this.formatLD(text, options);
      
      if (!formatted || formatted.length === 0) {
        console.warn('格式化返回空结果');
        return [];
      }
      
      // 如果格式化后的文本与原文相同，返回空数组
      if (formatted === text) {
        console.log('格式化后文本未变化');
        return [];
      }

      console.log('格式化完成，生成编辑，原文长度:', text.length, '格式化后长度:', formatted.length);
      
      // 返回整个文档的替换编辑
      const range = new vscode.Range(
        document.positionAt(0),
        document.positionAt(text.length)
      );

      const edit = vscode.TextEdit.replace(range, formatted);
      console.log('返回格式化编辑');
      return [edit];
    } catch (error) {
      console.error('格式化LD文件时出错:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('错误详情:', errorMessage, error);
      vscode.window.showErrorMessage('LD格式化失败: ' + errorMessage);
      return [];
    }
  }

  /**
   * 格式化LD文件内容
   */
  private formatLD(text: string, options: vscode.FormattingOptions): string {
    try {
      return this.basicFormat(text, options);
    } catch (error) {
      // 如果解析失败，使用基本的格式化
      return this.basicFormat(text, options);
    }
  }

  /**
   * 格式化template部分
   */
  private formatTemplate(content: string, options: vscode.FormattingOptions): string {
    // 简单的HTML格式化
    let formatted = content.trim();
    
    // 基本的缩进处理
    const indent = options.insertSpaces 
      ? ' '.repeat(options.tabSize || 2)
      : '\t';

    // 简单的标签格式化
    formatted = formatted.replace(/>\s*</g, '>\n<');
    
    // 添加基本缩进
    const lines = formatted.split('\n');
    let indentLevel = 0;
    const formattedLines = lines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';

      // 减少缩进
      if (trimmed.startsWith('</')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const indented = indent.repeat(indentLevel) + trimmed;

      // 增加缩进（跳过自闭合标签）
      if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
        indentLevel++;
      }

      return indented;
    });

    return `<template>\n${formattedLines.join('\n')}\n</template>`;
  }

  /**
   * 格式化script部分
   */
  private formatScript(content: string, options: vscode.FormattingOptions): string {
    // 使用基本的TypeScript格式化
    // 这里可以集成prettier或其他格式化工具
    const indent = options.insertSpaces 
      ? ' '.repeat(options.tabSize || 2)
      : '\t';

    // 简单的格式化：确保大括号和分号正确
    let formatted = content.trim();
    
    // 添加基本缩进
    const lines = formatted.split('\n');
    let indentLevel = 0;
    const formattedLines = lines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';

      // 减少缩进
      if (trimmed === '}' || trimmed.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const indented = indent.repeat(indentLevel) + trimmed;

      // 增加缩进
      if (trimmed.endsWith('{') || trimmed.endsWith('[')) {
        indentLevel++;
      }

      return indented;
    });

    return `<script setup lang="ts">\n${formattedLines.join('\n')}\n</script>`;
  }

  /**
   * 格式化style部分
   */
  private formatStyle(content: string, options: vscode.FormattingOptions): string {
    // 简单的CSS格式化
    const indent = options.insertSpaces 
      ? ' '.repeat(options.tabSize || 2)
      : '\t';

    let formatted = content.trim();
    formatted = formatted.replace(/\{/g, ' {\n');
    formatted = formatted.replace(/\}/g, '\n}\n');
    formatted = formatted.replace(/;/g, ';\n');

    return `<style scoped>\n${formatted}\n</style>`;
  }

  /**
   * 基本格式化（当解析失败时使用）
   * 正确处理LD文件结构：template、script、style三个部分
   */
  private basicFormat(text: string, options: vscode.FormattingOptions): string {
    const indent = options.insertSpaces 
      ? ' '.repeat(options.tabSize || 2)
      : '\t';

    // 解析LD文件结构：提取template、script、style部分
    const templateMatch = text.match(/<template[^>]*>([\s\S]*?)<\/template>/i);
    const scriptMatch = text.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    const styleMatch = text.match(/<style[^>]*>([\s\S]*?)<\/style>/i);

    const result: string[] = [];

    // 格式化template部分
    if (templateMatch) {
      const templateTag = text.match(/<template[^>]*>/i)?.[0] || '<template>';
      const templateContent = templateMatch[1].trim();
      const formattedTemplate = this.formatSection(templateContent, 'template', indent);
      result.push(templateTag);
      if (formattedTemplate) {
        result.push(formattedTemplate);
      }
      result.push('</template>');
    }

    // 格式化script部分
    if (scriptMatch) {
      const scriptTag = text.match(/<script[^>]*>/i)?.[0] || '<script setup lang="ts">';
      const scriptContent = scriptMatch[1].trim();
      const formattedScript = this.formatSection(scriptContent, 'script', indent);
      result.push(scriptTag);
      if (formattedScript) {
        result.push(formattedScript);
      }
      result.push('</script>');
    }

    // 格式化style部分
    if (styleMatch) {
      const styleTag = text.match(/<style[^>]*>/i)?.[0] || '<style scoped>';
      const styleContent = styleMatch[1].trim();
      const formattedStyle = this.formatSection(styleContent, 'style', indent);
      result.push(styleTag);
      if (formattedStyle) {
        result.push(formattedStyle);
      }
      result.push('</style>');
    }

    // 如果没有匹配到任何部分，使用原始格式化逻辑
    if (result.length === 0) {
      return this.formatFallback(text, indent);
    }

    return result.join('\n');
  }

  /**
   * 格式化单个部分（template/script/style的内容）
   */
  private formatSection(content: string, type: 'template' | 'script' | 'style', indent: string): string {
    if (!content.trim()) {
      return '';
    }

    const lines = content.split('\n');
    const formattedLines: string[] = [];
    let indentLevel = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // 空行保持原样
      if (!trimmed) {
        formattedLines.push('');
        continue;
      }

      if (type === 'template') {
        // Template部分：HTML标签缩进
        if (trimmed.startsWith('</')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        
        const indented = indent.repeat(indentLevel) + trimmed;
        formattedLines.push(indented);
        
        if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
          // 检查是否是自闭合标签
          if (!trimmed.endsWith('/>') && !trimmed.includes('</')) {
            indentLevel++;
          }
        }
      } else if (type === 'script') {
        // Script部分：TypeScript/JavaScript缩进
        if (trimmed === '}' || trimmed.startsWith('}')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        
        const indented = indent.repeat(indentLevel) + trimmed;
        formattedLines.push(indented);
        
        if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
          indentLevel++;
        }
      } else if (type === 'style') {
        // Style部分：CSS缩进
        if (trimmed === '}' || trimmed.startsWith('}')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        
        const indented = indent.repeat(indentLevel) + trimmed;
        formattedLines.push(indented);
        
        if (trimmed.endsWith('{')) {
          indentLevel++;
        }
      }
    }

    return formattedLines.join('\n');
  }

  /**
   * 备用格式化（当无法识别LD结构时使用）
   */
  private formatFallback(text: string, indent: string): string {
    const lines = text.split('\n');
    let indentLevel = 0;
    const formattedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // 空行保持原样
      if (!trimmed) {
        formattedLines.push('');
        continue;
      }
      
      // 减少缩进（闭合标签）
      if (trimmed.startsWith('</')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      // 添加缩进
      const indented = indent.repeat(indentLevel) + trimmed;
      formattedLines.push(indented);
      
      // 增加缩进（开放标签，但不是自闭合标签）
      if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
        // 检查是否是单行标签（如 <script setup lang="ts">）
        if (!trimmed.includes('</')) {
          indentLevel++;
        }
      }
    }
    
    return formattedLines.join('\n');
  }
}

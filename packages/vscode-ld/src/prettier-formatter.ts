import * as vscode from 'vscode';
// @ts-ignore - Prettier类型定义可能不完整
import * as prettier from 'prettier';

/**
 * 使用Prettier的LD文件格式化器
 */
export class LDPrettierFormatter implements vscode.DocumentFormattingEditProvider {
  /**
   * 格式化文档
   */
  async provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken
  ): Promise<vscode.TextEdit[]> {
    const config = vscode.workspace.getConfiguration('ld.format');
    if (!config.get<boolean>('enable', true)) {
      return [];
    }

    try {
      const text = document.getText();
      const formatted = await this.formatWithPrettier(text, document, options);

      if (formatted === text) {
        return [];
      }

      const range = new vscode.Range(
        document.positionAt(0),
        document.positionAt(text.length)
      );

      return [vscode.TextEdit.replace(range, formatted)];
    } catch (error) {
      console.error('Prettier格式化失败:', error);
      // 如果Prettier失败，返回空数组，让基础格式化器处理
      // 注意：这里不抛出错误，让基础格式化器作为备用
      throw error; // 抛出错误，让基础格式化器处理
    }
  }

  /**
   * 使用Prettier格式化
   */
  private async formatWithPrettier(
    text: string,
    document: vscode.TextDocument,
    options: vscode.FormattingOptions
  ): Promise<string> {
    // 获取Prettier配置
    const prettierConfig = await this.getPrettierConfig(document.uri);

    // 尝试使用Prettier格式化
    try {
      // 检查Prettier是否支持LD文件
      // 如果不支持，我们可以将不同部分分别格式化
      const formatted = await prettier.format(text, {
        ...prettierConfig,
        parser: 'html', // 使用HTML解析器作为基础
        tabWidth: options.tabSize || 2,
        useTabs: !options.insertSpaces,
      });

      return formatted;
    } catch (error) {
      // 如果整体格式化失败，尝试分段格式化
      return this.formatSections(text, document, options);
    }
  }

  /**
   * 分段格式化（template、script、style分别格式化）
   */
  private async formatSections(
    text: string,
    document: vscode.TextDocument,
    options: vscode.FormattingOptions
  ): Promise<string> {
    const result: string[] = [];

    // 提取template部分
    const templateMatch = text.match(/(<template[^>]*>)([\s\S]*?)(<\/template>)/i);
    if (templateMatch) {
      const templateTag = templateMatch[1];
      const templateContent = templateMatch[2].trim();
      const templateClose = templateMatch[3];
      
      if (templateContent) {
        const formatted = await this.formatSection(templateContent, 'template', document, options);
        result.push(templateTag + '\n' + formatted + '\n' + templateClose);
      } else {
        result.push(templateTag + '\n' + templateClose);
      }
    }

    // 提取script部分
    const scriptMatch = text.match(/(<script[^>]*>)([\s\S]*?)(<\/script>)/i);
    if (scriptMatch) {
      const scriptTag = scriptMatch[1];
      const scriptContent = scriptMatch[2].trim();
      const scriptClose = scriptMatch[3];
      
      if (scriptContent) {
        const formatted = await this.formatSection(scriptContent, 'script', document, options);
        result.push(scriptTag + '\n' + formatted + '\n' + scriptClose);
      } else {
        result.push(scriptTag + '\n' + scriptClose);
      }
    }

    // 提取style部分
    const styleMatch = text.match(/(<style[^>]*>)([\s\S]*?)(<\/style>)/i);
    if (styleMatch) {
      const styleTag = styleMatch[1];
      const styleContent = styleMatch[2].trim();
      const styleClose = styleMatch[3];
      
      if (styleContent) {
        const formatted = await this.formatSection(styleContent, 'style', document, options);
        result.push(styleTag + '\n' + formatted + '\n' + styleClose);
      } else {
        result.push(styleTag + '\n' + styleClose);
      }
    }

    // 如果没有匹配到任何部分，返回原文本
    if (result.length === 0) {
      return text;
    }

    return result.join('\n\n');
  }

  /**
   * 格式化单个部分
   */
  private async formatSection(
    content: string,
    type: 'template' | 'script' | 'style',
    document: vscode.TextDocument,
    options: vscode.FormattingOptions
  ): Promise<string> {
    try {
      let parser: string;
      const prettierConfig = await this.getPrettierConfig(document.uri);
      
      switch (type) {
        case 'template':
          parser = 'html';
          break;
        case 'script':
          parser = 'typescript';
          break;
        case 'style':
          parser = 'css';
          break;
        default:
          parser = 'html';
      }

      const formatted = await prettier.format(content, {
        ...prettierConfig,
        parser,
        tabWidth: options.tabSize || 2,
        useTabs: !options.insertSpaces,
      });

      // 移除Prettier添加的末尾换行（如果有）
      return formatted.trimEnd();
    } catch (error) {
      // 如果格式化失败，返回原内容
      console.error(`格式化${type}部分失败:`, error);
      return content;
    }
  }

  /**
   * 获取Prettier配置
   */
  private async getPrettierConfig(uri: vscode.Uri): Promise<prettier.Options> {
    // 尝试从工作区配置读取Prettier设置
    const config = vscode.workspace.getConfiguration('prettier', uri);
    
    return {
      tabWidth: config.get<number>('tabWidth', 2),
      useTabs: config.get<boolean>('useTabs', false),
      semi: config.get<boolean>('semi', true),
      singleQuote: config.get<boolean>('singleQuote', true),
      trailingComma: config.get<string>('trailingComma', 'es5') as any,
      printWidth: config.get<number>('printWidth', 80),
    };
  }
}

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
      // 如果Prettier失败，返回空数组，让编辑器使用默认格式化
      return [];
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
      return this.formatSections(text, options);
    }
  }

  /**
   * 分段格式化（template、script、style分别格式化）
   */
  private async formatSections(
    text: string,
    options: vscode.FormattingOptions
  ): Promise<string> {
    const sections: string[] = [];
    let currentSection = '';
    let currentType: 'template' | 'script' | 'style' | null = null;

    const lines = text.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('<template')) {
        if (currentSection && currentType) {
          sections.push(await this.formatSection(currentSection, currentType, options));
        }
        currentSection = line + '\n';
        currentType = 'template';
      } else if (line.trim().startsWith('<script')) {
        if (currentSection && currentType) {
          sections.push(await this.formatSection(currentSection, currentType, options));
        }
        currentSection = line + '\n';
        currentType = 'script';
      } else if (line.trim().startsWith('<style')) {
        if (currentSection && currentType) {
          sections.push(await this.formatSection(currentSection, currentType, options));
        }
        currentSection = line + '\n';
        currentType = 'style';
      } else if (line.trim().startsWith('</template>') || 
                 line.trim().startsWith('</script>') || 
                 line.trim().startsWith('</style>')) {
        currentSection += line;
        if (currentSection && currentType) {
          sections.push(await this.formatSection(currentSection, currentType, options));
        }
        currentSection = '';
        currentType = null;
      } else {
        currentSection += line + '\n';
      }
    }

    if (currentSection && currentType) {
      sections.push(await this.formatSection(currentSection, currentType, options));
    }

    return sections.join('\n\n');
  }

  /**
   * 格式化单个部分
   */
  private async formatSection(
    content: string,
    type: 'template' | 'script' | 'style',
    options: vscode.FormattingOptions
  ): Promise<string> {
    try {
      let parser: string;
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
        parser,
        tabWidth: options.tabSize || 2,
        useTabs: !options.insertSpaces,
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
      });

      return formatted;
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
      trailingComma: config.get<string>('trailingComma', 'es5') as prettier.TrailingComma,
      printWidth: config.get<number>('printWidth', 80),
    };
  }
}

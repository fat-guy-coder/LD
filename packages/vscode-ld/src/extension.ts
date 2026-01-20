import * as vscode from 'vscode';

/**
 * 扩展激活函数
 */
export function activate(context: vscode.ExtensionContext) {
  return;
  try {
    console.log('LD Language Support扩展已激活');
    
    // 读取配置
    const config = vscode.workspace.getConfiguration('ld');
    const highlightEnabled = config.get<boolean>('highlight.enable', true);
    const formatEnabled = config.get<boolean>('format.enable', false);
    const completionEnabled = config.get<boolean>('completion.enable', false);
    const diagnosticsEnabled = config.get<boolean>('diagnostics.enable', false);
    
    console.log(`配置状态: 高亮=${highlightEnabled}, 格式化=${formatEnabled}, 补全=${completionEnabled}, 诊断=${diagnosticsEnabled}`);
    
    // 高亮功能通过 package.json 中的 grammars 贡献点自动注册，无需手动注册
    
    // 仅在启用时注册格式化功能
    if (formatEnabled) {
      try {
        // 动态导入格式化提供者，避免在禁用时加载
        const { LDLazyFormattingProvider } = require('./lazy-formatting');
        const formattingProvider = new LDLazyFormattingProvider();
        const formattingDisposable = vscode.languages.registerDocumentFormattingEditProvider(
          'ld',
          formattingProvider
        );
        context.subscriptions.push(formattingDisposable);
        console.log('✓ 格式化功能已注册');
      } catch (error) {
        console.error('注册格式化功能失败:', error);
      }
      
      // 注册命令：格式化文档
      const formatCommand = vscode.commands.registerCommand('ld.formatDocument', async () => {
        try {
          const editor = vscode.window.activeTextEditor;
          if (!editor) {
            vscode.window.showWarningMessage('没有活动的编辑器');
            return;
          }
          if (editor.document.languageId !== 'ld') {
            vscode.window.showWarningMessage('当前文件不是LD文件');
            return;
          }
          await vscode.commands.executeCommand('editor.action.formatDocument');
        } catch (error) {
          console.error('格式化失败:', error);
          vscode.window.showErrorMessage('格式化失败: ' + (error instanceof Error ? error.message : String(error)));
        }
      });
      context.subscriptions.push(formatCommand);

      // 注册命令：将本扩展设置为工作区默认格式化器
      const setDefaultFormatterCommand = vscode.commands.registerCommand('ld.setDefaultFormatter', async () => {
        try {
          if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('未打开工作区，无法写入工作区设置。请先打开一个文件夹工作区后重试。');
            return;
          }
          const editorConfig = vscode.workspace.getConfiguration('editor');
          await editorConfig.update('defaultFormatter', 'ld-framework.ld-language-support', vscode.ConfigurationTarget.Workspace, true);
          vscode.window.showInformationMessage('已在当前工作区将LD设置为默认格式化器');
        } catch (error) {
          console.error('设置默认格式化器失败:', error);
          vscode.window.showErrorMessage('设置默认格式化器失败: ' + (error instanceof Error ? error.message : String(error)));
        }
      });
      context.subscriptions.push(setDefaultFormatterCommand);
    }
    
    // 仅在启用时注册补全功能
    if (completionEnabled) {
      try {
        const { LDCompletionProvider } = require('./completion');
        const completionProvider = new LDCompletionProvider();
        const completionDisposable = vscode.languages.registerCompletionItemProvider(
          'ld',
          completionProvider,
          '.', '<', ':', '@', '"', "'"
        );
        context.subscriptions.push(completionDisposable);
        console.log('✓ 补全功能已注册');
      } catch (error) {
        console.error('注册补全功能失败:', error);
      }
    }
    
    // 仅在启用时注册诊断功能
    if (diagnosticsEnabled) {
      try {
        const { LDLazyDiagnosticsProvider } = require('./lazy-diagnostics');
        const diagnosticsProvider = new LDLazyDiagnosticsProvider();
        
        // 监听文档变化
        const changeDisposable = vscode.workspace.onDidChangeTextDocument((e) => {
          if (e.document.languageId === 'ld') {
            diagnosticsProvider.updateDiagnostics(e.document);
          }
        });
        context.subscriptions.push(changeDisposable);
        
        // 监听文档打开
        const openDisposable = vscode.workspace.onDidOpenTextDocument((document) => {
          if (document.languageId === 'ld') {
            diagnosticsProvider.updateDiagnostics(document);
          }
        });
        context.subscriptions.push(openDisposable);
        
        // 注册 dispose
        context.subscriptions.push({
          dispose: () => diagnosticsProvider.dispose()
        });
        
        console.log('✓ 诊断功能已注册');
      } catch (error) {
        console.error('注册诊断功能失败:', error);
      }
    }
    
    console.log(`✓ LD扩展已激活：高亮=${highlightEnabled ? '启用' : '禁用'}, 格式化=${formatEnabled ? '启用' : '禁用'}, 补全=${completionEnabled ? '启用' : '禁用'}, 诊断=${diagnosticsEnabled ? '启用' : '禁用'}`);
    
  } catch (error) {
    console.error('扩展激活时出错:', error);
    vscode.window.showErrorMessage('LD扩展激活失败: ' + (error instanceof Error ? error.message : String(error)));
  }
}


/**
 * 扩展停用函数
 */
export function deactivate() {
  console.log('LD Language Support扩展已停用');
}

import * as vscode from 'vscode';

/**
 * 扩展激活函数
 * 极简版本：只提供语法高亮和基本命令，避免崩溃
 */
export function activate(context: vscode.ExtensionContext) {
  try {
    console.log('LD Language Support扩展已激活（极简版本）');
    
    // 注册命令：格式化文档（使用VSCode默认格式化）
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
        // 使用VSCode默认格式化命令
        await vscode.commands.executeCommand('editor.action.formatDocument');
      } catch (error) {
        console.error('格式化失败:', error);
        // 静默失败，不显示错误消息，避免干扰用户
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

        const config = vscode.workspace.getConfiguration('editor');
        await config.update('defaultFormatter', 'ld-framework.ld-language-support', vscode.ConfigurationTarget.Workspace, true);
        vscode.window.showInformationMessage('已在当前工作区将LD设置为默认格式化器');
      } catch (error) {
        console.error('设置默认格式化器失败:', error);
        // 静默失败
      }
    });
    context.subscriptions.push(setDefaultFormatterCommand);

    console.log('✓ LD扩展已激活：语法高亮和基本命令已就绪');
    console.log('  注意：格式化、补全、悬停等功能已禁用，避免崩溃');
    
  } catch (error) {
    console.error('扩展激活时出错:', error);
    // 即使出错也继续，确保扩展不会完全失败
  }
}


/**
 * 扩展停用函数
 */
export function deactivate() {
  console.log('LD Language Support扩展已停用');
}

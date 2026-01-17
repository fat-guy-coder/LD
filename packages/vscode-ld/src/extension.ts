import * as vscode from 'vscode';
import { LDFormatter } from './formatter';
import { LDPrettierFormatter } from './prettier-formatter';
import { LDCompletionProvider } from './completion';
import { LDHoverProvider } from './hover';
import { LDDiagnosticsProvider } from './diagnostics';

/**
 * 扩展激活函数
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('LD Language Support扩展已激活');

  // 注册格式化器（优先使用Prettier，失败时回退到基础格式化器）
  const prettierFormatter = new LDPrettierFormatter();
  const basicFormatter = new LDFormatter();
  
  // 尝试使用Prettier格式化
  const prettierFormatDisposable = vscode.languages.registerDocumentFormattingEditProvider(
    'ld',
    prettierFormatter
  );
  context.subscriptions.push(prettierFormatDisposable);

  // 基础格式化器作为备用
  const formatDisposable = vscode.languages.registerDocumentFormattingEditProvider(
    'ld',
    basicFormatter
  );
  context.subscriptions.push(formatDisposable);

  // 注册自动补全提供者
  const completionProvider = new LDCompletionProvider();
  const completionDisposable = vscode.languages.registerCompletionItemProvider(
    'ld',
    completionProvider,
    '.', // 触发字符
    '<', // 触发字符
    ' ', // 触发字符
    '(', // 触发字符
    '"', // 触发字符
    "'", // 触发字符
    '`', // 触发字符
    '/', // 触发字符
    '@', // 触发字符
    ':' // 触发字符
  );
  context.subscriptions.push(completionDisposable);

  // 注册悬停提示提供者
  const hoverProvider = new LDHoverProvider();
  const hoverDisposable = vscode.languages.registerHoverProvider('ld', hoverProvider);
  context.subscriptions.push(hoverDisposable);

  // 注册诊断提供者
  const diagnosticsProvider = new LDDiagnosticsProvider();
  
  // 监听文档变化，更新诊断
  const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
    if (e.document.languageId === 'ld') {
      diagnosticsProvider.updateDiagnostics(e.document);
    }
  });
  context.subscriptions.push(changeDocumentSubscription);

  // 打开文档时更新诊断
  const openDocumentSubscription = vscode.workspace.onDidOpenTextDocument((document) => {
    if (document.languageId === 'ld') {
      diagnosticsProvider.updateDiagnostics(document);
    }
  });
  context.subscriptions.push(openDocumentSubscription);

  // 保存时更新诊断
  const saveDocumentSubscription = vscode.workspace.onDidSaveTextDocument((document) => {
    if (document.languageId === 'ld') {
      diagnosticsProvider.updateDiagnostics(document);
    }
  });
  context.subscriptions.push(saveDocumentSubscription);

  // 清理诊断
  context.subscriptions.push({
    dispose: () => {
      diagnosticsProvider.dispose();
    },
  });

  // 注册命令：格式化文档
  const formatCommand = vscode.commands.registerCommand('ld.formatDocument', () => {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === 'ld') {
      vscode.commands.executeCommand('editor.action.formatDocument');
    }
  });
  context.subscriptions.push(formatCommand);
}

/**
 * 扩展停用函数
 */
export function deactivate() {
  console.log('LD Language Support扩展已停用');
}

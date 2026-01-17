import * as vscode from 'vscode';

/**
 * LD文件自动补全提供者
 */
export class LDCompletionProvider implements vscode.CompletionItemProvider {
  /**
   * 提供自动补全项
   */
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    const config = vscode.workspace.getConfiguration('ld.completion');
    if (!config.get<boolean>('enable', true)) {
      return [];
    }

    const linePrefix = document.lineAt(position).text.substr(0, position.character);
    const items: vscode.CompletionItem[] = [];

    // 检测是否在script标签中
    const textBeforeCursor = document.getText(
      new vscode.Range(new vscode.Position(0, 0), position)
    );
    const isInScript = this.isInScriptBlock(textBeforeCursor);

    // Vue3 API补全
    if (isInScript) {
      items.push(...this.getVue3Completions(linePrefix));
      items.push(...this.getReactCompletions(linePrefix));
      items.push(...this.getLDCompletions(linePrefix));
    }

    // Template标签补全
    if (this.isInTemplateBlock(textBeforeCursor)) {
      items.push(...this.getTemplateCompletions(linePrefix));
    }

    // 标签补全
    if (linePrefix.endsWith('<')) {
      items.push(...this.getTagCompletions());
    }

    return items;
  }

  /**
   * 检查是否在script块中
   */
  private isInScriptBlock(text: string): boolean {
    const scriptMatches = text.match(/<script[^>]*>/g);
    const scriptCloseMatches = text.match(/<\/script>/g);
    
    if (!scriptMatches) return false;
    
    const lastScriptOpen = text.lastIndexOf('<script');
    const lastScriptClose = text.lastIndexOf('</script>');
    
    return lastScriptOpen > lastScriptClose || lastScriptClose === -1;
  }

  /**
   * 检查是否在template块中
   */
  private isInTemplateBlock(text: string): boolean {
    const templateMatches = text.match(/<template[^>]*>/g);
    const templateCloseMatches = text.match(/<\/template>/g);
    
    if (!templateMatches) return false;
    
    const lastTemplateOpen = text.lastIndexOf('<template');
    const lastTemplateClose = text.lastIndexOf('</template>');
    
    return lastTemplateOpen > lastTemplateClose || lastTemplateClose === -1;
  }

  /**
   * 获取Vue3 API补全项
   */
  private getVue3Completions(linePrefix: string): vscode.CompletionItem[] {
    const vue3Apis = [
      { label: 'ref', detail: 'Vue3: 创建响应式引用', insertText: 'ref($1)', kind: vscode.CompletionItemKind.Function },
      { label: 'reactive', detail: 'Vue3: 创建响应式对象', insertText: 'reactive($1)', kind: vscode.CompletionItemKind.Function },
      { label: 'computed', detail: 'Vue3: 创建计算属性', insertText: 'computed(() => $1)', kind: vscode.CompletionItemKind.Function },
      { label: 'watch', detail: 'Vue3: 监听响应式数据', insertText: 'watch($1, ($2) => {\n  $3\n})', kind: vscode.CompletionItemKind.Function },
      { label: 'watchEffect', detail: 'Vue3: 立即执行监听', insertText: 'watchEffect(() => {\n  $1\n})', kind: vscode.CompletionItemKind.Function },
      { label: 'onMounted', detail: 'Vue3: 组件挂载钩子', insertText: 'onMounted(() => {\n  $1\n})', kind: vscode.CompletionItemKind.Function },
      { label: 'onUnmounted', detail: 'Vue3: 组件卸载钩子', insertText: 'onUnmounted(() => {\n  $1\n})', kind: vscode.CompletionItemKind.Function },
    ];

    return vue3Apis.map((api) => {
      const item = new vscode.CompletionItem(api.label, api.kind);
      item.detail = api.detail;
      item.insertText = new vscode.SnippetString(api.insertText);
      item.documentation = new vscode.MarkdownString(`**Vue3 API**: ${api.detail}`);
      return item;
    });
  }

  /**
   * 获取React Hooks补全项
   */
  private getReactCompletions(linePrefix: string): vscode.CompletionItem[] {
    const reactHooks = [
      { label: 'useState', detail: 'React: 状态管理', insertText: 'const [$1, set$1] = useState($2)', kind: vscode.CompletionItemKind.Function },
      { label: 'useEffect', detail: 'React: 副作用处理', insertText: 'useEffect(() => {\n  $1\n}, [$2])', kind: vscode.CompletionItemKind.Function },
      { label: 'useMemo', detail: 'React: 记忆化计算', insertText: 'useMemo(() => $1, [$2])', kind: vscode.CompletionItemKind.Function },
      { label: 'useCallback', detail: 'React: 记忆化回调', insertText: 'useCallback(() => {\n  $1\n}, [$2])', kind: vscode.CompletionItemKind.Function },
      { label: 'useRef', detail: 'React: 引用对象', insertText: 'useRef($1)', kind: vscode.CompletionItemKind.Function },
    ];

    return reactHooks.map((hook) => {
      const item = new vscode.CompletionItem(hook.label, hook.kind);
      item.detail = hook.detail;
      item.insertText = new vscode.SnippetString(hook.insertText);
      item.documentation = new vscode.MarkdownString(`**React Hook**: ${hook.detail}`);
      return item;
    });
  }

  /**
   * 获取LD Signal API补全项
   */
  private getLDCompletions(linePrefix: string): vscode.CompletionItem[] {
    const ldApis = [
      { label: 'createSignal', detail: 'LD: 创建Signal', insertText: 'createSignal($1)', kind: vscode.CompletionItemKind.Function },
      { label: 'createComputed', detail: 'LD: 创建计算值', insertText: 'createComputed(() => $1)', kind: vscode.CompletionItemKind.Function },
      { label: 'createEffect', detail: 'LD: 创建副作用', insertText: 'createEffect(() => {\n  $1\n})', kind: vscode.CompletionItemKind.Function },
      { label: 'createReactive', detail: 'LD: 创建响应式对象', insertText: 'createReactive($1)', kind: vscode.CompletionItemKind.Function },
    ];

    return ldApis.map((api) => {
      const item = new vscode.CompletionItem(api.label, api.kind);
      item.detail = api.detail;
      item.insertText = new vscode.SnippetString(api.insertText);
      item.documentation = new vscode.MarkdownString(`**LD Signal API**: ${api.detail}`);
      return item;
    });
  }

  /**
   * 获取模板补全项
   */
  private getTemplateCompletions(linePrefix: string): vscode.CompletionItem[] {
    const directives = [
      { label: 'v-if', detail: '条件渲染', insertText: 'v-if="$1"' },
      { label: 'v-for', detail: '列表渲染', insertText: 'v-for="($1, index) in $2"' },
      { label: 'v-bind', detail: '属性绑定', insertText: 'v-bind:$1="$2"' },
      { label: 'v-on', detail: '事件绑定', insertText: 'v-on:$1="$2"' },
      { label: 'v-model', detail: '双向绑定', insertText: 'v-model="$1"' },
    ];

    return directives.map((dir) => {
      const item = new vscode.CompletionItem(dir.label, vscode.CompletionItemKind.Property);
      item.detail = dir.detail;
      item.insertText = new vscode.SnippetString(dir.insertText);
      return item;
    });
  }

  /**
   * 获取标签补全项
   */
  private getTagCompletions(): vscode.CompletionItem[] {
    const tags = ['template', 'script', 'style', 'div', 'span', 'button', 'input', 'p', 'h1', 'h2', 'h3'];
    
    return tags.map((tag) => {
      const item = new vscode.CompletionItem(tag, vscode.CompletionItemKind.Tag);
      item.insertText = new vscode.SnippetString(`${tag}$1>`);
      return item;
    });
  }
}

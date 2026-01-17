import * as vscode from 'vscode';

/**
 * LD文件悬停提示提供者
 */
export class LDHoverProvider implements vscode.HoverProvider {
  /**
   * 提供悬停信息
   */
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
      return null;
    }

    const word = document.getText(wordRange);
    const hoverInfo = this.getHoverInfo(word);

    if (hoverInfo) {
      const markdown = new vscode.MarkdownString();
      markdown.appendMarkdown(`### ${hoverInfo.title}\n\n`);
      markdown.appendMarkdown(hoverInfo.description);
      if (hoverInfo.example) {
        markdown.appendMarkdown(`\n\n**示例**:\n\`\`\`typescript\n${hoverInfo.example}\n\`\`\``);
      }
      return new vscode.Hover(markdown);
    }

    return null;
  }

  /**
   * 获取悬停信息
   */
  private getHoverInfo(word: string): { title: string; description: string; example?: string } | null {
    const hoverMap: Record<string, { title: string; description: string; example?: string }> = {
      // Vue3 APIs
      ref: {
        title: 'ref() - Vue3',
        description: '创建一个响应式的引用值。',
        example: 'const count = ref(0);\ncount.value++;',
      },
      reactive: {
        title: 'reactive() - Vue3',
        description: '创建一个响应式的对象。',
        example: 'const state = reactive({ count: 0 });',
      },
      computed: {
        title: 'computed() - Vue3',
        description: '创建一个计算属性。',
        example: 'const doubled = computed(() => count.value * 2);',
      },
      watch: {
        title: 'watch() - Vue3',
        description: '监听响应式数据的变化。',
        example: 'watch(count, (newVal) => {\n  console.log(newVal);\n});',
      },
      // React Hooks
      useState: {
        title: 'useState() - React',
        description: 'React Hook用于管理组件状态。',
        example: 'const [count, setCount] = useState(0);',
      },
      useEffect: {
        title: 'useEffect() - React',
        description: 'React Hook用于处理副作用。',
        example: 'useEffect(() => {\n  // 副作用代码\n}, [deps]);',
      },
      // LD APIs
      createSignal: {
        title: 'createSignal() - LD',
        description: 'LD框架：创建一个Signal，用于响应式状态管理。',
        example: 'const count = createSignal(0);\ncount.set(1);',
      },
      createComputed: {
        title: 'createComputed() - LD',
        description: 'LD框架：创建一个计算值，自动追踪依赖。',
        example: 'const doubled = createComputed(() => count() * 2);',
      },
      createEffect: {
        title: 'createEffect() - LD',
        description: 'LD框架：创建一个副作用，自动追踪依赖。',
        example: 'createEffect(() => {\n  console.log(count());\n});',
      },
    };

    return hoverMap[word] || null;
  }
}

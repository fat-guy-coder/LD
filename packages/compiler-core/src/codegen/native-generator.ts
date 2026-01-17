import generate from '@babel/generator';
import * as t from '@babel/types';
import traverse, { type NodePath } from '@babel/traverse';

/**
 * @description 代码生成选项
 */
export interface CodegenOptions {
  /** 是否移除运行时依赖 */
  removeRuntime?: boolean;
  /** 是否内联Signal调用 */
  inlineSignals?: boolean;
  /** 是否进行静态提升 */
  hoistStatic?: boolean;
}

/**
 * @description 将LD IR编译为原生JavaScript代码（零运行时）
 * @param ir - LD中间表示（AST）
 * @param options - 代码生成选项
 * @returns 原生JS代码字符串
 */
export function generateNativeJS(
  ir: t.File,
  options: CodegenOptions = {}
): string {
  const {
    removeRuntime = true,
    inlineSignals = true,
    hoistStatic = true,
  } = options;

  // 创建AST副本
  const ast = t.cloneNode(ir, true);

  // 1. 静态提升：提取静态节点
  if (hoistStatic) {
    hoistStaticNodes(ast);
  }

  // 2. 内联Signal调用（如果启用）
  if (inlineSignals) {
    inlineSignalCalls(ast);
  }

  // 3. 移除运行时依赖（如果启用）
  if (removeRuntime) {
    removeRuntimeDependencies(ast);
  }

  // 4. 生成代码
  const { code } = generate(ast, {
    compact: false,
    comments: true,
    retainLines: false,
  });

  return code;
}

/**
 * @description 静态节点提升优化
 */
function hoistStaticNodes(ast: t.File): void {
  const staticNodes: t.Statement[] = [];
  const dynamicNodes: t.Statement[] = [];

  traverse(ast, {
    // 识别静态节点（无响应式绑定）
    // 这里简化处理，实际应该更复杂
  });

  // 将静态节点提升到顶部
  ast.program.body = [...staticNodes, ...dynamicNodes];
}

/**
 * @description 内联Signal调用
 */
function inlineSignalCalls(ast: t.File): void {
  traverse(ast, {
    // 将 createSignal() 调用内联
    // 将 signal() 调用转换为直接值访问
    // 这需要更复杂的分析，这里先占位
  });
}

/**
 * @description 移除运行时依赖
 */
function removeRuntimeDependencies(ast: t.File): void {
  traverse(ast, {
    ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
      const source = path.node.source.value as string;
      // 移除 @ld/reactivity 等运行时导入
      if (source.startsWith('@ld/')) {
        // 在实际编译时，这些导入会被内联的代码替换
        // 这里先保留，因为完全移除需要更复杂的处理
      }
    },
  });
}

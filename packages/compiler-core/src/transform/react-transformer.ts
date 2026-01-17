import traverse, { type NodePath } from '@babel/traverse';
import * as t from '@babel/types';

/**
 * @description 将React Hooks转换为LD Signal API
 * @param reactAST - React script AST
 * @returns 转换后的AST
 */
export function transformReactToLD(reactAST: t.File): t.File {
  // 创建转换后的AST副本
  const transformedAST = t.cloneNode(reactAST, true);

  // 需要添加的导入语句
  const importsToAdd = new Set<string>();

  traverse(transformedAST, {
    // 统一处理所有React Hooks调用
    CallExpression(path: NodePath<t.CallExpression>) {
      if (!t.isIdentifier(path.node.callee)) return;
      
      const calleeName = path.node.callee.name;

      // 转换 useState() → createSignal()
      if (calleeName === 'useState') {
        importsToAdd.add('createSignal');
        const [initialValue] = path.node.arguments;

        // useState(init) → createSignal(init)
        // 但需要处理返回的数组 [value, setValue]
        // 这需要更复杂的转换，因为React返回数组，而LD Signal返回函数
        // 这里先做基本转换
        path.replaceWith(
          t.callExpression(t.identifier('createSignal'), initialValue ? [initialValue] : [])
        );
        return;
      }

      // 转换 useEffect() → createEffect()
      if (calleeName === 'useEffect') {
        importsToAdd.add('createEffect');
        const [effectFn] = path.node.arguments;

        // useEffect(fn, deps) → createEffect(fn)
        // 注意：LD的createEffect会自动追踪依赖，所以deps参数可以忽略
        if (effectFn) {
          path.replaceWith(
            t.callExpression(t.identifier('createEffect'), [effectFn])
          );
        }
        return;
      }

      // 转换 useMemo() → createComputed()
      if (calleeName === 'useMemo') {
        importsToAdd.add('createComputed');
        const [fn] = path.node.arguments;

        // useMemo(fn, deps) → createComputed(fn)
        // 注意：LD的createComputed会自动追踪依赖
        if (fn) {
          path.replaceWith(
            t.callExpression(t.identifier('createComputed'), [fn])
          );
        }
        return;
      }

      // 转换 useCallback() → 保持函数引用（LD不需要这个，因为函数本身就是稳定的）
      if (calleeName === 'useCallback') {
        const [fn] = path.node.arguments;
        // useCallback(fn, deps) → fn（直接返回函数）
        if (fn) {
          path.replaceWith(fn as t.Expression);
        }
        return;
      }

      // 转换 useRef() → createSignal()
      if (calleeName === 'useRef') {
        importsToAdd.add('createSignal');
        const [initialValue] = path.node.arguments;

        // useRef(init) → createSignal(init)
        path.replaceWith(
          t.callExpression(t.identifier('createSignal'), initialValue ? [initialValue] : [])
        );
        return;
      }
    },

    // 移除React的导入语句
    ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
      if (path.node.source.value === 'react' || (path.node.source.value as string).startsWith('react/')) {
        path.remove();
      }
    },
  });

  // 添加LD Signal API的导入
  if (importsToAdd.size > 0) {
    const importSpecifiers = Array.from(importsToAdd).map((name) =>
      t.importSpecifier(t.identifier(name), t.identifier(name))
    );
    const importDecl = t.importDeclaration(
      importSpecifiers,
      t.stringLiteral('@ld/reactivity')
    );
    transformedAST.program.body.unshift(importDecl);
  }

  return transformedAST;
}

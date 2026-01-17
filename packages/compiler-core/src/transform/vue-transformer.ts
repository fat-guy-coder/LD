import traverse, { type NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import template from '@babel/template';

/**
 * @description 将Vue3 Composition API转换为LD Signal API
 * @param vueAST - Vue3 script AST
 * @returns 转换后的AST
 */
export function transformVue3ToLD(vueAST: t.File): t.File {
  // 创建转换后的AST副本
  const transformedAST = t.cloneNode(vueAST, true);

  // 需要添加的导入语句
  const importsToAdd = new Set<string>();

  traverse(transformedAST, {
    // 统一处理所有Vue3 API调用
    CallExpression(path: NodePath<t.CallExpression>) {
      if (!t.isIdentifier(path.node.callee)) return;
      
      const calleeName = path.node.callee.name;

      // 转换 ref() → createSignal()
      if (calleeName === 'ref') {
        const args = path.node.arguments;
        if (args.length > 0) {
          importsToAdd.add('createSignal');
          path.replaceWith(
            t.callExpression(t.identifier('createSignal'), args)
          );
        }
        return;
      }

      // 转换 computed() → createComputed()
      if (calleeName === 'computed') {
        importsToAdd.add('createComputed');
        path.replaceWith(
          t.callExpression(t.identifier('createComputed'), path.node.arguments)
        );
        return;
      }

      // 转换 watch() → createEffect()
      if (calleeName === 'watch') {
        importsToAdd.add('createEffect');
        // watch(source, callback) → createEffect(() => callback(source()))
        const [source, callback] = path.node.arguments;
        if (source && callback) {
          const effectFn = t.arrowFunctionExpression(
            [],
            t.isFunction(callback)
              ? t.callExpression(callback as t.Function, [
                  t.isCallExpression(source) || t.isIdentifier(source)
                    ? t.callExpression(source as t.Expression, [])
                    : source as t.Expression,
                ])
              : callback as t.Expression
          );
          path.replaceWith(t.callExpression(t.identifier('createEffect'), [effectFn]));
        }
        return;
      }

      // 转换 watchEffect() → createEffect()
      if (calleeName === 'watchEffect') {
        importsToAdd.add('createEffect');
        path.replaceWith(
          t.callExpression(t.identifier('createEffect'), path.node.arguments)
        );
        return;
      }

      // 转换 reactive() → createReactive()
      if (calleeName === 'reactive') {
        importsToAdd.add('createReactive');
        path.replaceWith(
          t.callExpression(t.identifier('createReactive'), path.node.arguments)
        );
        return;
      }

      // 转换 unref() → 直接返回值（如果是signal则调用，否则返回原值）
      if (calleeName === 'unref') {
        // unref(x) → (typeof x === 'function' ? x() : x)
        const arg = path.node.arguments[0];
        if (arg) {
          const conditional = t.conditionalExpression(
            t.binaryExpression('===', t.unaryExpression('typeof', arg as t.Expression), t.stringLiteral('function')),
            t.callExpression(arg as t.Expression, []),
            arg as t.Expression
          );
          path.replaceWith(conditional);
        }
        return;
      }
    },

    // 移除Vue3的导入语句
    ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
      if (path.node.source.value === 'vue' || (path.node.source.value as string).startsWith('vue/')) {
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

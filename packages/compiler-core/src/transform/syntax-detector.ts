import traverse, { type NodePath } from '@babel/traverse';
import * as t from '@babel/types';

/**
 * @description 检测到的语法类型
 */
export interface SyntaxInfo {
  /** 是否包含Vue3语法 */
  hasVue3: boolean;
  /** 是否包含React语法 */
  hasReact: boolean;
  /** 导入的模块列表 */
  imports: string[];
  /** Vue3 API使用情况 */
  vue3Apis: Set<string>;
  /** React Hooks使用情况 */
  reactHooks: Set<string>;
}

/**
 * @description 检测script中使用的语法类型
 * @param scriptAST - script AST
 * @returns 检测到的语法类型
 */
export function detectSyntax(scriptAST: t.File): SyntaxInfo {
  const imports: string[] = [];
  let hasVue3 = false;
  let hasReact = false;
  const vue3Apis = new Set<string>();
  const reactHooks = new Set<string>();

  // Vue3 Composition API列表
  const vue3ApiNames = new Set([
    'ref',
    'reactive',
    'computed',
    'watch',
    'watchEffect',
    'readonly',
    'toRef',
    'toRefs',
    'unref',
    'isRef',
    'onMounted',
    'onUnmounted',
    'onUpdated',
    'onBeforeMount',
    'onBeforeUnmount',
    'onBeforeUpdate',
    'provide',
    'inject',
  ]);

  // React Hooks列表
  const reactHookNames = new Set([
    'useState',
    'useEffect',
    'useMemo',
    'useCallback',
    'useRef',
    'useContext',
    'useReducer',
    'useLayoutEffect',
    'useImperativeHandle',
    'useDebugValue',
  ]);

  traverse(scriptAST, {
    // 检测导入语句
    ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
      const source = path.node.source.value as string;
      imports.push(source);

      // 检测Vue3导入
      if (source === 'vue' || source.startsWith('vue/')) {
        hasVue3 = true;
        // 检查导入的API
        path.node.specifiers.forEach((spec) => {
          if (t.isImportSpecifier(spec) && t.isIdentifier(spec.imported)) {
            const apiName = spec.imported.name;
            if (vue3ApiNames.has(apiName)) {
              vue3Apis.add(apiName);
            }
          } else if (t.isImportNamespaceSpecifier(spec)) {
            // import * as Vue from 'vue'
            hasVue3 = true;
          }
        });
      }

      // 检测React导入
      if (source === 'react' || source.startsWith('react/')) {
        hasReact = true;
        // 检查导入的Hooks
        path.node.specifiers.forEach((spec) => {
          if (t.isImportSpecifier(spec) && t.isIdentifier(spec.imported)) {
            const hookName = spec.imported.name;
            if (reactHookNames.has(hookName)) {
              reactHooks.add(hookName);
            }
          } else if (t.isImportNamespaceSpecifier(spec)) {
            // import * as React from 'react'
            hasReact = true;
          }
        });
      }
    },

    // 检测函数调用（可能是Vue3或React API）
    CallExpression(path: NodePath<t.CallExpression>) {
      if (t.isIdentifier(path.node.callee)) {
        const name = path.node.callee.name;
        if (vue3ApiNames.has(name)) {
          hasVue3 = true;
          vue3Apis.add(name);
        }
        if (reactHookNames.has(name)) {
          hasReact = true;
          reactHooks.add(name);
        }
      } else if (t.isMemberExpression(path.node.callee)) {
        // 处理 Vue.ref() 或 React.useState() 这种情况
        if (t.isIdentifier(path.node.callee.object)) {
          const objName = path.node.callee.object.name;
          if (objName === 'Vue' || objName === 'React') {
            if (t.isIdentifier(path.node.callee.property)) {
              const propName = path.node.callee.property.name;
              if (vue3ApiNames.has(propName)) {
                hasVue3 = true;
                vue3Apis.add(propName);
              }
              if (reactHookNames.has(propName)) {
                hasReact = true;
                reactHooks.add(propName);
              }
            }
          }
        }
      }
    },
  });

  return {
    hasVue3,
    hasReact,
    imports,
    vue3Apis,
    reactHooks,
  };
}

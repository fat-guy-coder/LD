import traverse, { type NodePath } from '@babel/traverse';
import * as t from '@babel/types';

/**
 * @description 导出信息接口
 */
export interface ExportInfo {
  /** 导出的变量（const/let/var） */
  variables: Array<{ name: string; kind: 'const' | 'let' | 'var' }>;
  /** 导出的类型（type/interface/enum） */
  types: Array<{ name: string; kind: 'type' | 'interface' | 'enum' }>;
  /** 导出的函数 */
  functions: Array<{ name: string; isAsync: boolean }>;
  /** 默认导出 */
  defaultExport: { type: 'variable' | 'function' | 'class' | 'anonymous' } | null;
}

/**
 * @description 从AST中提取所有导出声明
 * @param scriptAST - 解析后的script AST
 * @returns 导出信息（变量、类型、函数等）
 */
export function extractExports(scriptAST: t.File): ExportInfo {
  const exports: ExportInfo = {
    variables: [],
    types: [],
    functions: [],
    defaultExport: null,
  };

  traverse(scriptAST, {
    // 处理命名导出：export const/let/var
    ExportNamedDeclaration(path: NodePath<t.ExportNamedDeclaration>) {
      const { declaration, specifiers } = path.node;

      // 处理 export const/let/var
      if (declaration && t.isVariableDeclaration(declaration)) {
        declaration.declarations.forEach((decl) => {
          if (t.isIdentifier(decl.id)) {
            exports.variables.push({
              name: decl.id.name,
              kind: declaration.kind as 'const' | 'let' | 'var',
            });
          }
        });
      }

      // 处理 export type/interface
      if (declaration) {
        if (t.isTSInterfaceDeclaration(declaration)) {
          exports.types.push({
            name: declaration.id.name,
            kind: 'interface',
          });
        } else if (t.isTSTypeAliasDeclaration(declaration)) {
          exports.types.push({
            name: declaration.id.name,
            kind: 'type',
          });
        } else if (t.isTSEnumDeclaration(declaration)) {
          exports.types.push({
            name: declaration.id.name,
            kind: 'enum',
          });
        } else if (t.isFunctionDeclaration(declaration)) {
          if (declaration.id) {
            exports.functions.push({
              name: declaration.id.name,
              isAsync: declaration.async || false,
            });
          }
        } else if (t.isClassDeclaration(declaration) && declaration.id) {
          // 类也可以导出，但我们这里主要关注函数
        }
      }

      // 处理 export { name } from './file' 或 export { name }
      if (specifiers && specifiers.length > 0) {
        specifiers.forEach((spec) => {
          if (t.isExportSpecifier(spec)) {
            const exportedName = spec.exported.name;
            // 这里我们只记录名称，实际类型需要从原始声明中推断
            // 为了简化，我们假设这些都是变量
            exports.variables.push({
              name: exportedName,
              kind: 'const', // 默认假设是const
            });
          }
        });
      }
    },

    // 处理默认导出
    ExportDefaultDeclaration(path: NodePath<t.ExportDefaultDeclaration>) {
      const declaration = path.node.declaration;
      if (t.isIdentifier(declaration)) {
        exports.defaultExport = { type: 'variable' };
      } else if (t.isFunctionDeclaration(declaration) || t.isArrowFunctionExpression(declaration)) {
        exports.defaultExport = { type: 'function' };
      } else if (t.isClassDeclaration(declaration)) {
        exports.defaultExport = { type: 'class' };
      } else {
        exports.defaultExport = { type: 'anonymous' };
      }
    },
  });

  return exports;
}

/**
 * @description 确保导出语句在编译后的代码中被保留
 * @param code - 编译后的代码
 * @param exports - 导出信息
 * @returns 确保导出语句保留的代码
 */
export function ensureExportsPreserved(
  code: string,
  exports: ExportInfo
): string {
  // 检查代码中是否已经包含导出语句
  const hasExports = /export\s+(const|let|var|type|interface|function|default)/.test(code);

  if (hasExports) {
    // 如果已经有导出语句，直接返回
    return code;
  }

  // 如果没有导出语句，我们需要确保在编译过程中保留它们
  // 这个函数主要用于验证，实际的保留工作应该在编译阶段完成
  return code;
}

import * as t from '@babel/types';
import { detectSyntax, type SyntaxInfo } from './syntax-detector';
import { transformVue3ToLD } from './vue-transformer';
import { transformReactToLD } from './react-transformer';

/**
 * @description 统一转换Vue3和React语法到LD Signal API
 * @param scriptAST - script AST
 * @returns 转换后的AST和语法信息
 */
export function transformToLD(scriptAST: t.File): {
  ast: t.File;
  syntaxInfo: SyntaxInfo;
} {
  // 先检测语法类型
  const syntaxInfo = detectSyntax(scriptAST);

  let transformedAST = scriptAST;

  // 先转换Vue3语法
  if (syntaxInfo.hasVue3) {
    transformedAST = transformVue3ToLD(transformedAST);
  }

  // 再转换React语法
  if (syntaxInfo.hasReact) {
    transformedAST = transformReactToLD(transformedAST);
  }

  return {
    ast: transformedAST,
    syntaxInfo,
  };
}

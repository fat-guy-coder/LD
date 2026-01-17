// ===== parse/index.ts =====
export { parse } from './parse';

// ===== transform/index.ts =====
export {
  detectSyntax,
  transformVue3ToLD,
  transformReactToLD,
  transformToLD,
  type SyntaxInfo,
} from './transform';

// ===== codegen/index.ts =====
export { generateNativeJS, type CodegenOptions } from './codegen';


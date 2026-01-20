/**
 * @description LD框架 JSX 运行时
 * 提供 React JSX 兼容的运行时函数
 */

export function jsx(type: any, props: any, key?: any): any {
  // 在编译时会被替换为实际的DOM创建逻辑
  return { type, props, key }
}

export function jsxs(type: any, props: any, key?: any): any {
  // 在编译时会被替换为实际的DOM创建逻辑
  return { type, props, key }
}

export function Fragment(props: { children?: any }): any {
  // 在编译时会被替换为实际的Fragment逻辑
  return props.children
}

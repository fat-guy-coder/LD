/**
 * @module @ld/router
 * @description 极致性能的路由系统
 */

/**
 * @description 创建一个 Router 实例
 * @param options 路由选项, 包含 history 和 routes
 * @returns 一个 Router 实例
 */
export { createRouter, type Router, type RouterOptions } from './router';

/**
 * @description 创建一个基于浏览器 History API 的路由历史
 * @param base 基础路径, 例如 /app/
 * @returns 一个 RouterHistory 实例
 */
export { createWebHistory, type RouterHistory } from './history';

/**
 * @description 路由记录和匹配器相关的类型定义
 */
export {
  type RouteRecordRaw,
  type RouteComponent,
  type RouteRecordNormalized,
  type ResolvedMatcherLocation,
  type RouterMatcher,
} from './matcher';

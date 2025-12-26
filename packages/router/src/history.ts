// 复杂度: create: O(1), push/replace: O(1), 优化: 使用 Signal 实现响应式位置

import { createSignal, type Signal } from '@ld/reactivity';

/**
 * 路由历史记录的通用接口
 */
export interface RouterHistory {
  /**
   * 当前的 URL 路径, 是一个响应式 Signal
   */
  location: Signal<string>;
  /**
   * 当前的 history state, 是一个响应式 Signal
   */
  state: Signal<any>;
  /**
   * 导航到一个新的 URL
   * @param path 新的路径
   * @param state 附加的状态
   */
  push(path: string, state?: any): void;
  /**
   * 替换当前的 URL
   * @param path 新的路径
   * @param state 附加的状态
   */
  replace(path: string, state?: any): void;
  /**
   * 在历史记录中前进或后退
   * @param delta 移动的步数
   */
  go(delta: number): void;
}

/**
 * 创建一个基于浏览器 History API 的路由历史
 * @param base 基础路径, 例如 /app/
 * @returns 一个 RouterHistory 实例
 */
export function createWebHistory(base = ''): RouterHistory {
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;

  const currentLocation = createSignal(window.location.pathname.replace(cleanBase, '') || '/');
  const currentState = createSignal(window.history.state);

  // 监听浏览器的前进/后退事件
  window.addEventListener('popstate', (event) => {
    currentLocation[1](window.location.pathname.replace(cleanBase, '') || '/');
    currentState[1](event.state);
  });

  function push(path: string, state: any = {}) {
    const finalPath = cleanBase + path;
    window.history.pushState(state, '', finalPath);
    currentLocation[1](path);
    currentState[1](state);
  }

  function replace(path: string, state: any = {}) {
    const finalPath = cleanBase + path;
    window.history.replaceState(state, '', finalPath);
    currentLocation[1](path);
    currentState[1](state);
  }

  function go(delta: number) {
    window.history.go(delta);
  }

  return {
    location: currentLocation,
    state: currentState,
    push,
    replace,
    go,
  };
}

// TODO: 实现 createWebHashHistory 和 createMemoryHistory 以支持不同环境

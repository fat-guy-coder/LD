// 复杂度: create: O(N) (N为路由数), push/replace: O(M) (M为匹配器复杂度), 优化: 响应式集成

import { type App } from 'vue'; // 假设与Vue集成, 这里用类型
import { createSignal, type Signal, createEffect } from '@ld/reactivity';
import { createRouterMatcher, type RouteRecordRaw, type ResolvedMatcherLocation } from './matcher';
import { type RouterHistory } from './history';

export interface RouterOptions {
  history: RouterHistory;
  routes: RouteRecordRaw[];
}

export interface Router {
  install(app: App): void;
  readonly currentRoute: Signal<ResolvedMatcherLocation>;
  push(path: string): void;
  replace(path: string): void;
  go(delta: number): void;
}

/**
 * 创建一个 Router 实例
 * @param options 路由选项, 包含 history 和 routes
 * @returns 一个 Router 实例
 */
export function createRouter(options: RouterOptions): Router {
  const { history, routes } = options;
  const matcher = createRouterMatcher(routes);

  // 创建一个 signal 来存储当前路由信息, 初始值为 matcher 对当前 location 的解析结果
  const currentRoute = createSignal<ResolvedMatcherLocation>(
    matcher.resolve({ path: history.location[0]() })
  );

  // 创建一个 effect, 当 history.location 变化时, 自动更新 currentRoute
  createEffect(() => {
    const newLocation = history.location[0]();
    const resolved = matcher.resolve({ path: newLocation });
    // TODO: 在更新前执行路由守卫 (navigation guards)
    currentRoute[1](resolved);
  });

  function push(path: string) {
    history.push(path);
  }

  function replace(path: string) {
    history.replace(path);
  }

  function go(delta: number) {
    history.go(delta);
  }

  function install(app: App) {
    // 将 router 实例注入到 Vue 应用中
    app.config.globalProperties['$router'] = router;
    Object.defineProperty(app.config.globalProperties, '$route', {
      enumerable: true,
      get: () => currentRoute[0](),
    });

    // TODO: 提供 <RouterView> 和 <RouterLink> 组件
    // app.component('RouterView', RouterView);
    // app.component('RouterLink', RouterLink);
  }

  const router: Router = {
    install,
    currentRoute,
    push,
    replace,
    go,
  };

  return router;
}

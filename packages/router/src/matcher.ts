// 复杂度: addRoute: O(1), resolve: O(N) (N为路由数), 优化: 路由表预处理, 动态规划/Trie树匹配

/**
 * 路由组件
 */
export type RouteComponent = any; // 在运行时是组件定义, 这里用 any

/**
 * 单个路由记录 (用户定义)
 */
export interface RouteRecordRaw {
  path: string;
  name?: string;
  component: RouteComponent;
  children?: RouteRecordRaw[];
  meta?: any;
}

/**
 * 标准化后的路由记录 (内部使用)
 */
export interface RouteRecordNormalized {
  path: string;
  name?: string;
  components: Record<string, RouteComponent>; // 支持命名视图
  children: RouteRecordNormalized[];
  meta: any;
  // TODO: 添加 beforeEnter, props, etc.
}

/**
 * 路由匹配器返回的解析结果
 */
export interface ResolvedMatcherLocation {
  name?: string;
  path: string;
  params: Record<string, string>;
  matched: RouteRecordNormalized[];
}

/**
 * 路由匹配器接口
 */
export interface RouterMatcher {
  resolve(location: { path: string }): ResolvedMatcherLocation;
  addRoute(route: RouteRecordRaw): () => void; // 返回一个删除该路由的函数
  removeRoute(name: string): void;
  getRoutes(): RouteRecordNormalized[];
}

/**
 * 创建一个路由匹配器
 * @param routes 初始路由配置
 * @returns 一个 RouterMatcher 实例
 */
export function createRouterMatcher(routes: RouteRecordRaw[]): RouterMatcher {
  const matchers: RouteRecordNormalized[] = [];
  const nameMap = new Map<string, RouteRecordNormalized>();

  function addRoute(route: RouteRecordRaw, parent?: RouteRecordNormalized) {
    const normalizedRecord = normalizeRouteRecord(route);

    if (parent) {
      normalizedRecord.path = `${parent.path}/${normalizedRecord.path}`.replace('//', '/');
      parent.children.push(normalizedRecord);
    } else {
      matchers.push(normalizedRecord);
    }

    if (route.name) {
      nameMap.set(route.name, normalizedRecord);
    }

    if (route.children) {
      route.children.forEach(childRoute => addRoute(childRoute, normalizedRecord));
    }

    // 返回一个删除此路由的函数
    return () => {
      // TODO: 实现删除路由的逻辑
    };
  }

  function removeRoute(name: string) {
    const record = nameMap.get(name);
    if (record) {
      nameMap.delete(name);
      // TODO: 从 matchers 数组中移除 record
    }
  }

  function resolve({ path }: { path: string }): ResolvedMatcherLocation {
    // TODO: 实现真正的路径匹配算法 (path-to-regexp)
    // 这里使用一个简化的startsWith匹配作为临时方案
    const matched: RouteRecordNormalized[] = [];
    let currentPath = path;

    for (const record of matchers) {
      if (currentPath.startsWith(record.path)) {
        matched.push(record);
        // TODO: 处理嵌套路由的匹配
      }
    }

    return {
      path,
      matched,
      params: {}, // TODO: 提取路径参数
    };
  }

  function getRoutes() {
    return matchers;
  }

  // 初始化时添加所有路由
  routes.forEach(route => addRoute(route));

  return { resolve, addRoute, removeRoute, getRoutes };
}

/**
 * 将用户定义的路由记录标准化
 * @param record 用户定义的路由记录
 * @returns 标准化后的路由记录
 * @internal
 */
function normalizeRouteRecord(record: RouteRecordRaw): RouteRecordNormalized {
  return {
    path: record.path,
    name: record.name || '',
    components: { default: record.component },
    children: [],
    meta: record.meta || {},
  };
}

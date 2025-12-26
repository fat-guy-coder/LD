import { type VNode, VNodeTypes, createTextVNode } from '../vnode';
import { createComponentInstance, type ComponentInstance } from '../component';
import { ReactiveEffect } from '@ld/reactivity';

// Placeholder for the scheduler function
function queueJob(job: any) {
  // TODO: Implement a proper scheduler
  job();
}

// ==================================================================================================
// 渲染器选项 (Renderer Options)
// ==================================================================================================

/**
 * @description 定义了平台无关的渲染器操作。
 * @internal
 */
export interface RendererOptions {
  createElement: (tag: string) => any;
  createText: (text: string) => any;
  patchProp: (el: any, key: string, prevValue: any, nextValue: any) => void;
  insert: (child: any, parent: any, anchor?: any) => void;
  remove: (child: any) => void;
  setElementText: (el: any, text: string) => void;
}

// ==================================================================================================
// 渲染器创建 (Renderer Creation)
// ==================================================================================================

/**
 * @description 创建一个基于虚拟DOM的平台无关渲染器。
 * @param options - 包含平台特定操作的对象。
 * @returns 一个包含 `render` 函数的对象。
 * @internal
 * @since v0.1.0
 */
export function createVdomRenderer(options: RendererOptions) {
  const { 
    createElement,
    createText,
    patchProp,
    insert,
    remove,
    setElementText 
  } = options;

  /**
   * @description 渲染 VNode 到容器中。
   * @param vnode - 要渲染的虚拟节点。
   * @param container - 目标容器元素。
   * @public
   */
  const render = (vnode: VNode | null, container: any) => {
    if (vnode) {
      // 如果 vnode 存在，则进行 patch 操作
      patch(container._vnode || null, vnode, container);
    } else {
      // 如果 vnode 不存在，且容器中已有内容，则卸载
      if (container._vnode) {
        unmount(container._vnode);
      }
    }
    // 缓存 vnode，用于下次更新
    container._vnode = vnode;
  };

  /**
   * @description VNode 的核心 patch 函数，处理挂载和更新。
   * @internal
   */
  const patch = (n1: VNode | null, n2: VNode, container: any, anchor: any = null) => {
    // 如果新旧 VNode 类型不同，直接卸载旧的
    if (n1 && n1.type !== n2.type) {
      unmount(n1);
      n1 = null;
    }

    // 根据 VNode 类型调用不同的处理函数
    switch (n2.type) {
      case VNodeTypes.ELEMENT:
        processElement(n1, n2, container, anchor);
        break;
      case VNodeTypes.TEXT:
        processText(n1, n2, container, anchor);
        break;
      case VNodeTypes.COMPONENT:
        processComponent(n1, n2, container, anchor);
        break;
      // TODO: 实现 Fragment 和其他类型
    }
  };

  // ==================================================================================================
  // VNode 处理函数 (VNode Processors)
  // ==================================================================================================

  const processElement = (n1: VNode | null, n2: VNode, container: any, anchor: any) => {
    if (!n1) {
      // 挂载新元素
      mountElement(n2, container, anchor);
    } else {
      // 更新现有元素
      patchElement(n1, n2);
    }
  };

  const processText = (n1: VNode | null, n2: VNode, container: any, anchor: any) => {
    if (!n1) {
      // 挂载新文本节点
      const el = (n2.el = createText(n2.tag as string));
      insert(el, container, anchor);
    } else {
      // 更新文本内容
      const el = (n2.el = n1.el);
      if (n2.tag !== n1.tag) {
        setElementText(el!, n2.tag as string);
      }
    }
  };

  const processComponent = (n1: VNode | null, n2: VNode, container: any, anchor: any) => {
    if (!n1) {
      mountComponent(n2, container, anchor);
    } else {
      // TODO: 更新组件
    }
  };

  // ==================================================================================================
  // 挂载逻辑 (Mount Logic)
  // ==================================================================================================

  const mountElement = (vnode: VNode, container: any, anchor: any) => {
    const el = (vnode.el = createElement(vnode.tag as string));

    // 处理 props
    if (vnode.props) {
      for (const key in vnode.props) {
        patchProp(el, key, null, vnode.props[key]);
      }
    }

    // 处理 children
    if (vnode.children) {
      mountChildren(vnode.children, el);
    }

    insert(el, container, anchor);
  };

  const mountChildren = (children: (VNode | string)[], container: any) => {
    for (const child of children) {
      const childVNode = typeof child === 'string' ? createTextVNode(child) : child;
      patch(null, childVNode, container);
    }
  };

  const mountComponent = (initialVNode: VNode, container: any, anchor: any) => {
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode.tag as any,
      initialVNode.props as Record<string, any>
    ));

    // 设置渲染 effect
    setupRenderEffect(instance, initialVNode, container, anchor);
  };

  // ==================================================================================================
  // 更新逻辑 (Patch Logic)
  // ==================================================================================================

  const patchElement = (n1: VNode, n2: VNode) => {
    const el = (n2.el = n1.el!);

    // 更新 props
    const oldProps = n1.props;
    const newProps = n2.props;
    patchProps(el, oldProps, newProps);

    // 更新 children
    patchChildren(n1, n2, el);
  };

  const patchProps = (el: any, oldProps: Record<string, any> | null | undefined, newProps: Record<string, any> | null | undefined) => {
    const _oldProps = oldProps || {};
    const _newProps = newProps || {};
    if (_oldProps !== _newProps) {
      // 更新或添加新属性
      for (const key in _newProps) {
        const prev = _oldProps[key];
        const next = _newProps[key];
        if (prev !== next) {
          patchProp(el, key, prev, next);
        }
      }
      // 移除旧属性
      for (const key in _oldProps) {
        if (!(key in _newProps)) {
          patchProp(el, key, _oldProps[key], null);
        }
      }
    }
  };

  const patchChildren = (n1: VNode, n2: VNode, container: any) => {
    // TODO: 实现完整的 children diff 算法
    const c1 = n1.children as VNode[];
    const c2 = n2.children as VNode[];

    if (!c2) {
      // 新的 children 为空，卸载所有旧的
      if (c1) {
        unmountChildren(c1);
      }
    } else {
      if (!c1) {
        // 旧的 children 为空，挂载所有新的
        mountChildren(c2, container);
      } else {
        // TODO: 复杂的 diff 逻辑
      }
    }
  };

  // ==================================================================================================
  // 卸载逻辑 (Unmount Logic)
  // ==================================================================================================

  const unmount = (vnode: VNode) => {
    // TODO: 调用 beforeUnmount 钩子
    remove(vnode.el!);
    // TODO: 调用 onUnmount 钩子
  };

  const unmountChildren = (children: VNode[]) => {
    for (const child of children) {
      unmount(child);
    }
  };

  // ==================================================================================================
  // 组件渲染 Effect (Component Render Effect)
  // ==================================================================================================

  const setupRenderEffect = (
    instance: ComponentInstance,
    initialVNode: VNode,
    container: any,
    anchor: any
  ) => {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        // 挂载
        // TODO: 调用 beforeMount 钩子
        const subTree = (instance.subTree = instance.component.setup(instance.props, {}) as VNode);
        patch(null, subTree, container, anchor);
        initialVNode.el = subTree.el;
        // 调用 onMount 钩子
        instance.onMount.forEach(hook => hook());
        instance.isMounted = true;
      } else {
        // 更新
        // TODO: 调用 beforeUpdate 钩子
        const prevSubTree = instance.subTree;
        const nextSubTree = (instance.subTree = instance.component.setup(instance.props, {}) as VNode);
        patch(prevSubTree, nextSubTree, container, anchor);
        initialVNode.el = nextSubTree.el;
        // 调用 onUpdate 钩子
        instance.onUpdate.forEach(hook => hook());
      }
    };

    // 创建渲染 effect
    const effect = (instance.effect = new ReactiveEffect(
      componentUpdateFn,
      () => queueJob(effect) // 使用 reactivity 模块的调度器
    ));

    // 立即执行一次以完成初始渲染
    effect.run();
  };

  return { render };
}

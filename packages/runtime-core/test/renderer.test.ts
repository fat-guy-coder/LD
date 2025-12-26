import { describe, it, expect, vi } from 'vitest';
import { createVdomRenderer, type VdomRendererOptions } from '../src/renderer/vdomRenderer';
import { createVNode, createTextVNode, VNodeTypes } from '../src/vnode';
import { createSignal } from '@ld/reactivity';
import { onMount } from '../src/component';

describe('VDOM Renderer', () => {
  // 模拟平台相关的渲染操作
  const hostOps: VdomRendererOptions = {
    createElement: vi.fn(tag => ({ tag, props: {}, children: [] })),
    createText: vi.fn(text => ({ text, type: 'text' })),
    patchProp: vi.fn((el, key, prev, next) => (el.props[key] = next)),
    insert: vi.fn((child, parent) => parent.children.push(child)),
    remove: vi.fn(),
    setElementText: vi.fn((el, text) => (el.textContent = text)),
  };

  it('should create a renderer', () => {
    const renderer = createVdomRenderer(hostOps);
    expect(renderer).toHaveProperty('render');
  });

  it('should mount an element with props and children', () => {
    const { render } = createVdomRenderer(hostOps);
    const container = { _vnode: null, children: [] };
    const vnode = createVNode(
      VNodeTypes.ELEMENT,
      'div',
      { id: 'foo' },
      ['hello']
    );

    render(vnode, container);

    expect(hostOps.createElement).toHaveBeenCalledWith('div');
    expect(hostOps.patchProp).toHaveBeenCalledWith(expect.any(Object), 'id', null, 'foo');
    expect(hostOps.createText).toHaveBeenCalledWith('hello');
    expect(container.children.length).toBe(1);
    expect(container.children[0].tag).toBe('div');
  });

  it('should mount a text node', () => {
    const { render } = createVdomRenderer(hostOps);
    const container = { _vnode: null, children: [] };
    const vnode = createTextVNode('hello world');

    render(vnode, container);

    expect(hostOps.createText).toHaveBeenCalledWith('hello world');
    expect(container.children.length).toBe(1);
    expect(container.children[0].type).toBe('text');
  });

  it('should patch props on an element', () => {
    const { render } = createVdomRenderer(hostOps);
    const container = { _vnode: null, children: [] };
    const vnode1 = createVNode(VNodeTypes.ELEMENT, 'div', { id: 'foo' });
    render(vnode1, container);

    const vnode2 = createVNode(VNodeTypes.ELEMENT, 'div', { id: 'bar', class: 'baz' });
    render(vnode2, container);

    expect(hostOps.patchProp).toHaveBeenCalledWith(expect.any(Object), 'id', 'foo', 'bar');
    expect(hostOps.patchProp).toHaveBeenCalledWith(expect.any(Object), 'class', undefined, 'baz');
  });

  it('should mount a simple component and call its lifecycle hooks', () => {
    const mountHook = vi.fn();
    const SimpleComponent = {
      setup() {
        onMount(mountHook);
        const [count] = createSignal(0);
        return createVNode(VNodeTypes.ELEMENT, 'div', null, [`count: ${count()}`]);
      },
    };

    const { render } = createVdomRenderer(hostOps);
    const container = { _vnode: null, children: [] };
    const vnode = createVNode(VNodeTypes.COMPONENT, SimpleComponent, {});

    render(vnode, container);

    expect(mountHook).toHaveBeenCalledTimes(1);
    expect(hostOps.createElement).toHaveBeenCalledWith('div');
  });
});

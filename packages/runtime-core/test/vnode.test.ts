import { describe, it, expect } from 'vitest';
import {
  createVNode,
  createTextVNode,
  isVNode,
  VNodeSymbol,
  VNodeTypes,
} from '../src/vnode';

describe('VNode', () => {
  it('should create a VNode with correct properties', () => {
    const props = { id: 'foo' };
    const children = [createTextVNode('hello')];
    const vnode = createVNode(VNodeTypes.ELEMENT, 'div', props, children);

    expect(vnode).toBeDefined();
    expect(vnode[VNodeSymbol]).toBe(true);
    expect(vnode.type).toBe(VNodeTypes.ELEMENT);
    expect(vnode.tag).toBe('div');
    expect(vnode.props).toBe(props);
    expect(vnode.children).toBe(children);
    expect(vnode.el).toBe(null);
    expect(vnode.component).toBe(null);
  });

  it('should create a text VNode', () => {
    const textContent = 'Hello, LD!';
    const vnode = createTextVNode(textContent);

    expect(vnode.type).toBe(VNodeTypes.TEXT);
    expect(vnode.tag).toBe(textContent);
    expect(vnode.props).toBe(null);
    expect(vnode.children).toBe(null);
  });

  it('should correctly identify a VNode with isVNode', () => {
    const vnode = createVNode(VNodeTypes.ELEMENT, 'p');
    const notAVNode = { type: 'element', tag: 'p' };
    const emptyObject = {};
    const nullValue = null;

    expect(isVNode(vnode)).toBe(true);
    expect(isVNode(notAVNode)).toBe(false);
    expect(isVNode(emptyObject)).toBe(false);
    expect(isVNode(nullValue)).toBe(false);
  });
});


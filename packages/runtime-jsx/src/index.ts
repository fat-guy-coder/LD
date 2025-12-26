import type { Component } from '@ld/runtime-core';

export const Fragment = Symbol('Fragment');

/**
 * The runtime function to transform JSX into DOM elements.
 * This is the target of the Babel plugin.
 * @param type The tag name or a component.
 * @param props The properties/attributes of the element.
 * @param children The child elements.
 * @returns An HTML element or a document fragment.
 */
export function h(type: string | typeof Fragment | Component, props: any, ...children: any[]) {
  if (type === Fragment) {
    const fragment = document.createDocumentFragment();
    for (const child of children.flat()) {
      fragment.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return fragment;
  }

  if (typeof type === 'string') {
    const el = document.createElement(type);

    for (const key in props) {
      if (key.startsWith('on') && key.toLowerCase() in window) {
        el.addEventListener(key.toLowerCase().substring(2), props[key]);
      } else {
        el.setAttribute(key, props[key]);
      }
    }

    for (const child of children.flat()) {
      el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }

    return el;
  }

  // TODO: Handle component rendering logic
  return document.createComment('component placeholder');
}


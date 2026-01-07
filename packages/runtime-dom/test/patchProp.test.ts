import { describe, it, expect, vi, beforeEach } from 'vitest';
import { patchProp } from '../src/modules';

describe('runtime-dom/modules/patchProp', () => {
  let el: HTMLElement;

  beforeEach(() => {
    el = document.createElement('div');
  });

  describe('attributes', () => {
    it('should patch attributes', () => {
      patchProp(el, 'id', null, 'test-id');
      expect(el.getAttribute('id')).toBe('test-id');
      patchProp(el, 'id', 'test-id', null);
      expect(el.getAttribute('id')).toBe(null);
    });
  });

  describe('class', () => {
    it('should patch class', () => {
      patchProp(el, 'class', null, 'class1 class2');
      expect(el.className).toBe('class1 class2');
      patchProp(el, 'class', 'class1 class2', null);
      expect(el.hasAttribute('class')).toBe(false);
    });
  });

  describe('style', () => {
    it('should patch style as a string', () => {
      patchProp(el, 'style', null, 'color: red; font-size: 16px;');
      expect(el.style.color).toBe('red');
      expect(el.style.fontSize).toBe('16px');
    });

    it('should patch style as an object', () => {
      const prevStyle = { color: 'red' };
      const nextStyle = { fontSize: '16px' };
      patchProp(el, 'style', prevStyle, nextStyle);
      expect(el.style.color).toBe('');
      expect(el.style.fontSize).toBe('16px');
    });

    it('should update from style string to object', () => {
      patchProp(el, 'style', 'color: red;', { fontSize: '16px' });
      expect(el.style.color).toBe(''); // Should be removed
      expect(el.style.fontSize).toBe('16px');
    });

    it('should update from style object to string', () => {
      patchProp(el, 'style', { color: 'red' }, 'font-size: 16px;');
      expect(el.style.cssText).toBe('font-size: 16px;');
    });

    it('should remove styles with null/undefined values in object', () => {
      patchProp(el, 'style', { color: 'red' }, { color: null, fontSize: '16px' });
      expect(el.style.color).toBe('');
      expect(el.style.fontSize).toBe('16px');
    });

    it('should remove all styles when patching with null', () => {
      patchProp(el, 'style', { color: 'red' }, null);
      expect(el.style.color).toBe('');
    });
  });

  describe('events', () => {
    it('should patch event listeners', () => {
      const handler = vi.fn();
      patchProp(el, 'onClick', null, handler);

      el.dispatchEvent(new Event('click'));
      expect(handler).toHaveBeenCalledTimes(1);

      const newHandler = vi.fn();
      patchProp(el, 'onClick', handler, newHandler);
      el.dispatchEvent(new Event('click'));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(newHandler).toHaveBeenCalledTimes(1);

      patchProp(el, 'onClick', newHandler, null);
      el.dispatchEvent(new Event('click'));
      expect(newHandler).toHaveBeenCalledTimes(1);
    });

    it('should support event handler arrays', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      patchProp(el, 'onClick', null, [handler1, handler2]);

      el.dispatchEvent(new Event('click'));
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should handle capture modifier', () => {
      const handler = vi.fn();
      const parent = document.createElement('div');
      parent.appendChild(el);
      patchProp(parent, 'onClick.capture', null, handler);

      el.dispatchEvent(new Event('click', { bubbles: true }));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle once modifier', () => {
      const handler = vi.fn();
      patchProp(el, 'onClick.once', null, handler);

      el.dispatchEvent(new Event('click'));
      el.dispatchEvent(new Event('click'));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle stop modifier (stopPropagation)', () => {
      const parentHandler = vi.fn();
      const childHandler = (e: Event) => e.stopPropagation();
      const parent = document.createElement('div');
      parent.appendChild(el);

      patchProp(parent, 'onClick', null, parentHandler);
      patchProp(el, 'onClick', null, childHandler);

      el.dispatchEvent(new Event('click', { bubbles: true }));
      expect(parentHandler).not.toHaveBeenCalled();
    });

    it('should handle prevent modifier (preventDefault)', () => {
      const handler = vi.fn();
      const event = new Event('click', { cancelable: true });
      Object.defineProperty(event, 'preventDefault', { value: handler });

      patchProp(el, 'onClick.prevent', null, () => {});
      el.dispatchEvent(event);
      expect(handler).toHaveBeenCalled();
    });

    it('should correctly parse complex event names', () => {
      const handler = vi.fn();
      const parent = document.createElement('div');
      parent.appendChild(el);

      // Test multiple modifiers
      patchProp(parent, 'onClick.capture.once', null, handler);
      el.dispatchEvent(new Event('click', { bubbles: true }));
      el.dispatchEvent(new Event('click', { bubbles: true }));
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});

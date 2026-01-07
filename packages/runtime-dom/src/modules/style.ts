/**
 * @description Patches the `style` attribute.
 * @param el - The target element.
 * @param prevValue - The previous style value (string or object).
 * @param nextValue - The next style value (string or object).
 */
export function patchStyle(
  el: HTMLElement,
  prevValue: string | Record<string, string | null> | null,
  nextValue: string | Record<string, string | null> | null
): void {
  const { style } = el;

  // If the new value is a string, just set it as cssText.
  if (typeof nextValue === 'string') {
    if (prevValue !== nextValue) {
      style.cssText = nextValue;
    }
    return;
  }

  // If the new value is not a string (it's an object or null)

  // First, remove styles from the old value that are not in the new value.
  if (prevValue && typeof prevValue === 'object') {
    for (const key in prevValue) {
      if (nextValue == null || nextValue[key] == null) {
        // In the new object, this key is gone, so remove the property.
        style.removeProperty(key);
      }
    }
  }

  // Now, add or update styles from the new value.
  if (nextValue) {
    for (const key in nextValue) {
      const nextStyleValue = nextValue[key];
      const prevStyleValue = prevValue && typeof prevValue === 'object' ? prevValue[key] : null;

      // Only set the property if the value has changed.
      if (nextStyleValue != null && nextStyleValue !== prevStyleValue) {
        style.setProperty(key, nextStyleValue);
      }
    }
  }
}

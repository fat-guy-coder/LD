/**
 * @fileoverview DOM event handling logic with support for event modifiers.
 * This implementation uses an "invoker" pattern to avoid unnecessary
 * `removeEventListener` calls when event handlers are updated.
 * It also supports Vue-like event modifiers like .capture, .passive, .once, .prevent, and .stop.
 */

// A more specific type for event handlers
type EventHandler = (event: Event) => void;

// Extend the Element interface to include our custom invoker storage
interface ElementWithInvokers extends Element {
  _vei?: Record<string, EventInvoker | null>;
}

/**
 * @description Patches DOM event listeners.
 * @param el - The target element.
 * @param rawName - The raw event name, potentially with modifiers (e.g., 'onClick.capture.stop').
 * @param prevValue - The previous event handler or array of handlers.
 * @param nextValue - The next event handler or array of handlers.
 */
export function patchEvent(
  el: ElementWithInvokers,
  rawName: string,
  prevValue: EventHandler | EventHandler[] | null,
  nextValue: EventHandler | EventHandler[] | null
): void {
  // vei = vue event invokers. Store all invokers on the element itself.
  const invokers = el._vei || (el._vei = {});
  const existingInvoker = invokers[rawName];

  if (nextValue && existingInvoker) {
    // An invoker for this event already exists.
    // Just update its attached handler, which is much faster than removing and re-adding the listener.
    existingInvoker.value = nextValue;
  } else {
    const { name, options, modifiers } = parseEventName(rawName);

    if (nextValue) {
      // No existing invoker, create a new one.
      const invoker = (invokers[rawName] = createInvoker(nextValue, modifiers));
      el.addEventListener(name, invoker, options);
    } else if (existingInvoker) {
      // No new handler, so remove the existing listener.
      el.removeEventListener(name, existingInvoker, options);
      invokers[rawName] = null; // Use null for better GC
    }
  }
}

interface ParsedEvent {
  name: string;
  options: AddEventListenerOptions;
  modifiers: string[];
}

/**
 * @description Parses the raw event name to extract the event name, listener options, and handler modifiers.
 * @param rawName - e.g., 'onClick.capture.prevent'
 * @returns An object containing the event name, options for `addEventListener`, and modifiers for the handler.
 */
function parseEventName(rawName: string): ParsedEvent {
  const eventNameWithModifiers = rawName.slice(2);
  const dotIndex = eventNameWithModifiers.indexOf('.');

  const name = (
    dotIndex > 0
      ? eventNameWithModifiers.slice(0, dotIndex)
      : eventNameWithModifiers
  ).toLowerCase();

  const modifierStrings =
    dotIndex > 0 ? eventNameWithModifiers.slice(dotIndex + 1).split('.') : [];

  const options: AddEventListenerOptions = {};
  const modifiers: string[] = [];

  for (const mod of modifierStrings) {
    if (mod === 'capture' || mod === 'passive' || mod === 'once') {
      options[mod] = true;
    } else {
      modifiers.push(mod);
    }
  }

  return { name, options, modifiers };
}

// A type for the invoker function, which has additional properties.
type EventInvoker = ((e: Event) => void) & {
  value: EventHandler | EventHandler[];
  attached: number;
};

/**
 * @description Creates a wrapper function (invoker) that allows the event handler to be updated
 * without needing to remove and re-add the event listener. It also applies handler modifiers.
 * @param initialValue - The initial event handler function or array of functions.
 * @param modifiers - Handler modifiers like 'stop' or 'prevent'.
 * @returns A wrapper function (invoker).
 */
function createInvoker(
  initialValue: EventHandler | EventHandler[],
  modifiers: string[]
): EventInvoker {
  const invoker: EventInvoker = (e: Event) => {
    if (e.timeStamp < invoker.attached) return;

    if (modifiers.includes('stop')) e.stopPropagation();
    if (modifiers.includes('prevent')) e.preventDefault();

    const value = invoker.value;
    if (Array.isArray(value)) {
      value.slice().forEach(fn => fn(e));
    } else {
      value(e);
    }
  };

  invoker.value = initialValue;
  invoker.attached = performance.now();

  return invoker;
}

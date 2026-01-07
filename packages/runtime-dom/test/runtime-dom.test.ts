import { describe, it, expect } from 'vitest';
import { createApp } from '@ld/runtime-dom';
import { createSignal } from '@ld/reactivity';

describe('runtime-dom integration', () => {
  it('should create and mount a component that reacts to state changes', async () => {
    // 1. Create a container element in the JSDOM environment
    const container = document.createElement('div');

    // 2. Define a simple reactive component using the new signal API
    const count = createSignal(0); // createSignal now returns a single function
    const App = {
      setup() {
        return { count };
      },
      render(ctx: any) {
        return {
          type: 'div',
          props: { id: 'counter' },
          children: `Count: ${ctx.count()}`, // Read value by calling the signal
        };
      },
    };

    // 3. Create and mount the app
    createApp(App).mount(container);

    // 4. Assert initial render is correct
    const counterEl = container.querySelector('#counter');
    expect(counterEl).not.toBeNull();
    expect(counterEl?.textContent).toBe('Count: 0');

    // 5. Update the state
    count(1); // Set value by calling the signal with an argument

    // Wait for the microtask queue to flush
    await Promise.resolve();

    // 6. Assert the DOM has been updated
    expect(counterEl?.textContent).toBe('Count: 1');
  });
});



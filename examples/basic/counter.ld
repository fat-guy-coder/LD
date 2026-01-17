<template>
  <div class="counter">
    <h1>Counter: {count}</h1>
    
    <p class:is-even={isEven}>
      The current count is {isEven ? 'even' : 'odd'}.
    </p>

    <button @click={increment}>
      Increment
    </button>
  </div>
</template>

<script setup lang="ts">
// V5: Using shorthand macros `s:` for signal and `c:` for computed.
s: count = 0;
c: isEven = count % 2  === 0;

function increment() {
  // The compiler will transform this into a signal update.
  count = count + 1; 
}

// V5: The new effect macro.
effect(() => {
  console.log(`The count is now: ${count}`);
  
  // Optional cleanup function
  return () => {
    console.log('Cleaning up previous effect for count:', count);
  }
}, [count]);




</script>

<style scoped>
  .counter {
    text-align: center;
    padding: 1rem;
  }
  .is-even {
    color: green;
  }
</style>

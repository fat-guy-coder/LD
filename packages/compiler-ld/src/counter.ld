<template>
  <div class="counter">
    <h1>Counter: {count}</h1>

    <!-- Attribute Bindings -->
    <p class={classNames} class={classNamesArray} class="classA">
      The current count is {isEven ? 'even' : 'odd'}.
    </p>
    <p style={styleNames} style={styleNamesArray} style="color: red">
      The current count is {isEven ? 'even' : 'odd'}.
    </p>

    <!-- Event Handling -->
    <button onClick={increment}>Increment</button>
    <button onClick={(event) => increment(event, 'hello')}>Increment with Params</button>
    <button onClick.stop={(event) => increment(event, 'hello')}>Increment with Modifier</button>

    <!-- Conditional Rendering -->
    <div if={count === 1}>show (if)</div>
    <div else>hide (else)</div>
    {count === 1 ? <div>show (tsx)</div> : <div>hide (tsx)</div>}
    <div show={count === 1}>show (show)</div>

    <!-- List Rendering -->
    <div for={(item, index) in listData}>item: {item}, index: {index}</div>
    <div for={item of listData}>{item}</div>
    <div for={item in 5}>Loop item {item}</div>

    <!-- Components -->
    <List />
    <MyComponent count={count} />
    <MyComponentWithProps name="test" />
    <AsyncComponent />

    <!-- Slots -->
    <AsyncComponent>
      <slot name="A">Default content for A</slot>
      <slot name="B">Default content for B</slot>
    </AsyncComponent>

    <!-- Using slots passed from a parent -->
    <slotA />
    <slotB>Default value for slot B</slotB>
    <slotC age="10" count={count} />

    <!-- Scoped Slots -->
    <AsyncComponent>
      <slot name="A" slot-props={props}>{props.age}</slot>
      <slot name="B" slot-props={{ age, count }}>{age} + {count}</slot>
    </AsyncComponent>

    <!-- Refs -->
    <AsyncComponent ref="asyncComponentRef" />
  </div>
</template>

<script setup lang="ts">
  // --- Reactivity ---
  signal<number>: count = 0;
  computed<boolean>: isEven = count % 2 === 0;
  S: listData = [1, 2, 3, 4, 5];
  C: classNames = {
    'is-even': isEven,
    'count': !isEven,
  };

  // --- Props & Slots ---
  const props = P<{ name: string }>({ name: 'test' });
  SL: slotA = Slot('A');

  // --- Refs ---
  R: asyncComponentRef = Ref<AsyncComponent>();

  // --- Component Definitions ---
  import MyComponent from "@component/my-component";
  const AsyncComponent = LazyLoad(() => import('@component/my-component'));
  const List = () => listData.map(i => <div>{i}</div>);

  // --- Methods ---
  function increment(event: Event, msg?: string) {
    if (msg) console.log(msg);
    count = count + 1;
  }

  // --- Lifecycle & Effects ---
  onMounted(() => {
    console.log('Component Mounted');
  });

  effect(() => {
    console.log(`The count is now: ${count}`);
  });
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

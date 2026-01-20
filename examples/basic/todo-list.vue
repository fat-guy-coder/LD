<template>
  <div class="todo-app">
    <header class="todo-header">
      <h1>Todo List (Vue)</h1>
      <p class="stats">
        已完成: {{ completedCount }} / {{ totalCount }}
      </p>
    </header>

    <div class="todo-input-section">
      <input
        type="text"
        class="todo-input"
        placeholder="添加新任务..."
        v-model="newTodo"
        @keydown.enter="addTodo"
      />
      <button class="add-button" @click="addTodo">
        添加
      </button>
    </div>

    <ul class="todo-list">
      <li 
        v-for="(todo, index) in todos" 
        :key="todo.id"
        class="todo-item"
        :class="{ completed: todo.completed }"
      >
        <input
          type="checkbox"
          :checked="todo.completed"
          @change="toggleTodo(index)"
        />
        <span class="todo-text">{{ todo.text }}</span>
        <button class="delete-button" @click="removeTodo(index)">
          删除
        </button>
      </li>
    </ul>

    <div class="todo-actions">
      <button @click="clearCompleted">清除已完成</button>
      <button @click="clearAll">清除全部</button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 使用LD框架提供的Vue3兼容API
import { ref, computed, onMounted, watch } from 'ld'

interface Todo {
  text: string
  completed: boolean
  id: number
}

// 状态
const todos = ref<Todo[]>([])
const newTodo = ref('')
let nextId = 0

// 计算属性
const totalCount = computed(() => todos.value.length)
const completedCount = computed(() => 
  todos.value.filter(t => t.completed).length
)

// 方法
function addTodo() {
  if (newTodo.value.trim()) {
    todos.value.push({
      text: newTodo.value.trim(),
      completed: false,
      id: nextId++
    })
    newTodo.value = ''
  }
}

function toggleTodo(index: number) {
  if (todos.value[index]) {
    todos.value[index].completed = !todos.value[index].completed
  }
}

function removeTodo(index: number) {
  todos.value.splice(index, 1)
}

function clearCompleted() {
  todos.value = todos.value.filter(t => !t.completed)
}

function clearAll() {
  todos.value = []
}

// 生命周期和副作用
onMounted(() => {
  const saved = localStorage.getItem('vue-todos')
  if (saved) {
    try {
      todos.value = JSON.parse(saved)
      // 恢复nextId
      if (todos.value.length > 0) {
        nextId = Math.max(...todos.value.map(t => t.id)) + 1
      }
    } catch (e) {
      console.error('Failed to load todos:', e)
    }
  }
})

watch(todos, (newTodos) => {
  localStorage.setItem('vue-todos', JSON.stringify(newTodos))
}, { deep: true })
</script>

<style scoped>
.todo-app {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.todo-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.todo-header h1 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 2rem;
}

.stats {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.todo-input-section {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.todo-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.todo-input:focus {
  outline: none;
  border-color: #4CAF50;
}

.add-button {
  padding: 0.75rem 1.5rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.add-button:hover {
  background: #45a049;
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: #f9f9f9;
  border-radius: 4px;
  transition: background 0.2s;
}

.todo-item:hover {
  background: #f0f0f0;
}

.todo-item.completed {
  opacity: 0.6;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: #999;
}

.todo-text {
  flex: 1;
  font-size: 1rem;
}

.delete-button {
  padding: 0.5rem 1rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.delete-button:hover {
  background: #da190b;
}

.todo-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.todo-actions button {
  padding: 0.5rem 1rem;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.todo-actions button:hover {
  background: #0b7dda;
}
</style>

// 注意：这是示例文件，用于测试 LD 编译器
// 使用LD框架提供的React Hooks兼容API，底层转发到LD Signal实现
import { useState, useEffect, useMemo } from 'ld'
import type { KeyboardEvent, ChangeEvent } from 'ld'
import './todo-list.css'

interface Todo {
  text: string
  completed: boolean
  id: number
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [nextId, setNextId] = useState(0)

  // 计算属性
  const totalCount = useMemo(() => todos.length, [todos])
  const completedCount = useMemo(
    () => todos.filter((t: Todo) => t.completed).length,
    [todos]
  )

  // 加载保存的数据
  useEffect(() => {
    const saved = localStorage.getItem('tsx-todos')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setTodos(parsed)
        if (parsed.length > 0) {
          setNextId(Math.max(...parsed.map((t: Todo) => t.id)) + 1)
        }
      } catch (e) {
        console.error('Failed to load todos:', e)
      }
    }
  }, [])

  // 保存数据
  useEffect(() => {
    localStorage.setItem('tsx-todos', JSON.stringify(todos))
  }, [todos])

  // 添加任务
  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([
        ...todos,
        {
          text: newTodo.trim(),
          completed: false,
          id: nextId
        }
      ])
      setNextId(nextId + 1)
      setNewTodo('')
    }
  }

  // 切换完成状态
  const toggleTodo = (index: number) => {
    setTodos(
      todos.map((todo: Todo, i: number) =>
        i === index ? { ...todo, completed: !todo.completed } : todo
      )
    )
  }

  // 删除任务
  const removeTodo = (index: number) => {
    setTodos(todos.filter((_: Todo, i: number) => i !== index))
  }

  // 清除已完成
  const clearCompleted = () => {
    setTodos(todos.filter((t: Todo) => !t.completed))
  }

  // 清除全部
  const clearAll = () => {
    setTodos([])
  }

  // 处理键盘事件
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addTodo()
    }
  }

  // 处理输入变化
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewTodo(e.target.value)
  }

  return (
    <div className="todo-app">
      <header className="todo-header">
        <h1>Todo List (TSX)</h1>
        <p className="stats">
          已完成: {completedCount} / {totalCount}
        </p>
      </header>

      <div className="todo-input-section">
        <input
          type="text"
          className="todo-input"
          placeholder="添加新任务..."
          value={newTodo}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <button className="add-button" onClick={addTodo}>
          添加
        </button>
      </div>

      <ul className="todo-list">
        {todos.map((todo: Todo, index: number) => (
          <li
            key={todo.id}
            className={`todo-item ${todo.completed ? 'completed' : ''}`}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(index)}
            />
            <span className="todo-text">{todo.text}</span>
            <button
              className="delete-button"
              onClick={() => removeTodo(index)}
            >
              删除
            </button>
          </li>
        ))}
      </ul>

      <div className="todo-actions">
        <button onClick={clearCompleted}>清除已完成</button>
        <button onClick={clearAll}>清除全部</button>
      </div>
    </div>
  )
}

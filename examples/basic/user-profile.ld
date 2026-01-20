<template>
  <div class="profile-card">
    <div class="profile-header">
      <img 
        :src="user.avatar" 
        :alt="user.name"
        class="avatar"
      />
      <h2>{user.name}</h2>
      <p class="email">{user.email}</p>
    </div>

    <div class="profile-body">
      <div class="info-row">
        <span class="label">年龄:</span>
        <span class="value">{user.age} 岁</span>
      </div>
      <div class="info-row">
        <span class="label">城市:</span>
        <span class="value">{user.city}</span>
      </div>
      <div class="info-row">
        <span class="label">职业:</span>
        <span class="value">{user.occupation}</span>
      </div>
    </div>

    <div class="profile-actions">
      <button @click={handleEdit} class="edit-button">
        编辑资料
      </button>
      <button @click={handleLogout} class="logout-button">
        退出登录
      </button>
    </div>

    <div v-if="showEditForm" class="edit-form">
      <h3>编辑资料</h3>
      <input 
        v-model="editForm.name"
        placeholder="姓名"
        class="form-input"
      />
      <input 
        v-model="editForm.email"
        type="email"
        placeholder="邮箱"
        class="form-input"
      />
      <input 
        v-model.number="editForm.age"
        type="number"
        placeholder="年龄"
        class="form-input"
      />
      <div class="form-actions">
        <button @click={saveProfile} class="save-button">保存</button>
        <button @click={cancelEdit} class="cancel-button">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 使用LD框架提供的Vue3兼容API
import { ref, reactive, computed } from 'ld'

// 导出类型定义
export interface User {
  id: number
  name: string
  email: string
  age: number
  city: string
  occupation: string
  avatar: string
}

export type UserStatus = 'active' | 'inactive' | 'pending'

// 导出常量
export const DEFAULT_AVATAR = 'https://via.placeholder.com/150'
export const MIN_AGE = 18
export const MAX_AGE = 100

// 用户状态
const user = reactive<User>({
  id: 1,
  name: '张三',
  email: 'zhangsan@example.com',
  age: 28,
  city: '北京',
  occupation: '前端工程师',
  avatar: DEFAULT_AVATAR
})

// 编辑表单状态
const showEditForm = ref(false)
const editForm = reactive({
  name: '',
  email: '',
  age: 0
})

// 计算属性
const isAdult = computed(() => user.age >= 18)
const displayName = computed(() => 
  user.name || '未设置'
)

// 方法
function handleEdit() {
  editForm.name = user.name
  editForm.email = user.email
  editForm.age = user.age
  showEditForm.value = true
}

function saveProfile() {
  if (editForm.name.trim()) {
    user.name = editForm.name.trim()
  }
  if (editForm.email.trim()) {
    user.email = editForm.email.trim()
  }
  if (editForm.age >= MIN_AGE && editForm.age <= MAX_AGE) {
    user.age = editForm.age
  }
  showEditForm.value = false
  console.log('Profile saved:', user)
}

function cancelEdit() {
  showEditForm.value = false
}

function handleLogout() {
  if (confirm('确定要退出登录吗？')) {
    console.log('User logged out')
    // 这里可以触发退出登录的逻辑
  }
}
</script>

<style scoped>
.profile-card {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  color: white;
}

.profile-header {
  text-align: center;
  margin-bottom: 2rem;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid white;
  margin-bottom: 1rem;
  object-fit: cover;
}

.profile-header h2 {
  margin: 0.5rem 0;
  font-size: 1.75rem;
}

.email {
  margin: 0.25rem 0 0 0;
  opacity: 0.9;
  font-size: 0.9rem;
}

.profile-body {
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  backdrop-filter: blur(10px);
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 600;
  opacity: 0.9;
}

.value {
  opacity: 1;
}

.profile-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.edit-button,
.logout-button {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid white;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-button {
  background: white;
  color: #667eea;
}

.edit-button:hover {
  background: #f0f0f0;
  transform: translateY(-2px);
}

.logout-button {
  background: transparent;
  color: white;
}

.logout-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.edit-form {
  background: rgba(255, 255, 255, 0.95);
  padding: 1.5rem;
  border-radius: 8px;
  color: #333;
}

.edit-form h3 {
  margin: 0 0 1rem 0;
  color: #667eea;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.save-button,
.cancel-button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.save-button {
  background: #4CAF50;
  color: white;
}

.save-button:hover {
  background: #45a049;
}

.cancel-button {
  background: #f44336;
  color: white;
}

.cancel-button:hover {
  background: #da190b;
}
</style>

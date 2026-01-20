<template>
  <div class="chart-container">
    <div class="chart-controls">
      <h2>数据可视化图表</h2>
      <div class="controls">
        <label>
          数据点数:
          <input 
            type="number" 
            :value="pointCount"
            @input={(e) => setPointCount(Number(e.target.value))}
            min="10"
            max="10000"
            class="control-input"
          />
        </label>
        <button @click={generateData} class="generate-button">
          生成新数据
        </button>
        <button @click={clearChart} class="clear-button">
          清除
        </button>
      </div>
    </div>
    <canvas 
      ref={canvasRef}
      class="chart-canvas"
      width="800"
      height="400"
    />
    <div class="chart-info">
      <p>当前显示: {pointCount} 个数据点</p>
      <p>渲染时间: {renderTime}ms</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 使用LD框架提供的Vue3兼容API
import { ref, onMounted, onUnmounted } from 'ld'

// 导出类型
export interface DataPoint {
  x: number
  y: number
  value: number
}

export interface ChartConfig {
  width: number
  height: number
  pointCount: number
  color: string
}

// 导出常量
export const DEFAULT_POINT_COUNT = 1000
export const MAX_POINT_COUNT = 10000

// 状态
const canvasRef = ref<HTMLCanvasElement | null>(null)
const pointCount = ref(DEFAULT_POINT_COUNT)
const renderTime = ref(0)
const dataPoints = ref<DataPoint[]>([])
let animationFrameId: number | null = null

// 生成随机数据
function generateData() {
  const points: DataPoint[] = []
  for (let i = 0; i < pointCount.value; i++) {
    points.push({
      x: Math.random() * 800,
      y: Math.random() * 400,
      value: Math.random() * 100
    })
  }
  dataPoints.value = points
  render()
}

// 设置数据点数
function setPointCount(count: number) {
  if (count >= 10 && count <= MAX_POINT_COUNT) {
    pointCount.value = count
    generateData()
  }
}

// 渲染图表
function render() {
  if (!canvasRef.value) return

  const startTime = performance.now()
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  
  if (!ctx) return

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 绘制网格
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 1
  for (let i = 0; i <= 10; i++) {
    const x = (canvas.width / 10) * i
    const y = (canvas.height / 10) * i
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvas.height)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvas.width, y)
    ctx.stroke()
  }

  // 绘制数据点
  dataPoints.value.forEach(point => {
    const size = Math.sqrt(point.value) * 2
    const alpha = point.value / 100
    
    ctx.beginPath()
    ctx.arc(point.x, point.y, size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(66, 133, 244, ${alpha})`
    ctx.fill()
    
    ctx.strokeStyle = `rgba(66, 133, 244, ${alpha * 0.5})`
    ctx.lineWidth = 1
    ctx.stroke()
  })

  // 绘制统计信息
  ctx.fillStyle = '#333'
  ctx.font = '14px Arial'
  ctx.fillText(`数据点: ${dataPoints.value.length}`, 10, 20)
  
  const endTime = performance.now()
  renderTime.value = Math.round(endTime - startTime)
}

// 清除图表
function clearChart() {
  if (!canvasRef.value) return
  const ctx = canvasRef.value.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  }
  dataPoints.value = []
  renderTime.value = 0
}

// 动画循环
function animate() {
  if (dataPoints.value.length > 0) {
    // 轻微动画效果：让数据点轻微移动
    dataPoints.value.forEach(point => {
      point.x += (Math.random() - 0.5) * 0.5
      point.y += (Math.random() - 0.5) * 0.5
      point.x = Math.max(0, Math.min(800, point.x))
      point.y = Math.max(0, Math.min(400, point.y))
    })
    render()
  }
  animationFrameId = requestAnimationFrame(animate)
}

// 生命周期
onMounted(() => {
  generateData()
  animate()
})

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<style scoped>
.chart-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.chart-controls {
  margin-bottom: 1.5rem;
}

.chart-controls h2 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.5rem;
}

.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.controls label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #666;
}

.control-input {
  padding: 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  font-size: 1rem;
  width: 120px;
}

.control-input:focus {
  outline: none;
  border-color: #4285f4;
}

.generate-button,
.clear-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.generate-button {
  background: #4285f4;
  color: white;
}

.generate-button:hover {
  background: #357ae8;
  transform: translateY(-1px);
}

.clear-button {
  background: #f44336;
  color: white;
}

.clear-button:hover {
  background: #da190b;
  transform: translateY(-1px);
}

.chart-canvas {
  width: 100%;
  height: auto;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  display: block;
  background: #fafafa;
}

.chart-info {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 4px;
  display: flex;
  gap: 2rem;
  font-size: 0.9rem;
  color: #666;
}

.chart-info p {
  margin: 0;
}
</style>

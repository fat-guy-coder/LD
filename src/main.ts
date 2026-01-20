// ==================================================================================================
// DOM 元素获取
// ==================================================================================================

const menuItems = document.querySelectorAll('.menu-item')
const views = document.querySelectorAll('.view')
const dataStatsTabs = document.querySelectorAll('#view-data-stats .tab-button')
const dataStatsPanes = document.querySelectorAll('#view-data-stats .tab-pane')

// ==================================================================================================
// 主视图切换逻辑
// ==================================================================================================

menuItems.forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault()
    menuItems.forEach(i => i.classList.remove('active'))
    item.classList.add('active')
    const viewName = (item as HTMLElement).dataset.view
    views.forEach(v => v.classList.remove('active'))
    const targetView = document.getElementById(`view-${viewName}`)
    if (targetView) {
      targetView.classList.add('active')
    }
  })
})

// ==================================================================================================
// “数据统计” 视图的 Tab 切换逻辑
// ==================================================================================================

dataStatsTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    dataStatsTabs.forEach(t => t.classList.remove('active'))
    tab.classList.add('active')
    const tabName = (tab as HTMLElement).dataset.tab
    dataStatsPanes.forEach(p => p.classList.remove('active'))
    const targetPane = document.getElementById(`tab-${tabName}`)
    if (targetPane) {
      targetPane.classList.add('active')
    }
  })
})

// ==================================================================================================
// 开发控制台日志渲染
// ==================================================================================================

const logContainer = document.getElementById('log-container') as HTMLDivElement | null
const clearLogBtn = document.getElementById('clear-log-btn') as HTMLButtonElement | null

function appendLog(type: 'log' | 'info' | 'warn' | 'error', args: unknown[]): void {
  if (!logContainer) return
  const entry = document.createElement('div')
  entry.className = `log-entry log-${type}`
  entry.textContent = args
    .map(a => {
      try {
        return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
      } catch {
        return String(a)
      }
    })
    .join(' ')
  logContainer.appendChild(entry)
  logContainer.scrollTop = logContainer.scrollHeight
}

if (clearLogBtn) {
  clearLogBtn.addEventListener('click', () => {
    if (logContainer) logContainer.innerHTML = ''
  })
}

;(function interceptConsole() {
  const rawLog = console.log
  const rawInfo = console.info
  const rawWarn = console.warn
  const rawError = console.error
  const rawClear = console.clear

  console.log = (...args: unknown[]) => {
    rawLog.apply(console, args as [])
    appendLog('log', args)
  }
  console.info = (...args: unknown[]) => {
    rawInfo.apply(console, args as [])
    appendLog('info', args)
  }
  console.warn = (...args: unknown[]) => {
    rawWarn.apply(console, args as [])
    appendLog('warn', args)
  }
  console.error = (...args: unknown[]) => {
    rawError.apply(console, args as [])
    appendLog('error', args)
  }
  console.clear = () => {
    rawClear.apply(console)
    if (logContainer) logContainer.innerHTML = ''
  }
})()

// ==================================================================================================
// 模块监听与执行逻辑 (移植自 dev-console.ts)
// ==================================================================================================

interface ModuleInfo {
  name: string
  path: string
}

class DevConsole {
  private modules: ModuleInfo[] = []
  private selectedModules: Set<string> = new Set()
  private watchAll: boolean = false
  private executedModules: Map<string, string> = new Map()

  async init(): Promise<void> {
    await this.loadModules()
    this.renderModuleList()
    this.setupEventListeners()
    this.startWatching()
  }

  private async loadModules(): Promise<void> {
    try {
      const response = await fetch('/api/packages')
      this.modules = (await response.json()) as ModuleInfo[]
    } catch (error) {
      console.error('加载模块列表失败:', error)
      this.updateStatus('加载模块列表失败')
    }
  }

  private renderModuleList(): void {
    const list = document.getElementById('moduleList') as HTMLDivElement | null
    if (!list) return
    list.innerHTML = ''
    this.modules.forEach(module => {
      const item = document.createElement('div')
      item.className = 'module-item'
      if (this.selectedModules.has(module.name)) {
        item.classList.add('active')
      }
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.checked = this.selectedModules.has(module.name)
      checkbox.onchange = () => this.toggleModule(module.name)
      const label = document.createElement('label')
      label.textContent = module.name
      label.style.cursor = 'pointer'
      label.style.flex = '1'
      label.onclick = () => checkbox.click()
      item.appendChild(checkbox)
      item.appendChild(label)
      list.appendChild(item)
    })
  }

  private setupEventListeners(): void {
    const allCheckbox = document.getElementById('allCheckbox') as HTMLInputElement | null
    if (allCheckbox) {
      allCheckbox.onchange = () => {
        this.watchAll = allCheckbox.checked
        this.selectedModules.clear()
        if (this.watchAll) {
          this.modules.forEach(m => this.selectedModules.add(m.name))
        }
        this.executedModules.clear()
        this.renderModuleList()
        this.updateCurrentModules()
        void this.executeSelectedModules(true)
      }
    }
  }

  private toggleModule(moduleName: string): void {
    if (this.selectedModules.has(moduleName)) {
      this.selectedModules.delete(moduleName)
    } else {
      this.selectedModules.add(moduleName)
    }
    const allCheckbox = document.getElementById('allCheckbox') as HTMLInputElement | null
    if (allCheckbox) {
      allCheckbox.checked = this.selectedModules.size === this.modules.length
    }
    this.renderModuleList()
    this.updateCurrentModules()
    void this.executeSelectedModules(true)
  }

  private async executeSelectedModules(clearConsole: boolean): Promise<void> {
    if (this.selectedModules.size === 0) {
      console.clear()
      return
    }
    const modulesToExecute = this.modules.filter(m => this.selectedModules.has(m.name))
    if (clearConsole) {
      console.clear()
    }
    console.info(
      `执行 ${modulesToExecute.length} 个模块: ${modulesToExecute.map(m => m.name).join(', ')}`
    )
    for (const module of modulesToExecute) {
      await this.executeModule(module, true)
    }
  }

  private updateCurrentModules(): void {
    // This element is no longer in the new UI, we can log to status bar instead.
  }

  private startWatching(): void {
    setInterval(() => {
      void this.checkAndExecute()
    }, 1000)
  }

  private async checkAndExecute(): Promise<void> {
    if (this.selectedModules.size === 0) return
    const modulesToCheck = this.modules.filter(m => this.selectedModules.has(m.name))
    let hasChanges = false
    for (const module of modulesToCheck) {
      try {
        const response = await fetch(`/api/package/${encodeURIComponent(module.name)}`)
        const data = (await response.json()) as { code: string }
        const codeHash = this.hashCode(data.code)
        if (this.executedModules.get(module.name) !== codeHash) {
          hasChanges = true
          break
        }
      } catch {}
    }
    if (hasChanges) {
      void this.executeSelectedModules(true)
    }
  }

  private async executeModule(module: ModuleInfo, force: boolean): Promise<void> {
    try {
      const response = await fetch(`/api/package/${encodeURIComponent(module.name)}`)
      const data = (await response.json()) as { code: string }
      const codeHash = this.hashCode(data.code)
      if (!force && this.executedModules.get(module.name) === codeHash) return
      await this.runCode(data.code, module.name)
      this.executedModules.set(module.name, codeHash)
    } catch (error) {
      console.error(`执行模块 ${module.name} 失败:`, error)
    }
  }

  private async runCode(code: string, moduleName: string): Promise<void> {
    try {
      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, moduleName }),
      })
      const result = (await response.json()) as { code?: string; error?: string }
      if (result.error) {
        console.error(`[${moduleName}] 转换失败:`, result.error)
        return
      }
      console.info(`\n[${moduleName}] 执行代码...`)
      new Function(result.code ?? '')()
    } catch (error) {
      console.error(`[${moduleName}] 运行失败:`, error)
    }
  }

  private hashCode(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i)
      hash |= 0 // Convert to 32bit integer
    }
    return hash.toString()
  }

  private updateStatus(text: string): void {
    const statusText = document.getElementById('statusText')
    if (statusText) {
      statusText.textContent = text
    }
  }
}

// ==================================================================================================
// 数据加载与图表渲染
// ==================================================================================================

import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  type ChartConfiguration,
} from 'chart.js'

// 仅注册本页面需要用到的组件，避免引入不必要的图表能力
Chart.register(CategoryScale, LinearScale, BarController, BarElement, Title, Tooltip, Legend)

type JsonValue = null | boolean | number | string | JsonValue[] | { [k: string]: JsonValue }

function ensureEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id)
  if (!el) {
    throw new Error(`找不到元素: #${id}`)
  }
  return el as T
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

async function fetchJson<T = JsonValue>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`请求失败: ${url} (${res.status})`)
  }
  return (await res.json()) as T
}

function renderSimpleTable(container: HTMLElement, headers: string[], rows: (string | number)[][]): void {
  const headHtml = headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')
  const bodyHtml = rows
    .map(r => `<tr>${r.map(c => `<td>${escapeHtml(String(c))}</td>`).join('')}</tr>`)
    .join('')

  container.innerHTML = `
    <table>
      <thead>
        <tr>${headHtml}</tr>
      </thead>
      <tbody>
        ${bodyHtml}
      </tbody>
    </table>
  `
}

function setChart(el: HTMLElement, config: ChartConfiguration<'bar', number[], string>): void {
  const anyEl = el as HTMLElement & { __ldChart?: Chart<'bar', number[], string> }
  if (anyEl.__ldChart) {
    anyEl.__ldChart.destroy()
  }

  const canvas = document.createElement('canvas')
  el.innerHTML = ''
  el.appendChild(canvas)

  const chart = new Chart(canvas, config)
  anyEl.__ldChart = chart
}

// ------------------------------------
// 1) 框架对比：statistics/frameworks-data.json
// ------------------------------------

type FrameworksDataJson = {
  frameworks: Record<
    string,
    {
      name: string
      bundle_size_kb?: number
      execution_speed_rating?: number
      memory_usage_mb?: number
      performance_score?: number
      fcp_ms?: number
      lcp_ms?: number
      inp_ms?: number | null
      reactivity?: {
        signal_creation_ops_sec?: number
        signal_update_ops_sec?: number
      }
      ux_metrics?: {
        tbt_ms?: number
        hydration_overhead_ms?: number
      }
    }
  >
}

async function loadFrameworkComparisonData(): Promise<void> {
  console.info('[Data] 加载框架对比数据...')
  const chartEl = ensureEl<HTMLDivElement>('framework-chart')
  const tableEl = ensureEl<HTMLDivElement>('framework-table')

  const data = await fetchJson<FrameworksDataJson>('/statistics/frameworks-data.json')
  const list = Object.values(data.frameworks)

  // 表格
  renderSimpleTable(
    tableEl,
    [
      '框架',
      '包体积(KB)',
      '速度评分',
      '内存(MB)',
      'FCP(ms)',
      'LCP(ms)',
      'INP(ms)',
      'Signal Create(ops/s)',
      'Signal Update(ops/s)',
      'TBT(ms)',
      'Hydration(ms)',
    ],
    list.map(f => [
      f.name,
      f.bundle_size_kb ?? '-',
      f.execution_speed_rating ?? '-',
      f.memory_usage_mb ?? '-',
      f.fcp_ms ?? '-',
      f.lcp_ms ?? '-',
      f.inp_ms ?? '-',
      f.reactivity?.signal_creation_ops_sec ?? '-',
      f.reactivity?.signal_update_ops_sec ?? '-',
      f.ux_metrics?.tbt_ms ?? '-',
      f.ux_metrics?.hydration_overhead_ms ?? '-',
    ])
  )

  // 图表（多维度性能指标，所有指标越高越好）
  const names = list.map(f => f.name)

  // 对于“越低越好”的指标，计算其倒数作为分数，0值处理为0分
  const invert = (val: number | null | undefined) => (val ? 1 / val : 0)
  // 对于“越高越好”的指标，直接使用其值，0值处理为0分
  const direct = (val: number | null | undefined) => val ?? 0

  // 为了让不同数量级的倒数能在一起比较，进行归一化处理 (0-100分)
  const normalize = (scores: number[]): number[] => {
    const max = Math.max(...scores)
    if (max === 0) return scores.map(() => 0)
    return scores.map(s => (s / max) * 100)
  }

  // 基础性能指标
  const bundleScores = list.map(f => invert(f.bundle_size_kb))
  const memoryScores = list.map(f => invert(f.memory_usage_mb))
  const fcpScores = list.map(f => invert(f.fcp_ms))
  const lcpScores = list.map(f => invert(f.lcp_ms))
  const inpScores = list.map(f => invert(f.inp_ms))
  const speedScores = list.map(f => direct(f.execution_speed_rating))

  // Reactivity 指标
  const signalCreateScores = list.map(f => direct(f.reactivity?.signal_creation_ops_sec))
  const signalUpdateScores = list.map(f => direct(f.reactivity?.signal_update_ops_sec))

  // UX 指标
  const tbtScores = list.map(f => invert(f.ux_metrics?.tbt_ms))
  const hydrationScores = list.map(f => invert(f.ux_metrics?.hydration_overhead_ms))

  setChart(chartEl, {
    type: 'bar',
    data: {
      labels: names,
      datasets: [
        {
          label: '包体积 (反转)',
          data: normalize(bundleScores),
          backgroundColor: 'rgba(0, 122, 204, 0.7)',
        },
        {
          label: '内存占用 (反转)',
          data: normalize(memoryScores),
          backgroundColor: 'rgba(106, 153, 85, 0.7)',
        },
        {
          label: '速度评分',
          data: speedScores.map(s => s * 20), // 速度评分是1-5，乘以20以匹配0-100的范围
          backgroundColor: 'rgba(180, 180, 180, 0.7)',
        },
        {
          label: 'FCP (反转)',
          data: normalize(fcpScores),
          backgroundColor: 'rgba(220, 220, 170, 0.7)',
        },
        {
          label: 'LCP (反转)',
          data: normalize(lcpScores),
          backgroundColor: 'rgba(206, 147, 216, 0.7)',
        },
        {
          label: 'INP (反转)',
          data: normalize(inpScores),
          backgroundColor: 'rgba(244, 71, 71, 0.7)',
        },
        {
          label: 'Signal Create (ops/s)',
          data: normalize(signalCreateScores),
          backgroundColor: 'rgba(255, 159, 64, 0.7)',
        },
        {
          label: 'Signal Update (ops/s)',
          data: normalize(signalUpdateScores),
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
        },
        {
          label: 'TBT (反转)',
          data: normalize(tbtScores),
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
        },
        {
          label: 'Hydration (反转)',
          data: normalize(hydrationScores),
          backgroundColor: 'rgba(153, 102, 255, 0.7)',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        x: { ticks: { maxRotation: 30, minRotation: 30 } },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: '归一化性能分 (越高越好)',
          },
          min: 0,
          max: 100,
        },
      },
    },
  })
}

// ------------------------------------
// 2) 包体积：statistics/size-analysis.json
// ------------------------------------

type SizeAnalysisJson = {
  createdAt: string
  results: Array<{
    package: string
    totalRaw: number
    totalGzip: number
    totalBrotli: number
  }>
}

async function loadBundleSizeData(): Promise<void> {
  console.info('[Data] 加载模块包体积数据...')
  const chartEl = ensureEl<HTMLDivElement>('bundle-chart')
  const tableEl = ensureEl<HTMLDivElement>('bundle-table')

  const data = await fetchJson<SizeAnalysisJson>('/statistics/size-analysis.json')
  const list = data.results

  renderSimpleTable(
    tableEl,
    ['包名', 'Raw(bytes)', 'Gzip(bytes)', 'Brotli(bytes)'],
    list.map(r => [r.package, r.totalRaw, r.totalGzip, r.totalBrotli])
  )

  setChart(chartEl, {
    type: 'bar',
    data: {
      labels: list.map(r => r.package),
      datasets: [
        {
          label: 'Gzip(bytes)',
          data: list.map(r => r.totalGzip),
          backgroundColor: '#6a9955',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        title: { display: false, text: '' },
      },
      scales: {
        x: { ticks: { maxRotation: 0, minRotation: 0 } },
        y: { beginAtZero: true },
      },
    },
  })
}

// ------------------------------------
// 3) 模块 Benchmark：本期不展示 tinybench.json（按你的要求排除）
// ------------------------------------

async function loadModuleBenchmarksData(): Promise<void> {
  console.info('[Data] 模块Benchmark：已按要求排除 tinybench.json，本 Tab 暂不展示数据。')
  const subTabs = document.getElementById('benchmark-sub-tabs')
  const content = document.getElementById('benchmark-content')
  if (subTabs) subTabs.innerHTML = ''
  if (content) {
    content.innerHTML = `<div class="empty-hint">tinybench.json 已排除；如需展示其他 benchmark 数据，请新增对应 JSON。</div>`
  }
}

// ------------------------------------
// 4) 模块内存：statistics/memory-analysis.json
// ------------------------------------

type MemoryAnalysisJson = {
  createdAt: string
  results: Array<{
    file: string
    scenario: string
    heapUsedBytes: number
    count: number
    bytesPerItem: number
  }>
}

import { createSignal, createEffect } from '@ld/reactivity'

async function loadModuleMemoryData(): Promise<void> {
  console.info('[Data] 加载模块内存数据...')

  const runBtn = document.getElementById('run-memory-test-btn') as HTMLButtonElement | null
  const container = document.getElementById('memory-test-container') as HTMLDivElement | null
  const resultsEl = document.getElementById('memory-test-results') as HTMLDivElement | null

  if (!runBtn || !container) {
    console.error('找不到内存测试相关 DOM 元素。')
    return
  }

  // 先展示 memory-analysis.json 的结果
  try {
    const data = await fetchJson<MemoryAnalysisJson>('/statistics/memory-analysis.json')
    if (resultsEl) {
      renderSimpleTable(
        resultsEl,
        ['文件', '场景', 'heapUsedBytes', 'count', 'bytesPerItem'],
        data.results.map(r => [r.file, r.scenario, r.heapUsedBytes, r.count, r.bytesPerItem])
      )
    }
  } catch (e) {
    console.error('[Data] 加载 memory-analysis.json 失败:', e)
  }

  // 内存测试 demo（用于 puppeteer 触发/人工点击）
  const createRows = () => {
    container.innerHTML = ''

    const rows: HTMLDivElement[] = []
    for (let i = 0; i < 1000; i++) {
      const rowSignal = createSignal({ id: i, text: `Row #${i}` })

      const el = document.createElement('div')
      el.className = 'memory-test-row'

      createEffect(() => {
        const v = rowSignal()
        el.textContent = `ID: ${v.id}, Text: ${v.text}`
      })

      rows.push(el)
    }

    container.append(...rows)
    console.log('[Memory Test] 1,000 reactive rows created.')
  }

  // 仅在首次加载时绑定事件，避免重复绑定
  const btnAny = runBtn as HTMLButtonElement & { __handlerAttached?: boolean }
  if (!btnAny.__handlerAttached) {
    runBtn.addEventListener('click', createRows)
    btnAny.__handlerAttached = true
  }

  // 暴露给 Puppeteer
  ;(window as unknown as { runMemoryTest?: () => void }).runMemoryTest = createRows
}

// ==================================================================================================
// 初始化
// ==================================================================================================

document.addEventListener('DOMContentLoaded', () => {
  // PoC: AOT .vue direct DOM update verification
  const runBtn = document.getElementById('btn-run-aot-poc') as HTMLButtonElement | null
  const mountEl = document.getElementById('aot-poc-mount') as HTMLDivElement | null
  if (runBtn && mountEl) {
    const btnAny = runBtn as HTMLButtonElement & { __ldAttached?: boolean }
    if (!btnAny.__ldAttached) {
      runBtn.addEventListener('click', async () => {
        mountEl.innerHTML = ''
        try {
          const mod = (await import('./poc-aot-button.vue')) as unknown as { mount?: (el: HTMLElement) => void }
          if (typeof mod.mount !== 'function') {
            console.error('[AOT PoC] 未找到导出的 mount(el) 函数；说明 PoC transform 可能未命中。')
            mountEl.textContent = 'PoC 未命中：未找到 mount(el) 导出。'
            return
          }
          mod.mount(mountEl)
          console.info('[AOT PoC] mount 已执行。点击按钮应直接更新文本节点（不走通用 reactivity 链路）。')
        } catch (e) {
          console.error('[AOT PoC] 加载/执行失败:', e)
          mountEl.textContent = 'PoC 运行失败，查看控制台日志。'
        }
      })
      btnAny.__ldAttached = true
    }
  }

  // 初始化开发控制台
  const devConsole = new DevConsole()
  void devConsole.init()

  // 默认加载第一个 tab 的数据
  void loadFrameworkComparisonData()

  // 为 tab 切换绑定数据加载事件
  dataStatsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = (tab as HTMLElement).dataset.tab
      if (tabName === 'framework-comparison') {
        void loadFrameworkComparisonData()
      } else if (tabName === 'bundle-size') {
        void loadBundleSizeData()
      } else if (tabName === 'module-benchmarks') {
        void loadModuleBenchmarksData()
      } else if (tabName === 'module-memory') {
        void loadModuleMemoryData()
      }
    })
  })
})

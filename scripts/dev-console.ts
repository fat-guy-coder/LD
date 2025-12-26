/**
 * LD 开发控制台
 * @description 监听并执行包的 index.ts 文件，console.log 输出到浏览器控制台
 */

interface ModuleInfo {
  name: string
  path: string
}

class DevConsole {
  private modules: ModuleInfo[] = []
  private selectedModules: Set<string> = new Set()
  private watchAll: boolean = false
  
  private executedModules: Map<string, string> = new Map() // 存储已执行的代码哈希

  async init(): Promise<void> {
    await this.loadModules()
    this.renderModuleList()
    this.setupEventListeners()
    this.startWatching()
  }

  /**
   * 加载所有模块列表
   */
  private async loadModules(): Promise<void> {
    try {
      const response = await fetch('/api/packages')
      this.modules = await response.json() as ModuleInfo[]  
    } catch (error) {
      console.error('加载模块列表失败:', error)
      this.updateStatus('加载模块列表失败')
    }
  }

  /**
   * 渲染模块列表
   */
  private renderModuleList(): void {
    const list = document.getElementById('moduleList') as HTMLDivElement
    if (!list) return

    list.innerHTML = ''

    this.modules.forEach(module => {
      const item = document.createElement('div') as HTMLDivElement
      item.className = 'module-item'
      if (this.selectedModules.has(module.name)) {
        item.classList.add('active')
      }

      const checkbox = document.createElement('input') as HTMLInputElement
      checkbox.type = 'checkbox'
      checkbox.checked = this.selectedModules.has(module.name)
      checkbox.onchange = () => this.toggleModule(module.name)

      const label = document.createElement('label') as HTMLLabelElement
      label.textContent = module.name
      label.style.cursor = 'pointer'
      label.style.flex = '1'
      label.onclick = () => checkbox.click()

      item.appendChild(checkbox)
      item.appendChild(label)
      list.appendChild(item)
    })
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    const allCheckbox = document.getElementById('allCheckbox') as HTMLInputElement | null
    if (allCheckbox) {
      allCheckbox.onchange = () => {
        this.watchAll = allCheckbox.checked
        if (this.watchAll) {
          // 清除所有执行记录，确保立即执行
          this.executedModules.clear()
          this.selectedModules.clear()
          this.modules.forEach(m => {
            this.selectedModules.add(m.name)
          })
        } else {
          // 取消全选时，清除所有执行记录和控制台
          this.executedModules.clear()
          this.selectedModules.clear()
          console.clear()
        }
        this.renderModuleList()
        this.updateCurrentModules()

        // 如果选中了模块，立即执行所有选中的模块
        if (this.selectedModules.size > 0) {
          this.executeSelectedModules()
        }
      }
    }
  }

  /**
   * 切换模块选择
   */
  private toggleModule(moduleName: string): void {
    const wasSelected = this.selectedModules.has(moduleName)
    
    if (wasSelected) {
      this.selectedModules.delete(moduleName)
      // 取消选中时，清除该模块的执行记录
      this.executedModules.delete(moduleName)
      
      // 如果取消后没有选择任何模块，清除控制台
      if (this.selectedModules.size === 0) {
        console.clear()
      }
    } else {
      this.selectedModules.add(moduleName)
      // 选中时，清除该模块的执行记录，确保立即执行
      this.executedModules.delete(moduleName)
    }

    const allCheckbox = document.getElementById('allCheckbox') as HTMLInputElement | null
    if (allCheckbox) {
      allCheckbox.checked = this.selectedModules.size === this.modules.length
    }

    this.renderModuleList()
    this.updateCurrentModules()

    // 如果选中了模块，立即执行所有选中的模块（按顺序）
    if (this.selectedModules.size > 0) {
      this.executeSelectedModules()
    }
  }

  /**
   * 执行所有选中的模块（按顺序）
   */
  private async executeSelectedModules(): Promise<void> {
    if (this.selectedModules.size === 0) {
      // 没有选择模块时，不显示任何内容
      return
    }

    const modulesToExecute = this.modules
      .filter(m => this.selectedModules.has(m.name))
      .sort((a, b) => {
        const indexA = this.modules.findIndex(m => m.name === a.name)
        const indexB = this.modules.findIndex(m => m.name === b.name)
        return indexA - indexB
      })

    // 清除控制台，显示所有选中模块的输出
    console.clear()
    console.log('='.repeat(50))
    console.log(`执行 ${modulesToExecute.length} 个模块: ${modulesToExecute.map(m => m.name).join(', ')}`)
    console.log('='.repeat(50))

    // 按顺序执行所有模块
    for (const module of modulesToExecute) {
      await this.executeModule(module, true)
    }
  }

  /**
   * 更新当前监听模块显示
   */
  private updateCurrentModules(): void {
    const currentModulesEl = document.getElementById('currentModules') as HTMLSpanElement | null
    if (currentModulesEl) {
      if (this.selectedModules.size === 0) {
        currentModulesEl.textContent = '无'
      } else if (this.selectedModules.size === this.modules.length) {
        currentModulesEl.textContent = '全部'
      } else {
        currentModulesEl.textContent = Array.from(this.selectedModules).join(', ')
      }
    }
  }

  /**
   * 开始监听
   */
  private startWatching(): void {
    // 每 1 秒检查一次文件变化
    window.setInterval(() => {
      this.checkAndExecute()
    }, 1000)
  }

  /**
   * 检查并执行代码
   */
  private async checkAndExecute(): Promise<void> {
    if (this.selectedModules.size === 0) {
      // 没有选择模块时，不执行任何操作
      return
    }

    const modulesToCheck = this.watchAll || this.selectedModules.size === this.modules.length
      ? this.modules
      : this.modules.filter(m => this.selectedModules.has(m.name))

    // 按模块在列表中的顺序执行
    const modulesToExecute = modulesToCheck.sort((a, b) => {
      const indexA = this.modules.findIndex(m => m.name === a.name)
      const indexB = this.modules.findIndex(m => m.name === b.name)
      return indexA - indexB
    })

    // 检查是否有任何模块的代码发生了变化
    let hasChanges = false
    for (const module of modulesToExecute) {
      try {
        const response = await fetch(`/api/package/${encodeURIComponent(module.name)}`)
        const data = await response.json()
        const codeHash = this.hashCode(data.code)
        const currentHash = this.executedModules.get(module.name)
        if (currentHash !== codeHash) {
          hasChanges = true
          break
        }
      } catch {
        // 忽略错误，继续检查
      }
    }

    // 如果有变化，清除控制台
    if (hasChanges) {
      console.clear()
    }

    // 按顺序执行所有模块
    for (const module of modulesToExecute) {
      await this.executeModule(module, false)
    }
  }

  /**
   * 执行模块代码
   */
  private async executeModule(module: ModuleInfo, forceExecute: boolean = false): Promise<void> {
    try {
      // 获取代码
      const response = await fetch(`/api/package/${encodeURIComponent(module.name)}`)
      const data = await response.json()

      // 检查主文件是否有变化
      const codeHash = this.hashCode(data.code)
      const currentHash = this.executedModules.get(module.name)
      
      // 如果强制执行或代码有变化，才执行
      if (!forceExecute && currentHash === codeHash) {
        return // 代码未变化，跳过
      }

      // 执行代码（会自动收集依赖）
      await this.runCode(data.code, module.name)
      
      // 更新哈希
      this.executedModules.set(module.name, codeHash)
    } catch (error) {
      console.error(`执行模块 ${module.name} 失败:`, error)
    }
  }

  /**
   * 运行代码（将 TS 转成 JS 后执行）
   */
  private async runCode(code: string, moduleName: string): Promise<void> {
    try {
      // 使用 Vite 的转换 API 将 TS 转成 JS
      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          moduleName,
        }),
      })

      const result = await response.json()

      if (result.error) {
        console.error(`[${moduleName}] 转换失败:`, result.error)
        return
      }

      // 转换后的代码已经包含了所有依赖，直接执行
      const executableCode = result.code

      // 在全局作用域中执行代码
      try {
        // 显示模块执行提示（不清除控制台，让多个模块的输出一起显示）
        console.log(`\n[${moduleName}] 执行代码（包含依赖）...`)
        
        // 执行模块系统代码
        const func = new Function(executableCode)
        func()
      } catch (e) {
        console.error(`[${moduleName}] 执行错误:`, e)
        console.error('错误详情:', e)
      }
    } catch (error) {
      console.error(`[${moduleName}] 运行失败:`, error)
    }
  }


  /**
   * 简单的字符串哈希函数
   */
  private hashCode(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString()
  }

  /**
   * 更新状态文本
   */
  private updateStatus(text: string): void {
    const statusText = document.getElementById('statusText')
    if (statusText) {
      statusText.textContent = text
    }
  }
}

// 初始化开发控制台
const devConsole = new DevConsole()
devConsole.init()

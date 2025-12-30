// ==================================================================================================
// DOM 元素获取
// ==================================================================================================

const menuItems = document.querySelectorAll('.menu-item');
const views = document.querySelectorAll('.view');
const dataStatsTabs = document.querySelectorAll('#view-data-stats .tab-button');
const dataStatsPanes = document.querySelectorAll('#view-data-stats .tab-pane');

// ==================================================================================================
// 主视图切换逻辑
// ==================================================================================================

menuItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    menuItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    const viewName = (item as HTMLElement).dataset.view;
    views.forEach(v => v.classList.remove('active'));
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
      targetView.classList.add('active');
    }
  });
});

// ==================================================================================================
// “数据统计” 视图的 Tab 切换逻辑
// ==================================================================================================

dataStatsTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    dataStatsTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const tabName = (tab as HTMLElement).dataset.tab;
    dataStatsPanes.forEach(p => p.classList.remove('active'));
    const targetPane = document.getElementById(`tab-${tabName}`);
    if (targetPane) {
      targetPane.classList.add('active');
    }
  });
});

// ==================================================================================================
// 开发控制台日志渲染
// ==================================================================================================

const logContainer = document.getElementById('log-container') as HTMLDivElement | null;
const clearLogBtn = document.getElementById('clear-log-btn') as HTMLButtonElement | null;

function appendLog(type: 'log' | 'info' | 'warn' | 'error', args: unknown[]): void {
  if (!logContainer) return;
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.textContent = args.map(a => {
    try {
      return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a);
    } catch {
      return String(a);
    }
  }).join(' ');
  logContainer.appendChild(entry);
  logContainer.scrollTop = logContainer.scrollHeight;
}

if (clearLogBtn) {
  clearLogBtn.addEventListener('click', () => {
    if (logContainer) logContainer.innerHTML = '';
  });
}

(function interceptConsole() {
  const rawLog = console.log;
  const rawInfo = console.info;
  const rawWarn = console.warn;
  const rawError = console.error;
  const rawClear = console.clear;

  console.log = (...args: unknown[]) => { rawLog.apply(console, args as []); appendLog('log', args); };
  console.info = (...args: unknown[]) => { rawInfo.apply(console, args as []); appendLog('info', args); };
  console.warn = (...args: unknown[]) => { rawWarn.apply(console, args as []); appendLog('warn', args); };
  console.error = (...args: unknown[]) => { rawError.apply(console, args as []); appendLog('error', args); };
  console.clear = () => { 
    rawClear.apply(console);
    if (logContainer) logContainer.innerHTML = '';
  };
})();

// ==================================================================================================
// 模块监听与执行逻辑 (移植自 dev-console.ts)
// ==================================================================================================

interface ModuleInfo {
  name: string;
  path: string;
}

class DevConsole {
  private modules: ModuleInfo[] = [];
  private selectedModules: Set<string> = new Set();
  private watchAll: boolean = false;
  private executedModules: Map<string, string> = new Map();

  async init(): Promise<void> {
    await this.loadModules();
    this.renderModuleList();
    this.setupEventListeners();
    this.startWatching();
  }

  private async loadModules(): Promise<void> {
    try {
      const response = await fetch('/api/packages');
      this.modules = await response.json() as ModuleInfo[];
    } catch (error) {
      console.error('加载模块列表失败:', error);
      this.updateStatus('加载模块列表失败');
    }
  }

  private renderModuleList(): void {
    const list = document.getElementById('moduleList') as HTMLDivElement | null;
    if (!list) return;
    list.innerHTML = '';
    this.modules.forEach(module => {
      const item = document.createElement('div');
      item.className = 'module-item';
      if (this.selectedModules.has(module.name)) {
        item.classList.add('active');
      }
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = this.selectedModules.has(module.name);
      checkbox.onchange = () => this.toggleModule(module.name);
      const label = document.createElement('label');
      label.textContent = module.name;
      label.style.cursor = 'pointer';
      label.style.flex = '1';
      label.onclick = () => checkbox.click();
      item.appendChild(checkbox);
      item.appendChild(label);
      list.appendChild(item);
    });
  }

  private setupEventListeners(): void {
    const allCheckbox = document.getElementById('allCheckbox') as HTMLInputElement | null;
    if (allCheckbox) {
      allCheckbox.onchange = () => {
        this.watchAll = allCheckbox.checked;
        this.selectedModules.clear();
        if (this.watchAll) {
          this.modules.forEach(m => this.selectedModules.add(m.name));
        }
        this.executedModules.clear();
        this.renderModuleList();
        this.updateCurrentModules();
        this.executeSelectedModules(true);
      };
    }
  }

  private toggleModule(moduleName: string): void {
    if (this.selectedModules.has(moduleName)) {
      this.selectedModules.delete(moduleName);
    } else {
      this.selectedModules.add(moduleName);
    }
    const allCheckbox = document.getElementById('allCheckbox') as HTMLInputElement | null;
    if (allCheckbox) {
      allCheckbox.checked = this.selectedModules.size === this.modules.length;
    }
    this.renderModuleList();
    this.updateCurrentModules();
    this.executeSelectedModules(true);
  }

  private async executeSelectedModules(clearConsole: boolean): Promise<void> {
    if (this.selectedModules.size === 0) {
      console.clear();
      return;
    }
    const modulesToExecute = this.modules.filter(m => this.selectedModules.has(m.name));
    if (clearConsole) {
      console.clear();
    }
    console.info(`执行 ${modulesToExecute.length} 个模块: ${modulesToExecute.map(m => m.name).join(', ')}`);
    for (const module of modulesToExecute) {
      await this.executeModule(module, true);
    }
  }

  private updateCurrentModules(): void {
    // This element is no longer in the new UI, we can log to status bar instead.
  }

  private startWatching(): void {
    setInterval(() => this.checkAndExecute(), 1000);
  }

  private async checkAndExecute(): Promise<void> {
    if (this.selectedModules.size === 0) return;
    const modulesToCheck = this.modules.filter(m => this.selectedModules.has(m.name));
    let hasChanges = false;
    for (const module of modulesToCheck) {
      try {
        const response = await fetch(`/api/package/${encodeURIComponent(module.name)}`);
        const data = await response.json();
        const codeHash = this.hashCode(data.code);
        if (this.executedModules.get(module.name) !== codeHash) {
          hasChanges = true;
          break;
        }
      } catch {}
    }
    if (hasChanges) {
      this.executeSelectedModules(true);
    }
  }

  private async executeModule(module: ModuleInfo, force: boolean): Promise<void> {
    try {
      const response = await fetch(`/api/package/${encodeURIComponent(module.name)}`);
      const data = await response.json();
      const codeHash = this.hashCode(data.code);
      if (!force && this.executedModules.get(module.name) === codeHash) return;
      await this.runCode(data.code, module.name);
      this.executedModules.set(module.name, codeHash);
    } catch (error) {
      console.error(`执行模块 ${module.name} 失败:`, error);
    }
  }

  private async runCode(code: string, moduleName: string): Promise<void> {
    try {
      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, moduleName }),
      });
      const result = await response.json();
      if (result.error) {
        console.error(`[${moduleName}] 转换失败:`, result.error);
        return;
      }
      console.info(`\n[${moduleName}] 执行代码...`);
      new Function(result.code)();
    } catch (error) {
      console.error(`[${moduleName}] 运行失败:`, error);
    }
  }

  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
  }

  private updateStatus(text: string): void {
    const statusText = document.getElementById('statusText');
    if (statusText) {
      statusText.textContent = text;
    }
  }
}

// ==================================================================================================
// 数据加载与图表渲染 (占位)
// ==================================================================================================

async function loadFrameworkComparisonData() {
  console.info('[Data] 加载框架对比数据...');
  // TODO: Fetch and render data for frameworks
}

async function loadBundleSizeData() {
  console.info('[Data] 加载模块包体积数据...');
  // TODO: Fetch and render data for bundle size
}

async function loadModuleBenchmarksData() {
  console.info('[Data] 加载模块Benchmark数据...');
  // TODO: Fetch and render data for module benchmarks
}

// ==================================================================================================
// 初始化
// ==================================================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 初始化开发控制台
  const devConsole = new DevConsole();
  devConsole.init();

  // 默认加载第一个 tab 的数据
  loadFrameworkComparisonData();

  // 为 tab 切换绑定数据加载事件
  dataStatsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = (tab as HTMLElement).dataset.tab;
      if (tabName === 'framework-comparison') {
        loadFrameworkComparisonData();
      } else if (tabName === 'bundle-size') {
        loadBundleSizeData();
      } else if (tabName === 'module-benchmarks') {
        loadModuleBenchmarksData();
      }
    });
  });
});

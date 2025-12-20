#!/usr/bin/env node

import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, existsSync, statSync, readdirSync } from 'fs'
import { gzipSync } from 'zlib'
import chalk from 'chalk'
import ora from 'ora'
import Table from 'cli-table3'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const packagesDir = join(rootDir, 'packages')

interface BundleStats {
  name: string
  rawSize: number
  gzipSize: number
  brotliSize?: number
  fileCount: number
  exports: number
  dependencies: number
  treeShakeable: boolean
}

interface DependencyAnalysis {
  name: string
  usedExports: number
  totalExports: number
  percentage: number
  canShake: boolean
}

interface PackageAnalysis {
  package: string
  bundles: BundleStats[]
  totalSize: number
  totalGzip: number
  dependencies: DependencyAnalysis[]
  issues: string[]
}

class BundleAnalyzer {
  private results: PackageAnalysis[] = []
  private startTime: number = 0

  async run(): Promise<void> {
    console.log(chalk.cyan.bold('📦 VLD Bundle Size Analysis\n'))
    this.startTime = Date.now()

    const args = process.argv.slice(2)
    const packageName = args[0]

    try {
      await this.ensureBuild()

      if (packageName) {
        await this.analyzePackage(packageName)
      } else {
        await this.analyzeAllPackages()
      }

      this.printResults()
      await this.generateVisualization()
    } catch (error) {
      console.error(chalk.red('❌ Analysis failed:'), error)
      process.exit(1)
    }
  }

  private async ensureBuild(): Promise<void> {
    const spinner = ora('Checking build status...').start()
    
    try {
      execSync('pnpm build', { cwd: rootDir, stdio: 'pipe' })
      spinner.succeed('Build completed')
    } catch (error) {
      spinner.warn('Build may be incomplete, continuing anyway')
    }
  }

  private async analyzeAllPackages(): Promise<void> {
    const packages = ['reactivity', 'router', 'compiler-core', 'compiler-sfc', 'runtime-core', 'runtime-dom', 'vld', 'vite-plugin']
    
    for (const pkgName of packages) {
      const pkgDir = join(packagesDir, pkgName)
      if (existsSync(pkgDir) && existsSync(join(pkgDir, 'dist'))) {
        await this.analyzePackage(pkgName)
      }
    }
  }

  private async analyzePackage(pkgName: string): Promise<void> {
    const pkgDir = join(packagesDir, pkgName)
    const distDir = join(pkgDir, 'dist')
    
    if (!existsSync(distDir)) {
      console.error(chalk.red(`❌ Package ${pkgName} not built`))
      return
    }

    const spinner = ora(`Analyzing ${chalk.cyan(pkgName)}...`).start()

    try {
      const bundles: BundleStats[] = []
      const issues: string[] = []
      
      const files = this.getBundleFiles(distDir)
      
      for (const file of files) {
        const stats = await this.analyzeBundle(file)
        bundles.push(stats)
        
        if (stats.rawSize > 1024 * 100) {
          issues.push(`${basename(file)} exceeds 100KB (${(stats.rawSize / 1024).toFixed(1)}KB)`)
        }
      }

      const dependencies = await this.analyzeDependencies(pkgDir)
      const totalSize = bundles.reduce((sum, b) => sum + b.rawSize, 0)
      const totalGzip = bundles.reduce((sum, b) => sum + b.gzipSize, 0)

      this.results.push({
        package: pkgName,
        bundles,
        totalSize,
        totalGzip,
        dependencies,
        issues
      })

      spinner.succeed(`Analyzed ${chalk.cyan(pkgName)} (${bundles.length} bundles)`)
    } catch (error) {
      spinner.fail(`Failed to analyze ${pkgName}`)
      throw error
    }
  }

  private getBundleFiles(dir: string): string[] {
    const files: string[] = []
    
    const walk = (currentDir: string) => {
      const items = readdirSync(currentDir, { withFileTypes: true })
      
      for (const item of items) {
        const fullPath = join(currentDir, item.name)
        
        if (item.isDirectory()) {
          walk(fullPath)
        } else if (item.isFile() && item.name.endsWith('.js')) {
          files.push(fullPath)
        }
      }
    }
    
    walk(dir)
    return files
  }

  private async analyzeBundle(filePath: string): Promise<BundleStats> {
    const content = readFileSync(filePath, 'utf-8')
    const rawSize = Buffer.byteLength(content, 'utf-8')
    const gzipSize = gzipSync(content).byteLength
    
    const fileName = basename(filePath)
    const fileCount = 1
    const exports = this.countExports(content)
    const dependencies = this.countDependencies(content)
    const treeShakeable = this.isTreeShakeable(content)

    return {
      name: fileName,
      rawSize,
      gzipSize,
      fileCount,
      exports,
      dependencies,
      treeShakeable
    }
  }

  private countExports(content: string): number {
    const exportPatterns = [
      /export\s+(?:const|let|var|function|class|interface|type)\s+(\w+)/g,
      /export\s*\{\s*([^}]+)\s*\}/g,
      /export\s+default\s+/g
    ]
    
    let count = 0
    for (const pattern of exportPatterns) {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1]) {
          count += match[1].split(',').length
        } else {
          count++
        }
      }
    }
    
    return count
  }

  private countDependencies(content: string): number {
    const importPattern = /from\s+['"]([^'"]+)['"]/g
    const requirePattern = /require\(['"]([^'"]+)['"]\)/g
    
    const imports = new Set<string>()
    
    let match: RegExpExecArray | null
    while ((match = importPattern.exec(content)) !== null) {
      imports.add(match[1])
    }
    
    while ((match = requirePattern.exec(content)) !== null) {
      imports.add(match[1])
    }
    
    return imports.size
  }

  private isTreeShakeable(content: string): boolean {
    const sideEffects = content.includes('sideEffects')
    const pureComments = content.includes('#__PURE__')
    const usedExports = content.match(/export\s+(?:const|let|var|function|class)/g)
    
    return !sideEffects && (pureComments || (usedExports && usedExports.length > 0))
  }

  private async analyzeDependencies(pkgDir: string): Promise<DependencyAnalysis[]> {
    const pkgJsonPath = join(pkgDir, 'package.json')
    if (!existsSync(pkgJsonPath)) {
      return []
    }

    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
    const dependencies = pkgJson.dependencies || {}
    
    const analysis: DependencyAnalysis[] = []
    
    for (const [dep, version] of Object.entries(dependencies)) {
      if (dep.startsWith('@vld/')) {
        const depPkgDir = join(packagesDir, dep.replace('@vld/', ''))
        const depPkgJsonPath = join(depPkgDir, 'package.json')
        
        if (existsSync(depPkgJsonPath)) {
          const depPkgJson = JSON.parse(readFileSync(depPkgJsonPath, 'utf-8'))
          const totalExports = Object.keys(depPkgJson.exports || {}).length
          
          analysis.push({
            name: dep,
            usedExports: 0,
            totalExports,
            percentage: 0,
            canShake: totalExports > 0
          })
        }
      }
    }
    
    return analysis
  }

  private printResults(): void {
    const totalTime = Date.now() - this.startTime
    
    console.log('\n' + chalk.cyan.bold('📊 Bundle Size Analysis:'))
    console.log(chalk.gray('─'.repeat(100)))

    const mainTable = new Table({
      head: [
        chalk.bold('Package'),
        chalk.bold('Size (raw)'),
        chalk.bold('Size (gzip)'),
        chalk.bold('Files'),
        chalk.bold('Exports'),
        chalk.bold('Deps'),
        chalk.bold('Tree-shake'),
        chalk.bold('Issues')
      ],
      colWidths: [15, 12, 12, 8, 8, 8, 10, 20],
      style: { head: ['cyan'] }
    })

    this.results.forEach(result => {
      const sizeColor = result.totalGzip > 10240 ? chalk.red : chalk.green
      const gzipColor = result.totalGzip > 10240 ? chalk.red : chalk.green
      
      mainTable.push([
        chalk.bold(result.package),
        sizeColor(this.formatSize(result.totalSize)),
        gzipColor(this.formatSize(result.totalGzip)),
        chalk.blue(result.bundles.length.toString()),
        chalk.yellow(result.bundles.reduce((sum, b) => sum + b.exports, 0).toString()),
        chalk.magenta(result.bundles.reduce((sum, b) => sum + b.dependencies, 0).toString()),
        result.bundles.every(b => b.treeShakeable) ? chalk.green('✓') : chalk.red('✗'),
        result.issues.length > 0 ? chalk.red(result.issues.length.toString()) : chalk.green('0')
      ])
    })

    console.log(mainTable.toString())

    this.printBundleDetails()
    this.printDependencyAnalysis()
    
    console.log(chalk.gray('─'.repeat(100)))
    console.log(`  ${chalk.bold('Analysis completed in:')} ${chalk.yellow(totalTime + 'ms')}`)
  }

  private printBundleDetails(): void {
    console.log(chalk.cyan.bold('\n📦 Bundle Details:'))
    
    this.results.forEach(result => {
      console.log(`\n${chalk.bold(result.package)}:`)
      
      const table = new Table({
        head: [
          chalk.bold('File'),
          chalk.bold('Raw'),
          chalk.bold('Gzip'),
          chalk.bold('Exports'),
          chalk.bold('Deps')
        ],
        colWidths: [25, 10, 10, 8, 8]
      })

      result.bundles.forEach(bundle => {
        table.push([
          bundle.name,
          this.formatSize(bundle.rawSize),
          this.formatSize(bundle.gzipSize),
          bundle.exports.toString(),
          bundle.dependencies.toString()
        ])
      })

      console.log(table.toString())
    })
  }

  private printDependencyAnalysis(): void {
    const allDeps = new Map<string, DependencyAnalysis>()
    
    this.results.forEach(result => {
      result.dependencies.forEach(dep => {
        if (!allDeps.has(dep.name)) {
          allDeps.set(dep.name, dep)
        }
      })
    })

    if (allDeps.size === 0) {
      return
    }

    console.log(chalk.cyan.bold('\n🔗 Dependency Analysis:'))

    const table = new Table({
      head: [
        chalk.bold('Dependency'),
        chalk.bold('Used/Tot'),
        chalk.bold('Usage %'),
        chalk.bold('Shakeable')
      ],
      colWidths: [20, 10, 10, 10]
    })

    allDeps.forEach(dep => {
      const usageColor = dep.percentage < 50 ? chalk.red : dep.percentage < 80 ? chalk.yellow : chalk.green
      
      table.push([
        dep.name,
        `${dep.usedExports}/${dep.totalExports}`,
        usageColor(`${dep.percentage}%`),
        dep.canShake ? chalk.green('✓') : chalk.red('✗')
      ])
    })

    console.log(table.toString())
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  private async generateVisualization(): Promise<void> {
    const reportDir = join(rootDir, 'reports')
    const reportPath = join(reportDir, 'bundle-analysis.json')
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      results: this.results,
      summary: {
        totalPackages: this.results.length,
        totalRawSize: this.results.reduce((sum, r) => sum + r.totalSize, 0),
        totalGzipSize: this.results.reduce((sum, r) => sum + r.totalGzip, 0),
        averageBundleSize: this.results.reduce((sum, r) => sum + r.totalSize, 0) / this.results.length,
        issuesCount: this.results.reduce((sum, r) => sum + r.issues.length, 0)
      }
    }

    const fs = await import('fs')
    const { mkdirSync, writeFileSync } = fs
    
    if (!existsSync(reportDir)) {
      mkdirSync(reportDir, { recursive: true })
    }

    writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    console.log(chalk.gray(`\n📄 Report saved to: ${reportPath}`))
    
    await this.generateHtmlReport(report)
  }

  private async generateHtmlReport(report: any): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>VLD Bundle Analysis</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
    .chart-container { margin: 40px 0; max-width: 800px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; }
    .good { color: green; }
    .warning { color: orange; }
    .bad { color: red; }
  </style>
</head>
<body>
  <h1>VLD Bundle Analysis</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  
  <div class="chart-container">
    <canvas id="sizeChart"></canvas>
  </div>
  
  <h2>Package Details</h2>
  <table>
    <thead>
      <tr>
        <th>Package</th>
        <th>Raw Size</th>
        <th>Gzip Size</th>
        <th>Bundles</th>
        <th>Issues</th>
      </tr>
    </thead>
    <tbody>
      ${report.results.map((pkg: any) => `
        <tr>
          <td>${pkg.package}</td>
          <td>${Math.round(pkg.totalSize / 1024)} KB</td>
          <td>${Math.round(pkg.totalGzip / 1024)} KB</td>
          <td>${pkg.bundles.length}</td>
          <td>${pkg.issues.length}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <script>
    const ctx = document.getElementById('sizeChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(report.results.map((p: any) => p.package))},
        datasets: [
          {
            label: 'Raw Size (KB)',
            data: ${JSON.stringify(report.results.map((p: any) => Math.round(p.totalSize / 1024)))},
            backgroundColor: 'rgba(54, 162, 235, 0.5)'
          },
          {
            label: 'Gzip Size (KB)',
            data: ${JSON.stringify(report.results.map((p: any) => Math.round(p.totalGzip / 1024)))},
            backgroundColor: 'rgba(75, 192, 192, 0.5)'
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Size (KB)'
            }
          }
        }
      }
    });
  </script>
</body>
</html>`

    const reportDir = join(rootDir, 'reports')
    const htmlPath = join(reportDir, 'bundle-analysis.html')
    
    const { writeFileSync } = await import('fs')
    writeFileSync(htmlPath, html)
    
    console.log(chalk.gray(`📊 HTML report: ${htmlPath}`))
  }
}

// 运行包大小分析
const analyzer = new BundleAnalyzer()
analyzer.run()
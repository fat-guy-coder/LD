#!/usr/bin/env node
/**
 * @description Automated, browser-based memory usage runner for the LD framework.
 * Discovers and runs all `*.mem.ts` files within the `packages` directory.
 */

import { dirname, resolve, relative } from 'path'
import { fileURLToPath } from 'url'
import { promises as fs } from 'fs'
import chalk from 'chalk'
import ora from 'ora'
import Table from 'cli-table3'
import { createServer, type ViteDevServer } from 'vite'
import { glob } from 'glob'

// 动态导入 puppeteer，如果不存在则提示用户安装
// 使用 any 类型避免类型导入失败（puppeteer 是可选依赖）
type PuppeteerBrowser = any
type PuppeteerPage = any

let puppeteer: { launch: (options?: any) => Promise<PuppeteerBrowser> } | null = null

async function loadPuppeteer(): Promise<void> {
  try {
    const puppeteerModule = await import('puppeteer')
    puppeteer = puppeteerModule.default
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Puppeteer 未安装！\n'))
    console.log(chalk.yellow('Puppeteer 是用于内存测试的可选依赖，需要单独安装。'))
    console.log(chalk.cyan('\n请运行以下命令安装：'))
    console.log(chalk.white('  pnpm run install:memory-test-deps'))
    console.log(chalk.white('  或者'))
    console.log(chalk.white('  pnpm install puppeteer --save-dev\n'))
    process.exit(1)
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

interface TestResult {
  file: string
  scenario: string
  heapUsedBytes: number
  bytesPerItem?: number
  count?: number
}

class MemoryRunner {
  private viteServer: ViteDevServer | null = null
  private browser: PuppeteerBrowser | null = null
  private testFiles: string[] = []

  async run(): Promise<void> {
    console.log(chalk.cyan.bold('🧠 LD Memory Usage Analysis Runner\n'))
    const spinner = ora('Initializing...').start()

    try {
      // 首先加载 Puppeteer
      spinner.text = 'Loading Puppeteer...'
      await loadPuppeteer()
      if (!puppeteer) {
        throw new Error('Failed to load Puppeteer')
      }
      spinner.succeed('Puppeteer loaded.')

      spinner.text = 'Discovering memory test files...'
      this.testFiles = await this.findTestFiles()
      if (this.testFiles.length === 0) {
        spinner.warn('No memory test files (`.mem.ts`) found in `packages`.')
        return
      }
      spinner.succeed(`Found ${this.testFiles.length} test file(s).`)

      spinner.text = 'Starting Vite dev server for test compilation...'
      this.viteServer = await this.startViteServer()
      const port = this.viteServer.config.server.port
      spinner.succeed(`Vite server running on port ${port}.`)

      spinner.text = 'Launching Puppeteer...'
      this.browser = await puppeteer.launch({
        headless: true,
      })
      spinner.succeed('Puppeteer launched.')

      const results: TestResult[] = []
      for (const file of this.testFiles) {
        const testName = relative(rootDir, file)
        spinner.start(`Running test: ${chalk.yellow(testName)}`)
        const result = await this.runTest(file, port!)
        results.push(result)
        spinner.succeed(`Finished test: ${chalk.yellow(testName)}`)
      }

      this.printResults(results)
      await this.writeReport(results)
    } catch (error) {
      spinner.fail('An error occurred during the memory test run.')
      console.error(chalk.red(error))
      process.exit(1)
    } finally {
      spinner.start('Cleaning up...')
      await this.browser?.close()
      await this.viteServer?.close()
      spinner.succeed('Cleanup complete.')
    }
  }

  private findTestFiles(): Promise<string[]> {
    return glob('packages/**/*.mem.ts', { cwd: rootDir, absolute: true })
  }

  private async startViteServer(): Promise<ViteDevServer> {
    const server = await createServer({
      root: rootDir, // Run vite from project root
      server: { port: 9527, hmr: false },
      logLevel: 'silent',
      // Ensure vite can resolve our workspace aliases like '@ld/reactivity'
      resolve: {
        alias: {
          '@ld/reactivity': resolve(rootDir, 'packages/reactivity/src'),
        },
      },
    })
    return server.listen()
  }

  private async runTest(filePath: string, port: number): Promise<TestResult> {
    if (!this.browser) throw new Error('Browser not initialized.')
    const page = await this.browser.newPage()


    try {
      // Generate a temporary HTML file to run the script
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head><title>Memory Test</title></head>
        <body>
          <script type="module" src="/${relative(rootDir, filePath)}"></script>
        </body>
        </html>
      `
      // Intercept the request to serve our dynamic HTML
      await page.setRequestInterception(true)
      page.on('request', request => {
        // Only intercept the main navigation request, let others (like the script) pass through to Vite.
        if (request.url() === `http://localhost:${port}/`) {
          void request.respond({ status: 200, contentType: 'text/html', body: htmlContent })
        } else {
          void request.continue()
        }
      })

      await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle0' })

      const baselineMemory = await this.getMemoryUsage(page)

      // The .mem.ts file should have a `run` function, which we'll call after dynamic import
      const modulePath = `/${relative(rootDir, filePath)}`
      await page.evaluate(async path => {
        const mod = await import(path)
        if (mod.run && typeof mod.run === 'function') {
          mod.run()
        } else {
          throw new Error(`Test file at ${path} does not have an exported 'run' function.`)
        }
      }, modulePath)

      const finalMemory = await this.getMemoryUsage(page)
      const heapUsedBytes = finalMemory.JSHeapUsedSize - baselineMemory.JSHeapUsedSize

      // Extract scenario details from the test file if available
      const retainedObjects = await page.evaluate(() => (window as any).__retainedObjects)
      const count = Array.isArray(retainedObjects) ? retainedObjects.length : undefined

      const result: TestResult = {
        file: relative(rootDir, filePath),
        scenario: `Execution of ${relative(rootDir, filePath)}`,
        heapUsedBytes,
      }

      if (count !== undefined) {
        result.count = count
        result.bytesPerItem = heapUsedBytes / count
      }

      return result
    } finally {
      await page.close()
    }
  }

  private async getMemoryUsage(page: PuppeteerPage): Promise<{ JSHeapUsedSize: number }> {
    const metrics = await page.metrics()
    return {
      JSHeapUsedSize: metrics.JSHeapUsedSize ?? 0,
    }
  }

  private printResults(results: TestResult[]): void {
    const table = new Table({
      head: [
        chalk.bold('File'),
        chalk.bold('Heap Increase (Bytes)'),
        chalk.bold('Items'),
        chalk.bold('Bytes/Item'),
      ],
      colWidths: [50, 25, 15, 15],
    })

    results.forEach(r => {
      table.push([
        r.file,
        r.heapUsedBytes.toLocaleString(),
        r.count?.toLocaleString() ?? 'N/A',
        r.bytesPerItem?.toFixed(2) ?? 'N/A',
      ])
    })

    console.log('\n' + chalk.cyan('📈 Memory Test Results:') + '\n')
    console.log(table.toString())
  }

  private async writeReport(results: TestResult[]): Promise<void> {
    const report = {
      createdAt: new Date().toISOString(),
      results: results.map(r => ({
        file: r.file,
        scenario: r.scenario,
        heapUsedBytes: r.heapUsedBytes,
        count: r.count,
        bytesPerItem: r.bytesPerItem,
      })),
    }
    const reportPath = resolve(rootDir, 'statistics', 'memory-analysis.json')
    await fs.mkdir(dirname(reportPath), { recursive: true })
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
    console.log(chalk.green(`\n📄 Memory analysis report saved to: ${reportPath}`))
  }
}

void new MemoryRunner().run()

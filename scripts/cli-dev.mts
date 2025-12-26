#!/usr/bin/env node

import { spawn, ChildProcess } from 'child_process'
import chokidar from 'chokidar'
import { join, dirname, relative } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import chalk from 'chalk'
import ora from 'ora'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const cliDir = join(rootDir, 'packages', 'cli')

class CliDevManager {
  private cliProcess: ChildProcess | null = null
  private watcher: chokidar.FSWatcher | null = null
  private restarting = false

  async start(): Promise<void> {
    console.log(chalk.cyan('💻 LD CLI Development Mode\n'))

    if (!existsSync(cliDir)) {
      console.error(chalk.red('❌ CLI package not found'))
      process.exit(1)
    }

    // 初始构建
    await this.buildCli()

    // 启动 CLI
    this.startCli()

    // 设置文件监听
    this.setupFileWatcher()

    // 优雅退出处理
    this.setupGracefulShutdown()
  }

  private async buildCli(): Promise<void> {
    const spinner = ora('Building CLI...').start()

    try {
      await this.executeCommand('pnpm run build', cliDir)
      spinner.succeed('CLI built successfully')
    } catch (error) {
      spinner.fail('CLI build failed')
      console.error(chalk.red(error instanceof Error ? error.message : String(error)))
      process.exit(1)
    }
  }

  private startCli(): void {
    console.log(chalk.gray('Starting CLI...'))

    if (this.cliProcess && !this.cliProcess.killed) {
      this.cliProcess.kill('SIGTERM')
    }

    this.cliProcess = spawn('node', ['dist/index.js'], {
      cwd: cliDir,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, NODE_ENV: 'development', FORCE_COLOR: '1' }
    })

    this.cliProcess.on('exit', (code) => {
      if (code !== 0 && !this.restarting) {
        console.log(chalk.yellow(`CLI exited with code ${code}, waiting for changes...`))
      }
    })

    this.cliProcess.on('error', (error) => {
      console.error(chalk.red('CLI process error:'), error)
    })
  }

  private setupFileWatcher(): void {
    const watchPaths = [
      join(cliDir, 'src/**/*.ts'),
      join(cliDir, 'src/**/*.js'),
      join(cliDir, 'templates/**/*'),
      join(cliDir, '*.json')
    ]

    this.watcher = chokidar.watch(watchPaths, {
      ignored: /(node_modules|dist|\.git)/,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100
      }
    })

    this.watcher
      .on('change', async (path) => {
        const relativePath = relative(cliDir, path)
        console.log(chalk.gray(`📝 ${relativePath} changed`))

        if (path.endsWith('.ts') || path.endsWith('.js')) {
          await this.restartCli()
        }
      })
      .on('add', (path) => {
        const relativePath = relative(cliDir, path)
        console.log(chalk.green(`➕ ${relativePath} added`))
      })
      .on('unlink', (path) => {
        const relativePath = relative(cliDir, path)
        console.log(chalk.red(`➖ ${relativePath} removed`))
      })

    console.log(chalk.gray('👀 Watching for file changes...'))
  }

  private async restartCli(): Promise<void> {
    if (this.restarting) return

    this.restarting = true
    const restartSpinner = ora('Restarting CLI...').start()

    try {
      // 先停止当前进程
      if (this.cliProcess && !this.cliProcess.killed) {
        this.cliProcess.kill('SIGTERM')
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // 重新构建
      await this.executeCommand('pnpm run build', cliDir, false)
      restartSpinner.succeed('Rebuilt successfully')

      // 重新启动
      this.startCli()
    } catch (error) {
      restartSpinner.fail('Rebuild failed')
      console.error(chalk.red(error instanceof Error ? error.message : String(error)))
    } finally {
      this.restarting = false
    }
  }

  private async executeCommand(cmd: string, cwd: string, showOutput = false): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn(cmd, {
        cwd,
        stdio: showOutput ? 'inherit' : 'pipe',
        shell: true
      })

      let output = ''
      process.stdout?.on('data', (data) => output += data.toString())
      process.stderr?.on('data', (data) => output += data.toString())

      process.on('exit', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Command failed: ${cmd}\n${output}`))
        }
      })

      process.on('error', reject)
    })
  }

  private setupGracefulShutdown(): void {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT']

    signals.forEach(signal => {
      process.on(signal, async () => {
        console.log(chalk.yellow(`\n${signal} received, shutting down...`))
        await this.cleanup()
        process.exit(0)
      })
    })

    process.on('uncaughtException', (error) => {
      console.error(chalk.red('❌ Uncaught exception:'), error)
      this.cleanup().finally(() => process.exit(1))
    })

    process.on('unhandledRejection', (reason) => {
      console.error(chalk.red('❌ Unhandled rejection:'), reason)
    })
  }

  private async cleanup(): Promise<void> {
    console.log(chalk.gray('\n🛑 Cleaning up...'))

    // 停止 CLI 进程
    if (this.cliProcess && !this.cliProcess.killed) {
      this.cliProcess.kill('SIGTERM')
      console.log(chalk.gray('  ✓ CLI process stopped'))
    }

    // 关闭文件监听器
    if (this.watcher) {
      await this.watcher.close()
      console.log(chalk.gray('  ✓ File watcher stopped'))
    }

    console.log(chalk.green('✅ Cleanup complete'))
  }
}

// 启动 CLI 开发模式
const cliDevManager = new CliDevManager()
cliDevManager.start()
#!/usr/bin/env node

import { spawn, ChildProcess } from 'child_process'
import chokidar from 'chokidar'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { createServer, type ViteDevServer } from 'vite'
import chalk from 'chalk'
import ora from 'ora'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const packagesDir = join(rootDir, 'packages')

class DevManager {
  private viteServer: ViteDevServer | null = null
  private watchers: Map<string, ChildProcess> = new Map()
  private fileWatchers: chokidar.FSWatcher[] = []

  async start(): Promise<void> {
    console.log(chalk.cyan('🚀 Starting LD development environment...\n'))

    const args = process.argv.slice(2)
    const mode = args[0] || 'all'

    try {
      if (mode === 'server' || mode === 'all') {
        await this.startDevServer()
      }

      if (mode === 'watch' || mode === 'all') {
        await this.startPackageWatchers()
      }

      if (mode === 'cli' || mode === 'all') {
        await this.startCliDev()
      }

      this.setupGracefulShutdown()
    } catch (error) {
      console.error(chalk.red('❌ Failed to start development environment:'), error)
      this.cleanup()
      process.exit(1)
    }
  }

  private async startDevServer(): Promise<void> {
    const spinner = ora('Starting Vite development server...').start()

    try {
      // Vite 会自动加载 vite.config.ts，我们不再覆盖任何配置
      this.viteServer = await createServer({
        configFile: join(rootDir, 'vite.config.ts'),
        logLevel: 'info',
      })

      await this.viteServer.listen()

      const port = this.viteServer.config.server.port || 3000;
      spinner.succeed(`Vite server running at ${chalk.cyan(`http://localhost:${port}`)}`)
      console.log(chalk.blue(`  ➜ Main Panel: http://localhost:${port}/`));
      
      // 关键：移除所有手动重启逻辑，完全依赖 Vite 的内置机制

    } catch (error) {
      spinner.fail('Failed to start Vite server')
      throw error
    }
  }

  private async startPackageWatchers(): Promise<void> {
    const packages = ['reactivity', 'compiler-core', 'runtime-core']
    
    for (const pkg of packages) {
      const pkgDir = join(packagesDir, pkg)
      
      if (!this.isPackageExists(pkgDir)) {
        console.log(chalk.yellow(`⚠️  Package ${pkg} not found, skipping`))
        continue
      }

      const spinner = ora(`Starting TypeScript watcher for ${pkg}...`).start()
      
      try {
        const watcher = spawn('pnpm', ['run', 'dev'], {
          cwd: pkgDir,
          stdio: 'inherit',
          shell: true,
          env: { ...process.env, FORCE_COLOR: '1' }
        })

        this.watchers.set(pkg, watcher)
        spinner.succeed(`Watching ${chalk.cyan(pkg)} for changes`)
      } catch (error) {
        spinner.fail(`Failed to start watcher for ${pkg}`)
      }
    }

    this.setupFileWatchers()
  }

  private setupFileWatchers(): void {
    const watcher = chokidar.watch([
      join(packagesDir, '**/*.ts'),
      join(packagesDir, '**/*.tsx'),
      join(packagesDir, '**/*.vue')
    ], {
      ignored: /(node_modules|dist|\.git)/,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      }
    })

    watcher
      .on('change', (path) => {
        const relativePath = path.replace(rootDir + '/', '')
        console.log(chalk.gray(`📝 ${relativePath} changed`))
      })
      .on('add', (path) => {
        const relativePath = path.replace(rootDir + '/', '')
        console.log(chalk.green(`➕ ${relativePath} added`))
      })
      .on('unlink', (path) => {
        const relativePath = path.replace(rootDir + '/', '')
        console.log(chalk.red(`➖ ${relativePath} removed`))
      })

    this.fileWatchers.push(watcher)
  }

  private async startCliDev(): Promise<void> {
    const cliDir = join(packagesDir, 'cli')
    
    if (!this.isPackageExists(cliDir)) {
      console.log(chalk.yellow('⚠️  CLI package not found, skipping'))
      return
    }

    const spinner = ora('Starting CLI development mode...').start()
    
    try {
      const cliProcess = spawn('node', ['--loader', 'tsx', 'src/index.ts'], {
        cwd: cliDir,
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, FORCE_COLOR: '1' }
      })

      this.watchers.set('cli', cliProcess)
      spinner.succeed('CLI development mode started')
    } catch (error) {
      spinner.fail('Failed to start CLI')
    }
  }

  private isPackageExists(pkgDir: string): boolean {
    try {
      return existsSync(pkgDir) && existsSync(join(pkgDir, 'package.json'))
    } catch {
      return false
    }
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

    if (this.viteServer) {
      await this.viteServer.close()
      console.log(chalk.gray('  ✓ Vite server stopped'))
    }

    this.watchers.forEach((process, pkg) => {
      if (!process.killed) {
        process.kill('SIGTERM')
        console.log(chalk.gray(`  ✓ ${pkg} watcher stopped`))
      }
    })

    this.fileWatchers.forEach(watcher => {
      watcher.close()
    })

    console.log(chalk.green('✅ Cleanup complete'))
  }
}

const devManager = new DevManager()
devManager.start()

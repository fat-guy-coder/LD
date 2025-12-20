#!/usr/bin/env node

import { spawn } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import chalk from 'chalk'
import ora from 'ora'
import Table from 'cli-table3'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const packagesDir = join(rootDir, 'packages')

interface BuildResult {
  package: string
  success: boolean
  duration: number
  errors: string[]
}

class BuildAllManager {
  private results: BuildResult[] = []
  private startTime: number = 0

  async run(): Promise<void> {
    console.log(chalk.cyan.bold('🚀 Building All VLD Packages\n'))
    this.startTime = Date.now()

    const args = process.argv.slice(2)
    const skipTests = args.includes('--skip-tests')
    const skipTypes = args.includes('--skip-types')
    const parallel = args.includes('--parallel')
    const production = args.includes('--production')

    try {
      if (!skipTests) {
        await this.runTests()
      }

      if (!skipTypes) {
        await this.generateTypes()
      }

      if (parallel) {
        await this.buildPackagesParallel(production)
      } else {
        await this.buildPackagesSequential(production)
      }

      this.printResults()
    } catch (error) {
      console.error(chalk.red('❌ Build failed:'), error)
      process.exit(1)
    }
  }

  private async runTests(): Promise<void> {
    const spinner = ora('Running tests...').start()
    
    try {
      await this.executeCommand('pnpm test', rootDir)
      spinner.succeed('Tests passed')
    } catch (error) {
      spinner.fail('Tests failed')
      throw error
    }
  }

  private async generateTypes(): Promise<void> {
    const spinner = ora('Generating type declarations...').start()
    
    try {
      await this.executeCommand('pnpm build:types', rootDir)
      spinner.succeed('Type declarations generated')
    } catch (error) {
      spinner.fail('Type generation failed')
      throw error
    }
  }

  private async buildPackagesSequential(production: boolean): Promise<void> {
    const buildOrder = [
      'reactivity',
      'router',
      'compiler-core',
      'compiler-sfc',
      'runtime-core',
      'runtime-dom',
      'vld',
      'vite-plugin',
      'cli',
      'devtools'
    ]

    console.log(chalk.gray('Building packages sequentially...'))

    for (const pkgName of buildOrder) {
      await this.buildPackage(pkgName, production)
    }
  }

  private async buildPackagesParallel(production: boolean): Promise<void> {
    const packages = [
      'reactivity',
      'router',
      'compiler-core',
      'compiler-sfc',
      'runtime-core',
      'runtime-dom',
      'vld',
      'vite-plugin',
      'cli',
      'devtools'
    ]

    console.log(chalk.gray('Building packages in parallel...'))

    const promises = packages.map(pkgName => 
      this.buildPackage(pkgName, production)
    )

    await Promise.all(promises)
  }

  private async buildPackage(pkgName: string, production: boolean): Promise<void> {
    const pkgDir = join(packagesDir, pkgName)
    
    if (!existsSync(pkgDir)) {
      console.log(chalk.yellow(`⚠️  Package ${pkgName} not found, skipping`))
      return
    }

    const spinner = ora(`Building ${chalk.cyan(pkgName)}...`).start()
    const startTime = Date.now()
    const errors: string[] = []

    try {
      const env = production ? { ...process.env, NODE_ENV: 'production' } : process.env
      await this.executeCommand('pnpm run build', pkgDir, false, env as NodeJS.ProcessEnv)
      
      const duration = Date.now() - startTime
      this.results.push({
        package: pkgName,
        success: true,
        duration,
        errors: []
      })
      
      spinner.succeed(`Built ${chalk.green(pkgName)} in ${chalk.yellow(duration + 'ms')}`)
    } catch (error) {
      const duration = Date.now() - startTime
      errors.push(error instanceof Error ? error.message : String(error))
      
      this.results.push({
        package: pkgName,
        success: false,
        duration,
        errors
      })
      
      spinner.fail(`Failed to build ${chalk.red(pkgName)}`)
    }
  }

  private async executeCommand(
    cmd: string, 
    cwd: string, 
    showOutput = false,
    env?: NodeJS.ProcessEnv
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const childProcess = spawn(cmd, {
        cwd,
        stdio: showOutput ? 'inherit' : 'pipe',
        shell: true,
        env: { ...process.env, ...env }
      })

      let output = ''
      childProcess.stdout?.on('data', (data) => output += data.toString())
      childProcess.stderr?.on('data', (data) => output += data.toString())

      childProcess.on('exit', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Command failed: ${cmd}\n${output}`))
        }
      })

      childProcess.on('error', reject)
    })
  }

  private printResults(): void {
    const totalTime = Date.now() - this.startTime
    const successful = this.results.filter(r => r.success).length
    const failed = this.results.filter(r => !r.success).length
    const total = this.results.length

    console.log('\n' + chalk.cyan.bold('📊 Build Results:'))
    console.log(chalk.gray('─'.repeat(70)))

    const table = new Table({
      head: [
        chalk.bold('Package'),
        chalk.bold('Status'),
        chalk.bold('Duration'),
        chalk.bold('Errors')
      ],
      colWidths: [15, 10, 12, 30],
      style: { head: ['cyan'] }
    })

    this.results.forEach(result => {
      const status = result.success ? chalk.green('✅') : chalk.red('❌')
      const duration = chalk.yellow(result.duration + 'ms')
      const errors = result.errors.length > 0 
          ? chalk.red(result.errors[0]?.substring(0, 30) + '...') 
          : chalk.gray('none')

      table.push([
        chalk.bold(result.package),
        status,
        duration,
        errors
      ])
    })

    console.log(table.toString())

    console.log(chalk.gray('─'.repeat(70)))
    console.log(
      `  ${chalk.bold('Summary:')} ` +
      `${chalk.green(`${successful}/${total}`)} successful, ` +
      `${chalk.red(`${failed}`)} failed ` +
      `in ${chalk.yellow(totalTime + 'ms')}`
    )

    if (failed > 0) {
      console.log(chalk.red.bold('\n❌ Some builds failed:'))
      this.results
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`\n${chalk.bold(result.package)}:`)
          result.errors.forEach((error, i) => {
            console.log(`  ${i + 1}. ${error}`)
          })
        })
      process.exit(1)
    } else {
      console.log(chalk.green.bold('\n🎉 All packages built successfully!'))
    }
  }
}

// 运行构建
const buildAllManager = new BuildAllManager()
buildAllManager.run()
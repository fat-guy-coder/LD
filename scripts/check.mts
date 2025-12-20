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

interface CheckResult {
  package: string
  lint: boolean
  typeCheck: boolean
  tests: boolean
  coverage: number
  errors: string[]
}

class QualityChecker {
  private results: CheckResult[] = []
  private startTime: number = 0

  async run(): Promise<void> {
    console.log(chalk.cyan.bold('🔍 VLD Code Quality Check\n'))
    this.startTime = Date.now()

    const args = process.argv.slice(2)
    const packageName = args[0]

    try {
      if (packageName) {
        await this.checkPackage(packageName)
      } else {
        await this.checkAllPackages()
      }

      this.printResults()
      await this.generateReport()
    } catch (error) {
      console.error(chalk.red('❌ Quality check failed:'), error)
      process.exit(1)
    }
  }

  private async checkAllPackages(): Promise<void> {
    const packages = ['reactivity', 'router', 'compiler-core', 'compiler-sfc', 'runtime-core', 'runtime-dom', 'vld', 'vite-plugin']
    
    for (const pkgName of packages) {
      const pkgDir = join(packagesDir, pkgName)
      if (existsSync(pkgDir) && existsSync(join(pkgDir, 'package.json'))) {
        await this.checkPackage(pkgName)
      }
    }
  }

  private async checkPackage(pkgName: string): Promise<void> {
    const pkgDir = join(packagesDir, pkgName)
    
    if (!existsSync(pkgDir)) {
      console.error(chalk.red(`❌ Package ${pkgName} not found`))
      process.exit(1)
    }

    const spinner = ora(`Checking ${chalk.cyan(pkgName)}...`).start()
    const errors: string[] = []

    try {
      const [lintResult, typeCheckResult, testResult] = await Promise.allSettled([
        this.runLint(pkgDir),
        this.runTypeCheck(pkgDir),
        this.runTests(pkgDir)
      ])

      const lintPassed = lintResult.status === 'fulfilled'
      const typeCheckPassed = typeCheckResult.status === 'fulfilled'
      const testPassed = testResult.status === 'fulfilled'
      
      if (lintResult.status === 'rejected') errors.push(`Lint: ${lintResult.reason}`)
      if (typeCheckResult.status === 'rejected') errors.push(`Type check: ${typeCheckResult.reason}`)
      if (testResult.status === 'rejected') errors.push(`Tests: ${testResult.reason}`)

      const coverage = await this.getCoverage(pkgDir)

      this.results.push({
        package: pkgName,
        lint: lintPassed,
        typeCheck: typeCheckPassed,
        tests: testPassed,
        coverage,
        errors
      })

      const passed = lintPassed && typeCheckPassed && testPassed
      spinner[passed ? 'succeed' : 'fail'](`Checked ${chalk.cyan(pkgName)}`)

    } catch (error) {
      spinner.fail(`Failed to check ${pkgName}`)
      throw error
    }
  }

  private async runLint(cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const childProcess = spawn('pnpm', ['run', 'lint'], {
        cwd,
        stdio: 'pipe',
        shell: true,
        env: { ...process.env, NODE_ENV: 'test' } as NodeJS.ProcessEnv
      })

      let output = ''
      childProcess.stdout?.on('data', (data) => output += data.toString())
      childProcess.stderr?.on('data', (data) => output += data.toString())

      childProcess.on('exit', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Lint failed with code ${code}\n${output}`))
        }
      })

      childProcess.on('error', reject)
    })
  }

  private async runTypeCheck(cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const childProcess = spawn('npx', ['tsc', '--noEmit'], {
        cwd,
        stdio: 'pipe',
        shell: true,
        env: { ...process.env, NODE_ENV: 'test' } as NodeJS.ProcessEnv
      })

      let output = ''
      childProcess.stdout?.on('data', (data) => output += data.toString())
      childProcess.stderr?.on('data', (data) => output += data.toString())

      childProcess.on('exit', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Type check failed with code ${code}\n${output}`))
        }
      })

        childProcess.on('error', reject)
    })
  }

  private async runTests(cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const childProcess = spawn('pnpm', ['run', 'test'], {
        cwd,
        stdio: 'pipe',
        shell: true,
        env: { ...process.env, NODE_ENV: 'test' } as NodeJS.ProcessEnv
      })

      let output = ''
      childProcess.stdout?.on('data', (data) => output += data.toString())
      childProcess.stderr?.on('data', (data) => output += data.toString())

      childProcess.on('exit', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Tests failed with code ${code}\n${output}`))
        }
      })

      childProcess.on('error', reject)
    })
  }

  private async getCoverage(cwd: string): Promise<number> {
    return new Promise((resolve) => {
      const childProcess = spawn('pnpm', ['run', 'test:coverage'], {
        cwd,
        stdio: 'pipe',
        shell: true,
        env: { ...process.env, NODE_ENV: 'test' } as NodeJS.ProcessEnv
      })

      let output = ''
      childProcess.stdout?.on('data', (data) => output += data.toString())
      childProcess.stderr?.on('data', (data) => output += data.toString())

      childProcess.on('exit', () => {
        const coverageMatch = output.match(/All files.*?(\d+\.?\d*)%/s)
        resolve(coverageMatch ? parseFloat(coverageMatch[1] ?? '0') : 0)
      })
    })
  }

  private printResults(): void {
    const totalTime = Date.now() - this.startTime
    //const allPassed = this.results.every(r => r.lint && r.typeCheck && r.tests) as boolean
    const totalPackages = this.results.length
    const passedPackages = this.results.filter(r => r.lint && r.typeCheck && r.tests).length

    console.log('\n' + chalk.cyan.bold('📊 Quality Check Results:'))
    console.log(chalk.gray('─'.repeat(80)))

    const table = new Table({
      head: [
        chalk.bold('Package'),
        chalk.bold('Lint'),
        chalk.bold('Types'),
        chalk.bold('Tests'),
        chalk.bold('Coverage'),
        chalk.bold('Status')
      ],
      colWidths: [15, 8, 8, 8, 10, 25],
      style: { head: ['cyan'] }
    })

    this.results.forEach(result => {
      const status = result.lint && result.typeCheck && result.tests
        ? chalk.green('✅ PASS')
        : chalk.red('❌ FAIL')

      const errors = result.errors.length > 0
        ? chalk.red(` (${result.errors.length} errors)`)
        : ''

      table.push([
        chalk.bold(result.package),
        result.lint ? chalk.green('✓') : chalk.red('✗'),
        result.typeCheck ? chalk.green('✓') : chalk.red('✗'),
        result.tests ? chalk.green('✓') : chalk.red('✗'),
        this.formatCoverage(result.coverage),
        status + errors
      ])
    })

    console.log(table.toString())

    console.log(chalk.gray('─'.repeat(80)))
    console.log(
      `  ${chalk.bold('Summary:')} ` +
      `${chalk.green(`${passedPackages}/${totalPackages}`)} packages passed ` +
      `in ${chalk.yellow(totalTime + 'ms')}`
    )

    this.printErrorDetails()
  }

  private printErrorDetails(): void {
    const errors = this.results.filter(r => r.errors.length > 0)
    
    if (errors.length === 0) {
      console.log(chalk.green.bold('\n🎉 All checks passed!'))
      return
    }

    console.log(chalk.red.bold('\n❌ Issues found:'))

    errors.forEach(result => {
      console.log(`\n${chalk.bold(result.package)}:`)
      result.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.split('\n')[0]}`)
      })
    })

    console.log(chalk.yellow('\n⚠️  Run individual checks for details:'))
    console.log(chalk.gray('  pnpm run lint    # Lint issues'))
    console.log(chalk.gray('  pnpm type-check  # Type errors'))
    console.log(chalk.gray('  pnpm test        # Test failures'))
  }

  private formatCoverage(coverage: number): string {
    if (coverage >= 95) return chalk.green(`${coverage.toFixed(1)}%`)
    if (coverage >= 80) return chalk.yellow(`${coverage.toFixed(1)}%`)
    return chalk.red(`${coverage.toFixed(1)}%`)
  }

  private async generateReport(): Promise<void> {
    const reportDir = join(rootDir, 'reports')
    const reportPath = join(reportDir, 'quality-report.json')
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      results: this.results,
      summary: {
        totalPackages: this.results.length,
        passedPackages: this.results.filter(r => r.lint && r.typeCheck && r.tests).length,
        totalErrors: this.results.reduce((sum, r) => sum + r.errors.length, 0),
        averageCoverage: this.results.reduce((sum, r) => sum + r.coverage, 0) / this.results.length
      }
    }

    const fs = await import('fs')
    const { mkdirSync, writeFileSync } = fs
    
    if (!existsSync(reportDir)) {
      mkdirSync(reportDir, { recursive: true })
    }

    writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    console.log(chalk.gray(`\n📄 Report saved to: ${reportPath}`))
  }
}

// 运行质量检查
const checker = new QualityChecker()
checker.run()
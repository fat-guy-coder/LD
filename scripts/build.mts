#!/usr/bin/env node

import { build, BuildOptions, BuildResult } from 'esbuild'
import { readdirSync, existsSync, mkdirSync, statSync } from 'fs'
import { join, dirname, basename, extname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import chalk from 'chalk'
import ora from 'ora'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const packagesDir = join(rootDir, 'packages')

interface PackageConfig {
  name: string
  entryPoints: string[]
  external?: string[]
  format: 'esm' | 'cjs' | 'iife'
  outfile?: string
  outdir?: string
  platform: 'node' | 'browser' | 'neutral'
}

interface BuildStats {
  package: string
  duration: number
  size: number
  warnings: number
  errors: number
}

class BuildManager {
  private packages: Map<string, PackageConfig> = new Map()
  private stats: BuildStats[] = []
  private startTime: number = 0

  constructor() {
    this.loadPackageConfigs()
  }

  private loadPackageConfigs(): void {
    // Reactivity 包配置
    this.packages.set('reactivity', {
      name: '@vld/reactivity',
      entryPoints: ['src/index.ts', 'src/signal.ts', 'src/effect.ts', 'src/computed.ts', 'src/reactive.ts', 'src/batch.ts', 'src/scheduler.ts', 'src/untracked.ts', 'src/utils/equals.ts'],
      external: [],
      format: 'esm',
      outdir: 'dist',
      platform: 'browser'
    })

    // 其他包配置将在后续添加
    this.packages.set('router', {
      name: '@vld/router',
      entryPoints: ['src/index.ts'],
      external: ['@vld/reactivity'],
      format: 'esm',
      outdir: 'dist',
      platform: 'browser'
    })
  }

  private async buildPackage(pkgName: string, config: PackageConfig): Promise<void> {
    const pkgDir = join(packagesDir, pkgName)
    const distDir = join(pkgDir, 'dist')
    
    // 确保 dist 目录存在
    if (!existsSync(distDir)) {
      mkdirSync(distDir, { recursive: true })
    }

    const spinner = ora(`📦 Building ${chalk.cyan(pkgName)}...`).start()
    const startTime = Date.now()

    try {
      const buildOptions: BuildOptions = {
        entryPoints: config.entryPoints.map(ep => join(pkgDir, ep)),
        bundle: true,
        outdir: config.outdir ? join(pkgDir, config.outdir) : undefined,
        outfile: config.outfile ? join(pkgDir, config.outfile) : undefined,
        format: config.format,
        platform: config.platform,
        target: ['es2022', 'node18'],
        minify: process.env.NODE_ENV === 'production',
        sourcemap: true,
        external: config.external || [],
        define: {
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
        },
        treeShaking: true,
        metafile: true,
        legalComments: 'none',
        chunkNames: 'chunks/[name]-[hash]',
        splitting: config.format === 'esm' && config.entryPoints.length > 1,
        banner: {
          js: `/*! ${config.name} v${process.env.npm_package_version} - ${new Date().toISOString().split('T')[0]} */`
        }
      }

      const result = await build(buildOptions)
      const duration = Date.now() - startTime
      
      // 计算构建大小
      let totalSize = 0
      if (result.metafile) {
        for (const output in result.metafile.outputs) {
          totalSize += result.metafile.outputs[output].bytes
        }
      }

      this.stats.push({
        package: pkgName,
        duration,
        size: totalSize,
        warnings: result.warnings?.length || 0,
        errors: result.errors?.length || 0
      })

      spinner.succeed(`✅ ${chalk.green(pkgName)} built in ${chalk.yellow(duration + 'ms')} (${this.formatSize(totalSize)})`)
      
      // 生成类型声明
      await this.generateTypes(pkgName, pkgDir)
      
    } catch (error) {
      spinner.fail(`❌ ${chalk.red(pkgName)} build failed`)
      console.error(chalk.red(error instanceof Error ? error.message : String(error)))
      throw error
    }
  }

  private async generateTypes(pkgName: string, pkgDir: string): Promise<void> {
    const spinner = ora(`📄 Generating types for ${chalk.cyan(pkgName)}...`).start()
    
    try {
      const tsconfigPath = join(pkgDir, 'tsconfig.json')
      
      if (existsSync(tsconfigPath)) {
        execSync(`npx tsc --project ${tsconfigPath} --declaration --emitDeclarationOnly --outDir dist/types`, {
          cwd: pkgDir,
          stdio: 'inherit'
        })
        spinner.succeed(`✅ Types generated for ${chalk.green(pkgName)}`)
      } else {
        spinner.warn(`⚠️  No tsconfig found for ${pkgName}`)
      }
    } catch (error) {
      spinner.fail(`❌ Type generation failed for ${pkgName}`)
      console.error(chalk.red(error instanceof Error ? error.message : String(error)))
    }
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  public async buildAll(): Promise<void> {
    console.log(chalk.cyan('🚀 Starting build process...'))
    console.log(chalk.gray('Environment:', process.env.NODE_ENV || 'production'))
    this.startTime = Date.now()

    const args = process.argv.slice(2)
    const target = args[0]

    if (target && this.packages.has(target)) {
      // 构建指定包
      const config = this.packages.get(target)!
      await this.buildPackage(target, config)
    } else {
      // 按依赖顺序构建所有包
      const buildOrder = ['reactivity', 'router', 'compiler-core', 'compiler-sfc', 'runtime-core', 'runtime-dom', 'vld', 'vite-plugin']
      
      for (const pkgName of buildOrder) {
        if (this.packages.has(pkgName)) {
          const config = this.packages.get(pkgName)!
          await this.buildPackage(pkgName, config)
        }
      }
    }

    this.printStats()
  }

  private printStats(): void {
    const totalTime = Date.now() - this.startTime
    
    console.log('\n' + chalk.cyan('📊 Build Statistics:'))
    console.log(chalk.gray('─'.repeat(50)))
    
    let totalSize = 0
    let totalWarnings = 0
    let totalErrors = 0
    
    this.stats.forEach(stat => {
      totalSize += stat.size
      totalWarnings += stat.warnings
      totalErrors += stat.errors
      
      console.log(
        `  ${chalk.bold(stat.package.padEnd(15))} ` +
        `${chalk.yellow(stat.duration + 'ms'.padStart(8))} ` +
        `${chalk.blue(this.formatSize(stat.size).padStart(10))} ` +
        `${stat.warnings ? chalk.yellow('⚠' + stat.warnings) : '  '} ` +
        `${stat.errors ? chalk.red('✗' + stat.errors) : '  '}`
      )
    })
    
    console.log(chalk.gray('─'.repeat(50)))
    console.log(
      `  ${chalk.bold('TOTAL'.padEnd(15))} ` +
      `${chalk.yellow(totalTime + 'ms'.padStart(8))} ` +
      `${chalk.blue(this.formatSize(totalSize).padStart(10))} ` +
      `${totalWarnings ? chalk.yellow('⚠' + totalWarnings) : '  '} ` +
      `${totalErrors ? chalk.red('✗' + totalErrors) : '  '}`
    )
    
    if (totalErrors === 0) {
      console.log(chalk.green('\n🎉 All packages built successfully!'))
    } else {
      console.log(chalk.red('\n❌ Build completed with errors'))
      process.exit(1)
    }
  }
}

// 执行构建
const buildManager = new BuildManager()
buildManager.buildAll().catch(error => {
  console.error(chalk.red('❌ Build process failed:'), error)
  process.exit(1)
})
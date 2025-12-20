#!/usr/bin/env node

import { execSync, spawn } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import chalk from 'chalk'
import inquirer from 'inquirer'
import semver from 'semver'
import ora from 'ora'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const packagesDir = join(rootDir, 'packages')

interface PackageInfo {
  name: string
  path: string
  version: string
  dependencies: Record<string, string>
  private?: boolean
}

interface ReleaseOptions {
  version: string
  tag: string
  dryRun: boolean
  skipTests: boolean
  skipBuild: boolean
  skipGit: boolean
  skipPublish: boolean
}

class ReleaseManager {
  private packages: Map<string, PackageInfo> = new Map()
  private options: ReleaseOptions

  constructor() {
    this.loadPackages()
    this.parseArgs()
  }

  private loadPackages(): void {
    const packageNames = ['reactivity', 'router', 'compiler-core', 'compiler-sfc', 'runtime-core', 'runtime-dom', 'vld', 'vite-plugin', 'cli', 'devtools']

    for (const pkgName of packageNames) {
      const pkgPath = join(packagesDir, pkgName, 'package.json')
      if (existsSync(pkgPath)) {
        const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        this.packages.set(pkgName, {
          name: pkgJson.name,
          path: join(packagesDir, pkgName),
          version: pkgJson.version,
          dependencies: pkgJson.dependencies || {},
          private: pkgJson.private
        })
      }
    }
  }

  private parseArgs(): void {
    const args = process.argv.slice(2)
    this.options = {
      version: args[0] || '',
      tag: args[1] || 'latest',
      dryRun: args.includes('--dry-run'),
      skipTests: args.includes('--skip-tests'),
      skipBuild: args.includes('--skip-build'),
      skipGit: args.includes('--skip-git'),
      skipPublish: args.includes('--skip-publish')
    }
  }

  private async promptVersion(): Promise<string> {
    const currentVersions = Array.from(this.packages.values()).map(p => p.version)
    const currentVersion = currentVersions[0] || '0.1.0'
    
    const { version } = await inquirer.prompt([
      {
        type: 'list',
        name: 'version',
        message: 'Select version bump type:',
        choices: [
          { name: `Patch (${currentVersion} → ${semver.inc(currentVersion, 'patch')})`, value: 'patch' },
          { name: `Minor (${currentVersion} → ${semver.inc(currentVersion, 'minor')})`, value: 'minor' },
          { name: `Major (${currentVersion} → ${semver.inc(currentVersion, 'major')})`, value: 'major' },
          { name: 'Custom version', value: 'custom' }
        ]
      }
    ])

    if (version === 'custom') {
      const { customVersion } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customVersion',
          message: 'Enter custom version:',
          validate: (input: string) => semver.valid(input) ? true : 'Invalid version'
        }
      ])
      return customVersion
    }

    return semver.inc(currentVersion, version)!
  }

  private async runCommand(cmd: string, cwd: string = rootDir): Promise<void> {
    if (this.options.dryRun) {
      console.log(chalk.gray(`[dry-run] ${cmd}`))
      return
    }

    try {
      execSync(cmd, { cwd, stdio: 'inherit' })
    } catch (error) {
      console.error(chalk.red(`Command failed: ${cmd}`))
      throw error
    }
  }

  private async runTests(): Promise<void> {
    if (this.options.skipTests) {
      console.log(chalk.yellow('⚠️  Skipping tests'))
      return
    }

    const spinner = ora('Running tests...').start()
    try {
      await this.runCommand('pnpm test')
      spinner.succeed('Tests passed')
    } catch (error) {
      spinner.fail('Tests failed')
      throw error
    }
  }

  private async runLint(): Promise<void> {
    const spinner = ora('Running lint...').start()
    try {
      await this.runCommand('pnpm lint')
      spinner.succeed('Lint passed')
    } catch (error) {
      spinner.fail('Lint failed')
      throw error
    }
  }

  private async runTypeCheck(): Promise<void> {
    const spinner = ora('Running type check...').start()
    try {
      await this.runCommand('pnpm type-check:all')
      spinner.succeed('Type check passed')
    } catch (error) {
      spinner.fail('Type check failed')
      throw error
    }
  }

  private async runBuild(): Promise<void> {
    if (this.options.skipBuild) {
      console.log(chalk.yellow('⚠️  Skipping build'))
      return
    }

    const spinner = ora('Building packages...').start()
    try {
      await this.runCommand('pnpm build:prod')
      spinner.succeed('Build completed')
    } catch (error) {
      spinner.fail('Build failed')
      throw error
    }
  }

  private async updateVersions(newVersion: string): Promise<void> {
    const spinner = ora('Updating package versions...').start()
    
    try {
      for (const [pkgName, pkgInfo] of this.packages) {
        const pkgPath = join(pkgInfo.path, 'package.json')
        const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        
        pkgJson.version = newVersion
        
        if (pkgJson.dependencies) {
          for (const dep in pkgJson.dependencies) {
            if (dep.startsWith('@vld/')) {
              pkgJson.dependencies[dep] = newVersion
            }
          }
        }
        
        writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2) + '\n')
      }
      
      spinner.succeed(`Updated all packages to version ${chalk.cyan(newVersion)}`)
    } catch (error) {
      spinner.fail('Failed to update versions')
      throw error
    }
  }

  private async commitChanges(version: string): Promise<void> {
    if (this.options.skipGit) {
      console.log(chalk.yellow('⚠️  Skipping git operations'))
      return
    }

    const spinner = ora('Committing changes...').start()
    
    try {
      await this.runCommand('git add .')
      await this.runCommand(`git commit -m "chore: release v${version}"`)
      await this.runCommand(`git tag v${version}`)
      spinner.succeed(`Committed and tagged v${version}`)
    } catch (error) {
      spinner.fail('Git operations failed')
      throw error
    }
  }

  private async publishPackages(): Promise<void> {
    if (this.options.skipPublish) {
      console.log(chalk.yellow('⚠️  Skipping publish'))
      return
    }

    const spinner = ora('Publishing packages to npm...').start()
    
    try {
      for (const [pkgName, pkgInfo] of this.packages) {
        if (pkgInfo.private) {
          console.log(chalk.gray(`  Skipping private package: ${pkgName}`))
          continue
        }

        const publishCmd = `npm publish --tag ${this.options.tag} --access public`
        const pkgSpinner = ora(`  Publishing ${pkgName}...`).start()
        
        try {
          if (!this.options.dryRun) {
            execSync(publishCmd, { cwd: pkgInfo.path, stdio: 'pipe' })
          }
          pkgSpinner.succeed(`Published ${chalk.cyan(pkgName)}`)
        } catch (error) {
          pkgSpinner.fail(`Failed to publish ${pkgName}`)
          throw error
        }
      }
      
      spinner.succeed('All packages published')
    } catch (error) {
      spinner.fail('Publishing failed')
      throw error
    }
  }

  private async pushToGit(): Promise<void> {
    if (this.options.skipGit) {
      return
    }

    const spinner = ora('Pushing to git...').start()
    
    try {
      await this.runCommand('git push origin main --tags')
      spinner.succeed('Pushed to git')
    } catch (error) {
      spinner.fail('Git push failed')
      throw error
    }
  }

  public async release(): Promise<void> {
    console.log(chalk.cyan.bold('🚀 VLD Release Manager\n'))

    const version = this.options.version || await this.promptVersion()
    
    console.log(chalk.gray('─'.repeat(50)))
    console.log(`  ${chalk.bold('Version:')} ${chalk.cyan(`v${version}`)}`)
    console.log(`  ${chalk.bold('Tag:')} ${chalk.cyan(this.options.tag)}`)
    console.log(`  ${chalk.bold('Dry Run:')} ${this.options.dryRun ? chalk.green('Yes') : chalk.red('No')}`)
    console.log(chalk.gray('─'.repeat(50)))

    if (this.options.dryRun) {
      console.log(chalk.yellow('\n⚠️  DRY RUN MODE - No changes will be made\n'))
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Start release process?',
        default: false
      }
    ])

    if (!confirm) {
      console.log(chalk.yellow('Release cancelled'))
      process.exit(0)
    }

    try {
      await this.runLint()
      await this.runTypeCheck()
      await this.runTests()
      await this.runBuild()
      await this.updateVersions(version)
      await this.commitChanges(version)
      await this.publishPackages()
      await this.pushToGit()

      console.log(chalk.green.bold(`\n🎉 Successfully released v${version}!`))
      console.log(chalk.gray('─'.repeat(50)))
      console.log(`  ${chalk.bold('npm:')} https://www.npmjs.com/package/@vld/vld`)
      console.log(`  ${chalk.bold('GitHub:')} https://github.com/username/vld/releases/tag/v${version}`)
      console.log(chalk.gray('─'.repeat(50)))
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Release failed'))
      console.error(chalk.red(error instanceof Error ? error.message : String(error)))
      process.exit(1)
    }
  }
}

// 运行发布流程
const releaseManager = new ReleaseManager()
releaseManager.release()
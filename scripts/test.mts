#!/usr/bin/env node
// scripts/test.mts
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { existsSync } from 'fs'


const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')

// 解析命令行参数
const args = process.argv.slice(2)
const isUI = args.includes('--ui')
const isWatch = args.includes('--watch')
const hasCoverage = args.includes('--coverage')
const isBench = args.includes('--bench')

// 根据参数构建 Vitest 命令
async function runTests() {
    console.log('🚀 正在启动 LD 测试套件...')

    // 工作区配置文件路径
    const workspaceConfig = resolve(rootDir, 'vitest.workspace.ts')

    // 构建 Vitest 命令参数
    const vitestArgs = []

    // 如果有工作区配置，则使用工作区
    if (existsSync(workspaceConfig)) {
        vitestArgs.push('--workspace', workspaceConfig)
    }

    // 添加其他参数
    if (isUI) {
        vitestArgs.push('--ui')
        console.log('📊 启动测试 UI 界面...')
    }

    if (isWatch) {
        vitestArgs.push('--watch')
        console.log('👀 进入监听模式...')
    }

    if (hasCoverage) {
        vitestArgs.push('--coverage')
        console.log('📈 生成覆盖率报告...')
    }

    if (isBench) {
        vitestArgs.push('bench')
        console.log('⚡ 运行性能基准测试...')
    }

    // 如果没有特殊模式，则运行所有测试
    if (!isUI && !isWatch && !hasCoverage && !isBench) {
        console.log('🧪 运行所有测试...')
    }

    // 环境变量
    const env = {
        ...process.env,
        NODE_ENV: 'test',
        VITEST: 'true'
    }

    // 运行 Vitest
    const vitestProcess = spawn('npx', ['vitest', ...vitestArgs], {
        stdio: 'inherit',
        shell: true,
        cwd: rootDir,
        env: env as NodeJS.ProcessEnv
    })

    vitestProcess.on('close', (code: number | null) => {
        process.exit(code || 0)
    })

    vitestProcess.on('error', (error: Error) => {
        console.error('❌ 启动 Vitest 失败:', error)
        process.exit(1)
    })
}

// 运行
runTests().catch((error) => {
    console.error('❌ 测试脚本执行失败:', error)
    process.exit(1)
})
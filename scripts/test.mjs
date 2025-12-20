#!/usr/bin/env node

import { spawn } from 'child_process'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

async function runTests() {
  const args = process.argv.slice(2)
  const target = args[0]
  const watchMode = args.includes('--watch')
  
  console.log('🧪 运行测试...')
  
  const testArgs = ['run', 'test']
  
  if (watchMode) {
    testArgs.push('--watch')
  }
  
  if (target) {
    // 测试指定包
    console.log(`🧪 测试包: ${target}`)
    
    const testProcess = spawn('pnpm', ['--filter', `@vld/${target}`, ...testArgs], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true
    })
    
    testProcess.on('exit', (code) => {
      process.exit(code || 0)
    })
  } else {
    // 运行所有测试
    console.log('🧪 运行所有包的测试...')
    
    const testProcess = spawn('pnpm', ['run', 'test', ...args], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true
    })
    
    testProcess.on('exit', (code) => {
      process.exit(code || 0)
    })
  }
}

runTests()
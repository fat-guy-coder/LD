#!/usr/bin/env tsx
/**
 * @description Puppeteer 安装脚本
 * 用于单独安装 Puppeteer 及其 Chrome 浏览器，用于内存测试
 * 自动配置国内镜像源以加速下载
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

const PUPPETEER_MIRROR = 'https://npmmirror.com/mirrors';

console.log(chalk.cyan.bold('🔧 Puppeteer 安装脚本\n'));
console.log(chalk.gray('Puppeteer 是用于内存测试的可选依赖，需要单独安装。'));
console.log(chalk.gray(`镜像地址: ${PUPPETEER_MIRROR}\n`));

// 设置环境变量
process.env.PUPPETEER_DOWNLOAD_BASE_URL = PUPPETEER_MIRROR;

// 检查 puppeteer 是否已安装
const puppeteerPath = join(process.cwd(), 'node_modules', 'puppeteer');
const puppeteerPackageJson = join(puppeteerPath, 'package.json');

if (!existsSync(puppeteerPackageJson)) {
  console.log(chalk.yellow('📦 Puppeteer 未安装，开始安装...\n'));
  try {
    execSync('pnpm add -D puppeteer', {
      stdio: 'inherit',
      env: {
        ...process.env,
        PUPPETEER_DOWNLOAD_BASE_URL: PUPPETEER_MIRROR,
      },
    });
    console.log(chalk.green('\n✅ Puppeteer 安装成功'));
  } catch (error) {
    console.error(chalk.red('\n❌ Puppeteer 安装失败:'), error);
    console.log(chalk.yellow('\n💡 提示: 如果安装失败，可以尝试:'));
    console.log(chalk.white('   1. 检查网络连接'));
    console.log(chalk.white('   2. 使用代理'));
    console.log(chalk.white('   3. 手动设置环境变量后安装:'));
    console.log(chalk.cyan(`      Windows PowerShell: $env:PUPPETEER_DOWNLOAD_BASE_URL="${PUPPETEER_MIRROR}"; pnpm add -D puppeteer`));
    console.log(chalk.cyan(`      Linux/Mac: export PUPPETEER_DOWNLOAD_BASE_URL="${PUPPETEER_MIRROR}" && pnpm add -D puppeteer`));
    process.exit(1);
  }
} else {
  console.log(chalk.blue('📦 Puppeteer 已安装，检查浏览器...\n'));
  
  // 检查浏览器是否已下载
  const browserPath = join(puppeteerPath, '.local-chromium');
  if (!existsSync(browserPath)) {
    console.log(chalk.yellow('🌐 Chrome 浏览器未下载，开始下载...\n'));
    try {
      // 运行 Puppeteer 的安装脚本
      execSync('node node_modules/puppeteer/install.mjs', {
        stdio: 'inherit',
        env: {
          ...process.env,
          PUPPETEER_DOWNLOAD_BASE_URL: PUPPETEER_MIRROR,
        },
      });
      console.log(chalk.green('\n✅ Chrome 浏览器下载成功'));
    } catch (error) {
      console.error(chalk.red('\n❌ Chrome 浏览器下载失败:'), error);
      console.log(chalk.yellow('\n💡 提示: 如果下载失败，可以尝试:'));
      console.log(chalk.white('   1. 检查网络连接'));
      console.log(chalk.white('   2. 使用代理'));
      console.log(chalk.white('   3. 手动设置环境变量后重新运行:'));
      console.log(chalk.cyan(`      Windows PowerShell: $env:PUPPETEER_DOWNLOAD_BASE_URL="${PUPPETEER_MIRROR}"; pnpm run install:memory-test-deps`));
      console.log(chalk.cyan(`      Linux/Mac: export PUPPETEER_DOWNLOAD_BASE_URL="${PUPPETEER_MIRROR}" && pnpm run install:memory-test-deps`));
      process.exit(1);
    }
  } else {
    console.log(chalk.green('✅ Chrome 浏览器已下载'));
    console.log(chalk.gray('\n💡 如需重新下载，请删除 node_modules/puppeteer/.local-chromium 目录后重新运行此脚本'));
  }
}

console.log(chalk.green.bold('\n✨ 安装完成！现在可以运行内存测试了:'));
console.log(chalk.cyan('   pnpm run test:memory\n'));

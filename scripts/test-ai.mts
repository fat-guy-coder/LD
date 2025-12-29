#!/usr/bin/env node
// scripts/test-ai.mts
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { getActivePackages } from './utils/get-active-packages.mts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// AI测试结果输出文件
const AI_TEST_RESULT_FILE = resolve(rootDir, '.ai-test-result.json');

interface AITestResult {
    success: boolean;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    duration: number;
    failures: Array<{
        name: string;
        error: string;
        file: string;
    }>;
    coverage?: {
        statements: number;
        branches: number;
        functions: number;
        lines: number;
    };
    summary: string;
    timestamp: string;
}

// 清理旧的测试结果
function cleanupTestResults(): void {
    if (existsSync(AI_TEST_RESULT_FILE)) {
        unlinkSync(AI_TEST_RESULT_FILE);
    }
}

// 运行测试并收集结果
async function runAITests(options: {
    watch?: boolean;
    coverage?: boolean;
    filters?: string[];
    ui?: boolean;
} = {}): Promise<AITestResult> {
    const { watch = false, coverage = false, filters = [], ui = false } = options;

    console.log('🤖 AI测试运行器启动...');
    console.log('📊 配置:', JSON.stringify({ watch, coverage, filters, ui }, null, 2));

    cleanupTestResults();

    // 构建 Vitest 命令
    const vitestArgs = ['vitest'];

    if (watch) {
        vitestArgs.push('--watch');
    } else {
        vitestArgs.push('run');
    }

    if (coverage) {
        vitestArgs.push('--coverage');
    }

    if (ui) {
        vitestArgs.push('--ui');
        console.log('🚀 启动测试UI界面...');
    }

    // If specific filters are provided, use them. Otherwise, test all active packages.
    if (filters.length > 0) {
        vitestArgs.push(...filters);
    } else {
        const activePackages = getActivePackages();
        vitestArgs.push(...activePackages);
    }

    // 添加 JSON 报告器
    vitestArgs.push('--reporter=json');

    const env = {
        ...process.env,
        NODE_ENV: 'test',
        VITEST: 'true',
        VITEST_JSON_REPORT: 'true',
    };

    console.log('⏱️  运行测试...');

    return new Promise<AITestResult>((resolve, reject) => {
        const testProcess = spawn('npx', vitestArgs, {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true,
            cwd: rootDir,
            env: env as NodeJS.ProcessEnv,
        });

        let stdoutData = '';
        let stderrData = '';

        testProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
            process.stdout.write(data.toString());
        });

        testProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
            process.stderr.write(data.toString());
        });

        testProcess.on('close', async (_code: number | null) => {
            console.log('\n📋 测试运行完成');

            try {
                const jsonMatch = stdoutData.match(/\{.*\}/s);
                let jsonResult = {};

                if (jsonMatch) {
                    try {
                        jsonResult = JSON.parse(jsonMatch[0]);
                    } catch (e: unknown) {
                        console.warn('无法解析 JSON 输出:', (e as Error).message);
                    }
                }

                const result = await analyzeTestResults(jsonResult, stderrData, coverage);

                writeFileSync(AI_TEST_RESULT_FILE, JSON.stringify(result, null, 2));

                console.log('\n' + '='.repeat(60));
                console.log('🤖 AI 测试结果摘要');
                console.log('='.repeat(60));
                console.log(`✅ 成功: ${result.success ? '是' : '否'}`);
                console.log(`📊 总计: ${result.totalTests} 个测试`);
                console.log(`👍 通过: ${result.passedTests} 个`);
                console.log(`👎 失败: ${result.failedTests} 个`);
                console.log(`⏱️  耗时: ${result.duration}ms`);

                if (result.failures.length > 0) {
                    console.log('\n❌ 失败的测试:');
                    result.failures.forEach((failure, index) => {
                        console.log(`  ${index + 1}. ${failure.name}`);
                        console.log(`     文件: ${failure.file}`);
                        console.log(`     错误: ${failure.error.substring(0, 100)}...`);
                    });
                }

                if (result.coverage) {
                    console.log('\n📈 覆盖率:');
                    console.log(`     语句: ${result.coverage.statements.toFixed(1)}%`);
                    console.log(`     分支: ${result.coverage.branches.toFixed(1)}%`);
                    console.log(`     函数: ${result.coverage.functions.toFixed(1)}%`);
                    console.log(`     行数: ${result.coverage.lines.toFixed(1)}%`);
                }

                console.log('\n📝 总结:', result.summary);
                console.log('='.repeat(60));

                resolve(result);
            } catch (error) {
                reject(error);
            }
        });

        testProcess.on('error', (error) => {
            console.error('❌ 测试进程错误:', error);
            reject(error);
        });
    });
}

async function analyzeTestResults(jsonResult: any, stderrData: string, coverage: boolean): Promise<AITestResult> {
    const result: AITestResult = {
        success: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        failures: [],
        summary: '',
        timestamp: new Date().toISOString(),
    };

    if (jsonResult && jsonResult.numTotalTests !== undefined) {
        result.success = jsonResult.success || false;
        result.totalTests = jsonResult.numTotalTests || 0;
        result.passedTests = jsonResult.numPassedTests || 0;
        result.failedTests = jsonResult.numFailedTests || 0;
        result.duration = jsonResult.startTime ? Date.now() - jsonResult.startTime : 0;

        if (jsonResult.testResults && Array.isArray(jsonResult.testResults)) {
            jsonResult.testResults.forEach((testFile: any) => {
                if (testFile.status === 'failed') {
                    result.failures.push({
                        name: `测试套件失败: ${testFile.name}`,
                        error: testFile.message || '未知套件错误',
                        file: testFile.name || '未知文件',
                    });
                } else if (testFile.assertionResults && Array.isArray(testFile.assertionResults)) {
                    testFile.assertionResults.forEach((assertion: any) => {
                        if (assertion.status === 'failed') {
                            result.failures.push({
                                name: assertion.fullName || assertion.title || '未知测试',
                                error: assertion.failureMessages?.join('\n') || '未知错误',
                                file: testFile.name || '未知文件',
                            });
                        }
                    });
                }
            });
        }
    }

    if (coverage) {
        // ... (coverage logic remains the same)
    }

    if (result.success) {
        result.summary = `所有测试通过 (${result.passedTests}/${result.totalTests})`;
    } else if (result.failedTests > 0) {
        result.summary = `${result.failedTests} 个测试失败`;
    } else if (stderrData.includes('No test files found')) {
        result.summary = '未找到测试文件';
    } else {
        result.summary = '测试运行完成，但有错误';
    }

    return result;
}

function readTestResults(): AITestResult | null {
    if (!existsSync(AI_TEST_RESULT_FILE)) {
        return null;
    }
    try {
        const content = readFileSync(AI_TEST_RESULT_FILE, 'utf-8');
        return JSON.parse(content) as AITestResult;
    } catch (error) {
        console.error('读取测试结果失败:', error);
        return null;
    }
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);

    const watch = args.includes('--watch');
    const coverage = args.includes('--coverage');
    const ui = args.includes('--ui');

    const positionalFilters = args.filter(
        (arg) => !arg.startsWith('--')
    );

    const options = {
        watch,
        coverage,
        ui,
        filters: positionalFilters,
    };

    if (args.includes('--read-results')) {
        const lastResult = readTestResults();
        if (lastResult) {
            console.log('📋 上次测试结果:');
            console.log(JSON.stringify(lastResult, null, 2));
        } else {
            console.log('⚠️  没有找到测试结果');
        }
        return;
    }

    if (args.includes('--clean')) {
        cleanupTestResults();
        console.log('🧹 已清理测试结果');
        return;
    }

    try {
        const result = await runAITests(options);
        if (!result.success) {
            process.exitCode = 1;
        }
        console.log(`\n📤 AI测试结果已保存到: ${AI_TEST_RESULT_FILE}`);
        console.log('💡 AI提示: 检查失败信息，修复代码后重新运行测试');
    } catch (error) {
        console.error('❌ 测试运行失败:', error);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
});

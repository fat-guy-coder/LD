#!/usr/bin/env node
/*
 * Dynamic benchmark runner for LD framework.
 */

import { join, dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { glob } from 'glob';
import { existsSync } from 'fs';
import chalk from 'chalk';
import Table from 'cli-table3';
import { Bench, type TaskResult } from 'tinybench';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// --- Type Definitions and Guards ---
type BenchmarkResult = TaskResult & {
  hz: number;
  mean: number;
  rme: number;
};

function isBenchmarkResult(result: TaskResult | undefined): result is BenchmarkResult {
  return result != null && 'hz' in result;
}

// --- CLI Argument Parsing ---
const [, , targetModule, filePattern] = process.argv;
if (!targetModule) {
  console.error(chalk.red('❌ Module name is required. Usage: tsx scripts/benchmark.mts <module> [file_pattern]'));
  process.exit(1);
}

const moduleBenchDir = join(rootDir, 'packages', targetModule, 'benchmarks');
if (!existsSync(moduleBenchDir)) {
  console.error(
    chalk.red(
      `❌ Benchmarks directory not found for module "${targetModule}".\nExpected: ${moduleBenchDir}`
    )
  );
  process.exit(1);
}

// --- Benchmark Discovery ---
console.log(
  chalk.cyan(
    `🏎️  Running LD Performance Benchmarks for module "${targetModule}"\n`
  )
);

let globPattern = '**/*.bench.ts';
if (filePattern) {
  console.log(chalk.yellow(`ISOLATION MODE: Running only files matching "${filePattern}"`));
  globPattern = `**/${filePattern}`;
  if (!globPattern.endsWith('.bench.ts')) {
    globPattern += '.bench.ts';
  }
}

const benchFilePaths = await glob(globPattern, {
  cwd: moduleBenchDir,
  absolute: true,
});

if (!benchFilePaths.length) {
  console.log(
    chalk.yellow(
      `⚠️  No benchmark files matching "${globPattern}" found under ${moduleBenchDir}. Nothing to run.`
    )
  );
  process.exit(0);
}

// --- Benchmark Loading ---
const dynamicBenchFns: Array<(bench: Bench) => void> = [];
for (const filePath of benchFilePaths) {
  try {
    const mod = await import(pathToFileURL(filePath).href);
    const benchFn = mod.default ?? mod;
    if (typeof benchFn === 'function') {
      dynamicBenchFns.push(benchFn);
    } else {
      console.warn(
        chalk.yellow(
          `⚠️  Benchmark file ${filePath} does not export a default function. Skipped.`
        )
      );
    }
  } catch (e) {
    console.error(chalk.red(`Failed to import ${filePath}`), e);
  }
}

if (!dynamicBenchFns.length) {
  console.error(chalk.red('❌ No valid benchmark functions were loaded.'));
  process.exit(1);
}

// --- Benchmark Runner ---
class BenchmarkRunner {
  private bench = new Bench({ time: 500 });

  async run(): Promise<void> {
    this.addTasks();
    await this.bench.run();
    this.printResults();
  }

  private addTasks(): void {
    console.log(chalk.blue('Adding benchmark tasks...'));
    for (const fn of dynamicBenchFns) {
      try {
        fn(this.bench);
      } catch (err) {
        console.error(chalk.red('Error while adding benchmark task:'), err);
      }
    }
    console.log(chalk.blue(`Added ${dynamicBenchFns.length} benchmark suite(s) with a total of ${this.bench.tasks.length} tasks.`));
  }

  private printResults(): void {
    const table = new Table({
      head: [
        chalk.bold('Task Name'),
        chalk.bold('ops/sec'),
        chalk.bold('Avg. Time (ms)'),
        chalk.bold('Margin of Error'),
      ],
      colWidths: [30, 20, 20, 20],
    });

    for (const task of this.bench.tasks) {
      if (isBenchmarkResult(task.result)) {
        table.push([
          task.name,
          task.result.hz.toLocaleString('en-US', { maximumFractionDigits: 0 }),
          (task.result.mean * 1000).toFixed(3),
          `±${task.result.rme.toFixed(2)}%`,
        ]);
      }
    }
    console.log('\n' + chalk.cyan('📈 LD Live Benchmark Results:'));
    console.log(table.toString());
  }
}

// --- Execution ---
await new BenchmarkRunner().run();

// Force exit the process, as tinybench appears to keep handles open in this environment.
process.exit(0);

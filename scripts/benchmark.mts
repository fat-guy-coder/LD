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
import { Bench } from 'tinybench';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// --- CLI Argument Parsing ---
const [, , targetModule] = process.argv;
if (!targetModule) {
  console.error(chalk.red('❌ Module name is required. Usage: tsx scripts/benchmark.mts <module>'));
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

// Use cwd option for glob for better cross-platform compatibility
const benchFilePaths = await glob('**/*.bench.ts', {
  cwd: moduleBenchDir,
  absolute: true,
});

if (!benchFilePaths.length) {
  console.log(
    chalk.yellow(
      `⚠️  No benchmark files (*.bench.ts) found under ${moduleBenchDir}. Nothing to run.`
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
  private bench = new Bench({ time: 100 });

  async run() {
    this.addTasks();
    await this.bench.run();
    this.printResults();
  }

  private addTasks() {
    console.log(chalk.blue('Adding benchmark tasks...'));
    for (const fn of dynamicBenchFns) {
      try {
        fn(this.bench);
      } catch (err) {
        console.error(chalk.red('Error while adding benchmark task:'), err);
      }
    }
    console.log(chalk.blue(`Added ${this.bench.tasks.length} tasks.`));
  }

  private printResults() {
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
      const res = task.result;
      // A robust type guard to ensure all necessary properties exist.
      if (res && 'hz' in res && 'mean' in res && 'rme' in res) {
        table.push([
          task.name,
          (res.hz as number).toLocaleString('en-US', { maximumFractionDigits: 0 }),
          ((res.mean as number) * 1000).toFixed(3),
          `±${(res.rme as number).toFixed(2)}%`,
        ]);
      }
    }
    console.log('\n' + chalk.cyan('📈 LD Live Benchmark Results:'));
    console.log(table.toString());
  }
}

// --- Execution ---
await new BenchmarkRunner().run();

// Ensure all queued reactive jobs are flushed before exiting
try {
  const modPath = pathToFileURL(
    join(rootDir, 'packages', targetModule, 'src', 'index.ts')
  ).href;
  const maybeMod = await import(modPath);
  if (typeof maybeMod.waitForJobs === 'function') {
    await maybeMod.waitForJobs();
  }
} catch (e) {
  // If module doesn't export waitForJobs, it's fine.
}

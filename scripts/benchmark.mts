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
interface LatencyLike {
  mean: number;
  rme: number;
}
interface ThroughputLike {
  mean: number;
}

function hasResultData(
  result: TaskResult | undefined
): result is TaskResult & { latency: LatencyLike; throughput: ThroughputLike } {
  return result != null && result.latency != null && result.throughput != null;
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

// --- Benchmark Runner ---
class BenchmarkRunner {
  async run(): Promise<void> {
    for (const filePath of benchFilePaths) {
      console.log(chalk.blue(`\n--- Running benchmark for: ${filePath.replace(rootDir, '')} ---`));
      try {
        const bench = new Bench({ time: 500 });
        const mod = await import(pathToFileURL(filePath).href);
        const benchFn = mod.default ?? mod;

        if (typeof benchFn === 'function') {
          benchFn(bench);
          if (bench.tasks.length > 0) {
            await bench.run();
            this.printResults(bench);
          } else {
            console.warn(chalk.yellow(`⚠️  No tasks were added from ${filePath}. Skipped.`));
          }
        } else {
          console.warn(
            chalk.yellow(
              `⚠️  Benchmark file ${filePath} does not export a default function. Skipped.`
            )
          );
        }
      } catch (e) {
        console.error(chalk.red(`Failed to run benchmark for ${filePath}`), e);
      }
    }
  }

  private printResults(bench: Bench): void {
    const table = new Table({
      head: [
        chalk.bold('Task Name'),
        chalk.bold('ops/sec'),
        chalk.bold('Avg. Time (ns)'),
        chalk.bold('Margin of Error'),
      ],
      colWidths: [30, 20, 20, 20],
    });

    for (const task of bench.tasks) {
      if (hasResultData(task.result)) {
        const opsPerSec = task.result.throughput.mean;
        const avgTimeNs = task.result.latency.mean * 1_000_000; // Convert ms to ns
        const marginOfError = task.result.latency.rme;

        table.push([
          task.name,
          opsPerSec.toLocaleString('en-US', { maximumFractionDigits: 0 }),
          avgTimeNs.toFixed(3),
          `±${marginOfError.toFixed(2)}%`,
        ]);
      }
    }
    console.log('\n' + chalk.cyan('📈 LD Live Benchmark Results:'));
    console.log(table.toString());
  }
}

// --- Execution ---
await new BenchmarkRunner().run();

console.log(chalk.green('\n✅ All benchmarks completed successfully.'));

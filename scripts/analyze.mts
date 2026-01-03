#!/usr/bin/env node

import { join, dirname, basename, resolve } from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { gzipSync, brotliCompressSync } from 'zlib';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const packagesDir = join(rootDir, 'packages');

interface BundleStats {
  name: string;
  rawSize: number;
  gzipSize: number;
  brotliSize: number;
}

interface PackageAnalysis {
  package: string;
  bundles: BundleStats[];
  totalRaw: number;
  totalGzip: number;
  totalBrotli: number;
  dependencies: string[];
  issues: string[];
}

class BundleAnalyzer {
  private results: PackageAnalysis[] = [];
  private startTime: number = 0;

  async run(): Promise<void> {
    console.log(chalk.cyan.bold('📦 LD Bundle Size Analysis\n'));
    this.startTime = Date.now();

    const args = process.argv.slice(2);
    const filterIndex = args.indexOf('--filter');
    const packageNames = filterIndex !== -1 && args[filterIndex + 1] ? [args[filterIndex + 1]!.replace('@ld/', '')] : await this.getAllPackageNames();

    const jsonOutputIndex = args.indexOf('--json');
    const jsonOutputPath = jsonOutputIndex !== -1 && args[jsonOutputIndex + 1] ? resolve(rootDir, args[jsonOutputIndex + 1]!) : null;

    try {
      await Promise.all(packageNames.map(pkgName => this.analyzePackage(pkgName)));

      this.printResults();

      if (jsonOutputPath) {
        await this.writeReport(jsonOutputPath);
      }
    } catch (error) {
      console.error(chalk.red('❌ Analysis failed:'), error);
      process.exit(1);
    }
  }

  private async getAllPackageNames(): Promise<string[]> {
    const dirents = await fs.readdir(packagesDir, { withFileTypes: true });
    return dirents
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  }

  private async analyzePackage(pkgName: string): Promise<void> {
    const pkgDir = join(packagesDir, pkgName);
    const distDir = join(pkgDir, 'dist');
    const spinner = ora(`Analyzing ${chalk.cyan(pkgName)}...`).start();

    try {
      const coreBundleFiles = await this.getCoreBundleFiles(distDir);
      if (coreBundleFiles.length === 0) {
        spinner.warn(`No core bundle files found for ${pkgName}`);
        return;
      }

      const bundles = await Promise.all(
        coreBundleFiles.map(file => this.analyzeBundle(file))
      );

      const dependencies = await this.getDependencies(pkgDir);
      
      this.results.push({
        package: pkgName,
        bundles,
        totalRaw: bundles.reduce((sum, b) => sum + b.rawSize, 0),
        totalGzip: bundles.reduce((sum, b) => sum + b.gzipSize, 0),
        totalBrotli: bundles.reduce((sum, b) => sum + b.brotliSize, 0),
        dependencies,
        issues: [],
      });

      spinner.succeed(`Analyzed ${chalk.cyan(pkgName)}`);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            spinner.info(`Skipping ${pkgName}: dist directory not found.`);
            return;
        }
      spinner.fail(`Failed to analyze ${pkgName}`);
      // Re-throw to be caught by the main run loop
      throw error;
    }
  }

  private async getCoreBundleFiles(distDir: string): Promise<string[]> {
    const files = await fs.readdir(distDir);
    return files
      .filter(file => (file.endsWith('.min.js') || file.endsWith('.min.mjs')))
      .map(file => join(distDir, file));
  }

  private async analyzeBundle(filePath: string): Promise<BundleStats> {
    const content = await fs.readFile(filePath);
    const rawSize = content.byteLength;
    // Compression is CPU-bound and can remain sync
    const gzipSize = gzipSync(content).byteLength;
    const brotliSize = brotliCompressSync(content).byteLength;

    return {
      name: basename(filePath),
      rawSize,
      gzipSize,
      brotliSize,
    };
  }

  private async getDependencies(pkgDir: string): Promise<string[]> {
    const pkgJsonPath = join(pkgDir, 'package.json');
    try {
      const content = await fs.readFile(pkgJsonPath, 'utf-8');
      const pkgJson = JSON.parse(content);
      return Object.keys(pkgJson.dependencies || {});
    } catch (error) {
      // If package.json doesn't exist or is invalid, treat as no dependencies
      return [];
    }
  }

  private async writeReport(filePath: string): Promise<void> {
    const report = {
      createdAt: new Date().toISOString(),
      results: this.results,
    };
    await fs.mkdir(dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(report, null, 2));
    console.log(chalk.green(`\n📄 Analysis report saved to: ${filePath}`));
  }

  private printResults(): void {
    const totalTime = Date.now() - this.startTime;

    console.log('\n' + chalk.cyan.bold('📊 Bundle Size Analysis:'));
    console.log(chalk.gray('─'.repeat(100)));

    const mainTable = new Table({
      head: [
        chalk.bold('Package'),
        chalk.bold('Size (raw)'),
        chalk.bold('Size (gzip)'),
        chalk.bold('Size (brotli)'),
        chalk.bold('Dependencies'),
      ],
      colWidths: [20, 15, 15, 15, 30],
      style: { head: ['cyan'] },
    });

    // Sort results alphabetically by package name for consistent output
    this.results.sort((a, b) => a.package.localeCompare(b.package));

    this.results.forEach(result => {
      const gzipColor = result.totalGzip > 10240 ? chalk.red : chalk.green;

      mainTable.push([
        chalk.bold(result.package),
        this.formatSize(result.totalRaw),
        gzipColor(this.formatSize(result.totalGzip)),
        this.formatSize(result.totalBrotli),
        result.dependencies.length > 0 ? result.dependencies.join(', ') : chalk.green('0'),
      ]);
    });

    console.log(mainTable.toString());
    console.log(chalk.gray('─'.repeat(100)));
    console.log(`  ${chalk.bold('Analysis completed in:')} ${chalk.yellow(totalTime + 'ms')}`);
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
}

const analyzer = new BundleAnalyzer();
analyzer.run();

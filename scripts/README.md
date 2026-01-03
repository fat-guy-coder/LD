# 项目脚本文档

本文档概述了 `scripts/` 目录中的脚本，这些脚本用于自动化 LD 框架的开发、构建、测试和其他任务。

## 目录

- [开发脚本](#开发脚本)
- [构建脚本](#构建脚本)
- [测试与质量保证](#测试与质量保证)
- [分析与基准测试](#分析与基准测试)
- [发布与维护](#发布与维护)
- [工具与辅助脚本](#工具与辅助脚本)

---

## 开发脚本

这些脚本是日常开发工作流程的基础。

### `dev.mts`

- **目的**: 启动整个本地开发环境的主脚本。
- **命令**: `pnpm dev`
- **逻辑**:
  - 启动 Vite 开发服务器，用于提供主开发面板 (`src/index.html`)。
  - 为核心包（`reactivity`, `compiler-core`, `runtime-core`）启动 TypeScript 监视器（`pnpm run dev`），以便在文件更改时重新编译它们。
  - 以独立的开发模式启动 CLI 包。
  - 管理所有进程的平滑关闭。

### `cli-dev.mts`

- **目的**: 一个专用脚本，用于在热重载开发模式下运行 `@ld/cli` 包。
- **命令**: `pnpm dev:cli`
- **逻辑**:
  - 执行 CLI 包的初始构建。
  - 使用 Node 启动 CLI。
  - 监视 `packages/cli/src` 目录中的文件更改。
  - 文件更改后，它会自动重新构建并重新启动 CLI 进程。

---

## 构建脚本

这些脚本处理框架模块的编译和打包。

### `build-all.mts`

- **目的**: 用于构建项目中所有包的主脚本。
- **命令**:
  - `pnpm build:all`: 按顺序构建所有包。
  - `pnpm build:prod`: 在生产模式下构建所有包（代码将被压缩）。
  - `pnpm build:fast`: 并行构建所有包，跳过测试和类型生成。
- **参数**:
  - `--skip-tests`: 在构建前跳过运行测试套件。
  - `--skip-types`: 跳过生成 TypeScript 声明文件。
  - `--parallel`: 并发构建所有包以加快构建速度。
  - `--production`: 设置 `NODE_ENV=production` 以启用代码压缩。
- **逻辑**:
  1.  （可选）运行整个测试套件 (`pnpm test`)。
  2.  （可选）生成类型声明 (`pnpm build:types`)。
  3.  按顺序（默认）或并行方式构建所有已定义的包。
  4.  打印构建结果的摘要表。

### `build.mts`

- **目的**: 一个使用 esbuild 构建单个指定包的底层脚本。
- **命令**: `pnpm build <package-name>` (例如, `pnpm build reactivity`)
- **逻辑**:
  - 为指定的包使用预定义的配置。
  - 调用 `esbuild` 来打包代码，如果在生产环境中则进行压缩，并生成 sourcemaps。
  - 成功构建后，它会运行 `tsc` 为该包生成相应的类型声明文件。

---

## 测试与质量保证

用于运行测试和确保代码质量的脚本。

### `test.mts`

- **目的**: 项目的标准测试运行器，由 Vitest 驱动。
- **命令**: `pnpm test`
- **参数**:
  - `--watch`: 在监视模式下运行测试。
  - `--ui`: 启动 Vitest UI。
  - `--coverage`: 生成代码覆盖率报告。
  - `--bench`: 运行基准测试文件而不是测试文件。
- **逻辑**:
  - 通过调用 `utils/get-active-packages.mts`（基于指导文件）智能地确定要测试的包。
  - 构建并执行带有适当参数的 `vitest` 命令。

### `test-ai.mts`

- **目的**: 一个专为 AI 代理设计的特殊测试运行器。它包装了标准测试运行器并输出结构化的 JSON 报告。
- **命令**: `pnpm test:ai`
- **参数**:
  - `--watch`, `--coverage`, `--ui`: 与标准测试运行器相同。
  - `[filters...]`: 可选的位置参数，用于在特定文件或目录上运行测试。
  - `--read-results`: 读取并打印上一次的 JSON 报告。
  - `--clean`: 删除上一次的 JSON 报告文件。
- **逻辑**:
  - 使用 `--reporter=json` 标志运行 Vitest。
  - 捕获 JSON 输出和 stderr。
  - 分析结果以创建标准化的 `AITestResult` 对象。
  - 将最终报告写入 `.ai-test-result.json`。

### `check.mts`

- **目的**: 一个全面的质量保证脚本，为一个或所有包运行 linting、类型检查和测试。
- **命令**:
  - `pnpm check`: 为所有包运行检查。
  - `pnpm check <package-name>`: 为单个包运行检查。
- **逻辑**:
  - 对于每个目标包，它会并行运行 `pnpm lint`, `npx tsc --noEmit`, 和 `pnpm test`。
  - 它还会计算测试覆盖率。
  - 汇总结果并打印每个包的质量状态摘要表。
  - 生成一个 `reports/quality-report.json` 文件。

---

## 分析与基准测试

用于性能和包大小分析的脚本。

### `benchmark.mts`

- **目的**: 一个动态基准测试运行器，使用 `tinybench` 执行性能测试。
- **命令**: `pnpm bench <module> [file_pattern]` (例如, `pnpm bench reactivity signal-creation`)
- **参数**:
  - `<module>` (必需): 要运行其基准测试的包的名称 (例如, `reactivity`)。
  - `[file_pattern]` (可选): 用于匹配特定基准测试文件的模式。
- **逻辑**:
  - 在指定模块的 `benchmarks` 目录中查找所有 `*.bench.ts` 文件。
  - 对于每个文件，它会动态导入它，运行导出的基准测试函数，并在表格中打印结果（ops/sec, 平均时间等）。

### `memory.mts`

- **目的**: 一个自动化脚本，用于测量不同框架功能的 JavaScript 堆内存使用情况。
- **命令**: `pnpm test:memory`
- **逻辑**:
  1.  发现在 `packages` 目录中的所有 `*.mem.ts` 文件。
  2.  启动一个临时的 Vite 服务器以即时编译这些测试文件。
  3.  对于每个测试文件，它会启动一个无头 Puppeteer 浏览器。
  4.  它测量基线内存，执行测试文件中的 `run()` 函数，并测量最终内存。
  5.  计算堆大小的增加，并在表格中报告结果。
  6.  将详细报告保存到 `statistics/memory-analysis.json`。

### `analyze.mts`

- **目的**: 分析每个包的最终构建产物的大小。
- **命令**: `pnpm analyze`
- **参数**:
  - `--filter <package-name>`: 仅分析特定的包。
  - `--json <output-path>`: 将结果输出到 JSON 文件。
- **逻辑**:
  - 在每个包的 `dist` 目录中查找所有 `.min.js` 或 `.min.mjs` 文件。
  - 计算每个包的原始大小、gzip 压缩大小和 brotli 压缩大小。
  - 从其 `package.json` 中读取包的依赖项。
  - 打印一个包含大小和依赖信息的摘要表。

---

## 发布与维护

用于框架版本控制和发布的脚本。

### `release.mts`

- **目的**: 一个用于管理整个发布过程的交互式脚本。
- **命令**: `pnpm release`
- **参数**:
  - `[version]` (可选): 特定的版本或版本升级类型 (`patch`, `minor`, `major`)。
  - `--dry-run`: 模拟整个过程，不进行任何实际更改。
  - `--skip-tests`, `--skip-build`, `--skip-git`, `--skip-publish`: 用于跳过特定步骤的标志。
- **逻辑**: 一个分步过程，包括：
  1.  如果未提供版本，则提示进行版本升级。
  2.  运行所有质量检查（lint, types, tests）。
  3.  在生产模式下构建所有包。
  4.  更新所有 `package.json` 文件中的 `version` 字段。
  5.  提交更改并创建一个 git 标签。
  6.  将所有公共包发布到 npm。
  7.  将提交和标签推送到 git 远程仓库。

---

## 工具与辅助脚本

供其他工具使用的内部脚本。

- **`ai-test-helper.mts`**: 为 AI 代理提供函数，用于读取和分析来自 `test-ai.mts` 的 JSON 测试报告并获取建议。
- **`utils/get-active-packages.mts`**: 一个由测试运行器使用的辅助脚本，用于读取指导文件并确定哪些包当前是活动的或已完成，从而应包含在测试运行中。
- **`vite-plugin-dev-console.mts`**: 一个自定义 Vite 插件，为开发面板创建 API 端点（`/api/packages`, `/api/package/:name`），以获取包信息和代码。

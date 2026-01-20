# 安装指南

## 本地开发安装

### 1. 安装依赖

```bash
cd packages/vscode-ld
pnpm install
```

### 2. 编译扩展

```bash
pnpm run compile
```

### 3. 在VS Code/Cursor中测试

1. 按 `F5` 打开扩展开发窗口
2. 在新窗口中打开一个`.ld`文件
3. 测试语法高亮、自动补全和格式化功能

## 打包安装

### 1. 打包扩展

```bash
pnpm run package
# 或
npm run package
```

> **注意**：打包脚本已默认使用 `--no-dependencies` 参数，这意味着：
> - 不会将 `node_modules` 中的依赖打包进 `.vsix` 文件
> - 不会检查依赖的原生模块构建（避免需要 Python/编译工具链）
> - 扩展会使用 VS Code/Cursor 环境中已安装的依赖（如 `@vue/compiler-sfc`、`prettier`）
> 
> 如果你的环境缺少 Python/编译工具链，这个配置可以避免依赖检查触发原生模块构建错误。

这会生成一个`.vsix`文件（例如：`ld-language-support-0.2.5.vsix`）。

### 2. 安装扩展

**重要提示：如果以管理员身份运行 Cursor/VS Code，可能会影响扩展的正常工作。**

#### 方法 A：通过命令面板安装（推荐）

在VS Code/Cursor中：

1. 打开命令面板（`Ctrl+Shift+P` 或 `Cmd+Shift+P`）
2. 输入 "Extensions: Install from VSIX..."
3. 选择生成的`.vsix`文件

#### 方法 B：如果以管理员身份运行（推荐使用开发模式）

如果以管理员身份运行导致扩展无法正常工作，建议使用开发模式：

1. 在 Cursor/VS Code 中打开扩展项目文件夹：`packages/vscode-ld`
2. 按 `F5` 启动扩展开发主机
3. 在新打开的窗口中测试扩展功能
4. 或者，退出管理员模式，以普通用户身份运行 Cursor/VS Code

#### 方法 C：手动安装到用户目录

如果必须使用管理员模式，可以手动将扩展安装到用户目录：

1. 解压 `.vsix` 文件（它是一个 ZIP 文件）
2. 将解压后的内容复制到用户扩展目录：
   - Windows: `%USERPROFILE%\.cursor\extensions\ld-framework.ld-language-support-0.2.5\`
   - 或: `C:\Users\<你的用户名>\.cursor\extensions\ld-framework.ld-language-support-0.2.5\`
3. 重新加载 Cursor 窗口

## 发布到市场（可选）

如果需要发布到VS Code市场：

1. 安装 `@vscode/vsce`: `npm install -g @vscode/vsce`
   - 或者使用项目本地安装：`pnpm install`（已在 devDependencies 中）
2. 登录: `vsce login <publisher-name>`
3. 发布: `pnpm run publish` 或 `npx @vscode/vsce publish`

注意：发布需要Azure DevOps账号和发布者账号。详细步骤请参考 [PUBLISH.md](./PUBLISH.md)。

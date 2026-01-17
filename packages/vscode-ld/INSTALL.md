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
```

这会生成一个`.vsix`文件。

### 2. 安装扩展

在VS Code/Cursor中：

1. 打开命令面板（`Ctrl+Shift+P` 或 `Cmd+Shift+P`）
2. 输入 "Extensions: Install from VSIX..."
3. 选择生成的`.vsix`文件

## 发布到市场（可选）

如果需要发布到VS Code市场：

1. 安装 `vsce`: `npm install -g vsce`
2. 登录: `vsce login <publisher-name>`
3. 发布: `vsce publish`

注意：发布需要Azure DevOps账号和发布者账号。

# LD Language Support

VS Code/Cursor扩展，为`.ld`文件提供完整的开发支持，包括语法高亮、代码格式化、智能提示和错误检测。

## ✨ 功能特性

### 核心功能

- 🎨 **语法高亮**：完整的`.ld`文件语法高亮支持
  - Vue3 Composition API高亮
  - React Hooks高亮
  - LD Signal API高亮
  - Template、Script、Style块区分

- 🔧 **代码格式化**：智能代码格式化
  - Prettier集成（可选）
  - 分段格式化（template、script、style分别处理）
  - 可配置缩进和格式选项

- 💡 **智能提示**：强大的自动补全
  - Vue3 API自动补全（ref、computed、watch等）
  - React Hooks自动补全（useState、useEffect等）
  - LD Signal API自动补全
  - 模板指令补全（v-if、v-for等）

- 📝 **代码片段**：快速生成常用代码
  - 完整的LD组件结构
  - Vue3和React常用模式
  - LD Signal API模式

- 🔍 **错误检测**：实时诊断
  - 未闭合标签检测
  - CSS语法错误检测
  - Vue3/React混合使用提示
  - 结构完整性检查

- 📖 **悬停提示**：详细的API文档
  - API使用说明
  - 代码示例
  - 参数说明

- 🎯 **文件图标**：专用`.ld`文件图标

## 📦 安装

### 从VS Code市场安装（发布后）

1. 打开VS Code/Cursor
2. 打开扩展面板（`Ctrl+Shift+X`）
3. 搜索 "LD Language Support"
4. 点击安装

### 本地安装（开发）

```bash
# 1. 进入扩展目录
cd packages/vscode-ld

# 2. 安装依赖
pnpm install

# 3. 编译
pnpm run compile

# 4. 在VS Code/Cursor中按F5启动扩展开发窗口
```

### 从VSIX安装

```bash
# 打包
pnpm run package

# 然后在VS Code/Cursor中：
# 1. 打开命令面板（Ctrl+Shift+P）
# 2. 输入 "Extensions: Install from VSIX..."
# 3. 选择生成的.vsix文件
```

## 🚀 使用

### 基本使用

1. 创建或打开一个`.ld`文件
2. 享受语法高亮和自动补全
3. 使用 `Shift+Alt+F` 格式化文件
4. 查看实时错误提示

### 代码片段

输入以下前缀触发代码片段：

- `template` - 生成template块
- `script` - 生成script setup块
- `style` - 生成style块
- `ld-component` - 生成完整组件结构
- `ref` - Vue3 ref声明
- `useState` - React useState声明
- `createSignal` - LD Signal声明

### 配置选项

在VS Code/Cursor设置中可以配置：

```json
{
  "ld.format.enable": true,           // 启用格式化
  "ld.format.indentSize": 2,          // 缩进大小
  "ld.format.insertSpaces": true,      // 使用空格缩进
  "ld.format.usePrettier": true,      // 使用Prettier格式化
  "ld.completion.enable": true,       // 启用自动补全
  "ld.diagnostics.enable": true       // 启用错误检测
}
```

## 📚 支持的语法

### Vue3 Composition API

- `ref()` - 响应式引用
- `reactive()` - 响应式对象
- `computed()` - 计算属性
- `watch()` / `watchEffect()` - 监听器
- `onMounted()` / `onUnmounted()` - 生命周期钩子

### React Hooks

- `useState()` - 状态管理
- `useEffect()` - 副作用处理
- `useMemo()` - 记忆化计算
- `useCallback()` - 记忆化回调
- `useRef()` - 引用对象

### LD Signal API

- `createSignal()` - 创建Signal
- `createComputed()` - 创建计算值
- `createEffect()` - 创建副作用
- `createReactive()` - 创建响应式对象

## 🛠️ 开发

### 项目结构

```
packages/vscode-ld/
├── src/                    # 源代码
│   ├── extension.ts       # 扩展入口
│   ├── formatter.ts       # 基础格式化器
│   ├── prettier-formatter.ts  # Prettier格式化器
│   ├── completion.ts      # 自动补全
│   ├── hover.ts           # 悬停提示
│   └── diagnostics.ts     # 错误检测
├── syntaxes/              # 语法高亮规则
├── snippets/              # 代码片段
├── icons/                 # 文件图标
└── package.json           # 扩展配置
```

### 开发命令

```bash
# 编译
pnpm run compile

# 监听模式
pnpm run watch

# 打包
pnpm run package

# 发布（需要登录）
pnpm run publish
```

### 调试

1. 在VS Code/Cursor中打开扩展项目
2. 按 `F5` 启动扩展开发窗口
3. 在新窗口中打开`.ld`文件测试

## 📝 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本更新历史。

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [LD框架文档](https://github.com/fat-guy-coder/LD)
- [VS Code扩展API文档](https://code.visualstudio.com/api)
- [发布指南](./PUBLISH.md)

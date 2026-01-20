# 发布指南

## 发布到VS Code市场

### 前置要求

1. **Azure DevOps账号**
   - 访问 https://dev.azure.com 注册账号
   - 如果没有账号，需要先注册

2. **发布者账号（Publisher Account）**
   - 访问 https://marketplace.visualstudio.com/manage
   - 使用Azure DevOps账号登录
   - 创建发布者（Publisher）
   - 记录发布者ID（例如：`ld-framework`）

3. **Personal Access Token (PAT)**
   - 在Azure DevOps中创建PAT
   - 权限需要包含：Marketplace (Manage)
   - 记录PAT（只显示一次，请妥善保存）

### 发布步骤

#### 1. 更新package.json

确保 `package.json` 中的发布者信息正确：

```json
{
  "publisher": "ld-framework",  // 你的发布者ID
  "name": "ld-language-support",
  "displayName": "LD Language Support",
  "version": "0.1.0"
}
```

#### 2. 安装 @vscode/vsce

```bash
npm install -g @vscode/vsce
```

或者使用项目本地安装（推荐）：

```bash
cd packages/vscode-ld
pnpm install
```

#### 3. 登录

```bash
vsce login <publisher-id>
# 例如: vsce login ld-framework
```

输入你的Personal Access Token。

#### 4. 打包

```bash
cd packages/vscode-ld
pnpm run compile
pnpm run package
# 或者直接使用: npx @vscode/vsce package --no-dependencies
```

这会生成一个 `.vsix` 文件。

#### 5. 发布

**首次发布：**

```bash
pnpm run publish
# 或者直接使用: npx @vscode/vsce publish
```

**更新版本：**

1. 更新 `package.json` 中的 `version`
2. 更新 `CHANGELOG.md`
3. 运行：

```bash
pnpm run publish
# 或者直接使用: npx @vscode/vsce publish
```

### 发布到Open VSX Registry（可选）

Open VSX是一个开源的VS Code扩展市场：

```bash
# 安装ovsx
npm install -g @vscode/ovsx

# 发布
ovsx publish -p <your-personal-access-token>
```

### 本地安装测试

在发布前，可以先本地安装测试：

```bash
# 打包
pnpm run package
# 或者: npx @vscode/vsce package --no-dependencies

# 在VS Code中安装
# 1. 打开命令面板 (Ctrl+Shift+P)
# 2. 输入 "Extensions: Install from VSIX..."
# 3. 选择生成的 .vsix 文件
```

### 版本号规则

遵循 [语义化版本](https://semver.org/)：

- **主版本号（Major）**：不兼容的API修改
- **次版本号（Minor）**：向下兼容的功能性新增
- **修订号（Patch）**：向下兼容的问题修正

### 注意事项

1. **首次发布需要审核**：可能需要1-2个工作日
2. **更新版本**：通常几分钟内生效
3. **版本号必须递增**：不能发布比当前版本更低的版本
4. **README.md很重要**：这是用户在市场中看到的第一印象
5. **图标和截图**：建议添加扩展图标和功能截图

### 发布检查清单

- [ ] 更新版本号
- [ ] 更新CHANGELOG.md
- [ ] 确保README.md完整
- [ ] 测试扩展功能
- [ ] 打包测试（pnpm run package）
- [ ] 本地安装测试
- [ ] 登录（vsce login）
- [ ] 发布（pnpm run publish）

### 常见问题

**Q: 发布失败，提示权限不足？**
A: 检查PAT权限是否包含Marketplace (Manage)

**Q: 版本号已存在？**
A: 版本号必须递增，不能重复使用

**Q: 如何撤销发布？**
A: 在marketplace.visualstudio.com中取消发布，但已安装的用户不会自动卸载

**Q: 如何更新扩展描述？**
A: 修改package.json中的description，然后发布新版本

### 发布后

发布成功后：

1. 访问 https://marketplace.visualstudio.com/items?itemName=ld-framework.ld-language-support
2. 检查扩展页面是否正确显示
3. 分享扩展链接给用户

## 快速发布命令

```bash
# 完整流程
cd packages/vscode-ld
pnpm run compile
pnpm run package
pnpm run publish
```

## 需要帮助？

如果遇到问题，可以：

1. 查看VS Code扩展发布文档：https://code.visualstudio.com/api/working-with-extensions/publishing-extension
2. 查看 @vscode/vsce 文档：https://github.com/microsoft/vscode-vsce
3. 检查VS Code扩展市场FAQ

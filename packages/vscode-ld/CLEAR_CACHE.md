# 清除扩展缓存指南

如果扩展无法正常激活或出现缓存问题，请按照以下步骤清除缓存：

## Windows 系统

### 方法 1：清除 Cursor 扩展缓存

1. **关闭 Cursor**
   - 完全退出 Cursor（确保所有窗口都关闭）

2. **删除扩展缓存目录**
   
   打开文件资源管理器，删除以下目录：
   
   ```
   C:\Users\Administrator\.cursor\extensions\ld-framework.ld-language-support-*
   ```
   
   或者删除整个扩展目录：
   ```
   C:\Users\Administrator\.cursor\extensions\
   ```
   （注意：这会删除所有扩展，请谨慎操作）

3. **清除扩展主机缓存**
   
   删除以下目录：
   ```
   C:\Users\Administrator\.cursor\CachedExtensions\
   ```

4. **清除工作区存储**
   
   删除以下目录：
   ```
   C:\Users\Administrator\.cursor\User\workspaceStorage\
   ```

5. **重新启动 Cursor**
   - 重新打开 Cursor
   - 重新安装扩展

### 方法 2：使用命令行清除（PowerShell）

以管理员身份运行 PowerShell，执行以下命令：

```powershell
# 停止所有 Cursor 进程
Get-Process | Where-Object {$_.ProcessName -like "*cursor*"} | Stop-Process -Force

# 删除扩展目录
Remove-Item -Path "$env:USERPROFILE\.cursor\extensions\ld-framework.ld-language-support-*" -Recurse -Force -ErrorAction SilentlyContinue

# 删除扩展缓存
Remove-Item -Path "$env:USERPROFILE\.cursor\CachedExtensions" -Recurse -Force -ErrorAction SilentlyContinue

# 删除工作区存储
Remove-Item -Path "$env:USERPROFILE\.cursor\User\workspaceStorage" -Recurse -Force -ErrorAction SilentlyContinue

# 重新启动 Cursor
Start-Process "cursor"
```

### 方法 3：完全重置 Cursor 配置

如果以上方法都不行，可以完全重置 Cursor：

1. 关闭 Cursor
2. 删除整个 `.cursor` 目录：
   ```
   C:\Users\Administrator\.cursor\
   ```
3. 重新启动 Cursor（会重新初始化所有配置）

## 验证缓存已清除

清除缓存后，重新安装扩展：

1. 按 `Ctrl+Shift+P`
2. 输入 `Extensions: Install from VSIX...`
3. 选择 `ld-language-support-0.2.5.vsix`
4. 重新加载窗口（`Ctrl+Shift+P` → `Developer: Reload Window`）

## 检查扩展是否正常激活

1. 按 `Ctrl+Shift+P` → `Output: Show Output Channels...`
2. 选择 `Log (Extension Host)`
3. 查看是否有 "LD Language Support扩展已激活" 的日志
4. 不应该看到 "filename undefined" 错误

## 如果问题仍然存在

如果清除缓存后问题仍然存在，请：

1. 使用开发模式测试（按 F5）
2. 检查是否以管理员身份运行（建议以普通用户身份运行）
3. 查看完整的错误日志并报告问题

# TODO: Flutter Assets Generator for VSCode

**版本**: v1.0
**创建日期**: 2025-11-14
**参考文档**: docs/PRD_FINAL.md

---

## 开发优先级说明

本文档列出 v1.0 开发所需的所有核心功能。**所有功能均为 P0 级别**，按实施顺序组织。

---

## 阶段 1: 项目基础设施

### 1.1 项目初始化
- [ ] 使用 `yo code` 创建 VSCode 插件项目
- [ ] 配置 TypeScript 编译环境
- [ ] 配置 ESLint + Prettier
- [ ] 初始化 Git 仓库
- [ ] 配置 `.gitignore`

### 1.2 依赖安装
- [ ] 安装 `vscode` 类型定义
- [ ] 安装 `chokidar` (文件监听)
- [ ] 安装 `js-yaml` (YAML 解析)
- [ ] 安装 `lodash` (工具函数，包含 debounce)
- [ ] 安装测试框架: `jest`, `@types/jest`
- [ ] 安装集成测试: `@vscode/test-electron`

### 1.3 项目结构搭建
- [ ] 创建 `src/` 目录结构
  - `src/commands/` - 命令实现
  - `src/core/` - 核心业务逻辑
  - `src/utils/` - 工具函数
  - `src/providers/` - VSCode Provider
  - `src/config/` - 配置管理
  - `src/types/` - TypeScript 类型定义
- [ ] 创建 `test/` 目录结构
  - `test/unit/` - 单元测试
  - `test/integration/` - 集成测试
  - `test/fixtures/` - 测试数据

---

## 阶段 2: 配置系统

### 2.1 配置读取
- [ ] 实现 `ConfigManager` 类
- [ ] 读取 `pubspec.yaml` 中的 `flutter_assets_generator` 配置
- [ ] 解析配置项:
  - `output_dir` (默认: "generated")
  - `output_filename` (默认: "assets")
  - `auto_detection` (默认: true)
  - `class_name` (默认: "Assets")
  - `naming_style` (默认: "camelCase")
  - `named_with_parent` (默认: true)
  - `filename_split_pattern` (默认: "[-_]")
  - `leading_with_package_name` (默认: false)
  - `path_ignore` (默认: [])
- [ ] 配置验证和默认值填充
- [ ] 错误处理: YAML 格式错误

### 2.2 VSCode 用户设置
- [ ] 在 `package.json` 中定义用户设置:
  - `flutter-assets-generator.enableAutoGeneration` (默认: true)
  - `flutter-assets-generator.showNotifications` (默认: true)
  - `flutter-assets-generator.enableHover` (默认: true)
- [ ] 实现用户设置读取逻辑

### 2.3 配置文件定位
- [ ] 实现 `findPubspecYaml()` - 在工作区查找 pubspec.yaml
- [ ] 支持 Multi-root Workspace
- [ ] 实现 `findAllFlutterProjects()` - 查找所有 Flutter 项目

---

## 阶段 3: 核心功能 - 资源扫描

### 3.1 文件扫描
- [ ] 实现 `AssetScanner` 类
- [ ] 读取 `pubspec.yaml` 中的 `flutter.assets` 路径
- [ ] 递归扫描每个资源路径下的所有文件
- [ ] 收集资源文件列表 (路径 + 文件名)

### 3.2 文件过滤
- [ ] 实现自动忽略规则:
  - 以 `.` 开头的隐藏文件/文件夹
  - Flutter 密度变体目录: `2.0x/`, `3.0x/`, `Mx/`, `Nx/`
- [ ] 实现用户自定义忽略规则:
  - 解析 `path_ignore` 配置
  - 支持目录匹配 (以 `/` 结尾)
  - 支持文件匹配
- [ ] 记录被忽略的文件数量 (用于调试)

### 3.3 资源路径处理
- [ ] 实现路径归一化 (处理 Windows/Unix 路径分隔符)
- [ ] 计算相对于项目根目录的路径
- [ ] 处理 `leading_with_package_name` 配置:
  - 读取 `pubspec.yaml` 中的 `name` 字段
  - 如果启用，添加 `packages/{name}/` 前缀

---

## 阶段 4: 核心功能 - 命名转换

### 4.1 文件名预处理
- [ ] 实现 `preprocessFilename()` 函数
- [ ] 步骤 1: 移除文件扩展名
- [ ] 步骤 2: 删除 `@` 符号
- [ ] 步骤 3: 将 `.` 替换为 `_`
- [ ] 步骤 4: 应用 `filename_split_pattern` 分割
- [ ] 步骤 5: 处理数字开头的文件名 (添加 `n` 前缀)

### 4.2 命名风格转换
- [ ] 实现 `toCamelCase()` 函数
- [ ] 将分割后的单词数组转为小驼峰格式
- [ ] 第一个单词小写，后续单词首字母大写
- [ ] 处理空字符串和特殊情况

### 4.3 父目录命名
- [ ] 实现 `applyParentNaming()` 函数
- [ ] 如果 `named_with_parent: true`:
  - 提取父目录名
  - 将父目录名转为 camelCase
  - 拼接: `{parentDir}{FileName}`
- [ ] 如果仍有冲突，添加祖父目录名

### 4.4 命名冲突检测
- [ ] 实现 `detectConflicts()` 函数
- [ ] 使用 Map 存储 `constantName -> filePath` 映射
- [ ] 检测重复的常量名
- [ ] 生成冲突警告信息
- [ ] 记录到 OUTPUT 面板

### 4.5 常量名生成
- [ ] 实现 `generateConstantName()` 主函数
- [ ] 整合所有命名转换逻辑
- [ ] 返回最终的常量名

---

## 阶段 5: 核心功能 - 代码生成

### 5.1 Dart 代码生成
- [ ] 实现 `CodeGenerator` 类
- [ ] 生成文件头注释: `/// Generated file. Do not edit.`
- [ ] 生成类定义: `class {className} {`
- [ ] 生成私有构造函数: `{className}._();`
- [ ] 为每个资源生成常量:
  - `static const String {constantName} = '{filePath}';`
- [ ] 如果有冲突，添加警告注释:
  - `// Warning: Duplicate name, previous definition overridden`
- [ ] 生成类结尾: `}`

### 5.2 文件写入
- [ ] 实现 `writeGeneratedFile()` 函数
- [ ] 计算输出路径: `lib/{output_dir}/{output_filename}.dart`
- [ ] 创建输出目录 (如果不存在)
- [ ] 写入生成的代码
- [ ] 错误处理: 写入权限不足

### 5.3 生成流程编排
- [ ] 实现 `generateAssets()` 主函数
- [ ] 流程:
  1. 读取配置
  2. 扫描资源文件
  3. 过滤文件
  4. 生成常量名
  5. 检测冲突
  6. 生成 Dart 代码
  7. 写入文件
- [ ] 显示进度提示 (VSCode Progress API)
- [ ] 显示成功/失败通知

---

## 阶段 6: 文件监听

### 6.1 文件监听实现
- [ ] 实现 `AssetWatcher` 类
- [ ] 使用 `chokidar` 监听资源路径
- [ ] 配置监听选项:
  - `ignored: /(^|[\/\\])\../` (忽略隐藏文件)
  - `ignoreInitial: true` (初始扫描不触发)
  - `awaitWriteFinish` (等待文件写入完成)
- [ ] 监听事件: `add`, `unlink`, `change`

### 6.2 防抖处理
- [ ] 使用 `lodash.debounce` 实现 300ms 防抖
- [ ] 避免频繁触发生成
- [ ] 批量处理多个文件变化

### 6.3 监听控制
- [ ] 实现 `start()` 方法 - 启动监听
- [ ] 实现 `stop()` 方法 - 停止监听
- [ ] 根据 `auto_detection` 配置控制启动/停止
- [ ] 在插件激活时自动启动 (如果启用)
- [ ] 在插件停用时自动停止

---

## 阶段 7: VSCode 命令

### 7.1 命令注册
- [ ] 在 `package.json` 中注册命令:
  - `flutter-assets-generator.generate` - 手动触发生成
  - `flutter-assets-generator.generateAll` - 为所有项目生成
  - `flutter-assets-generator.addToAssets` - 右键菜单添加
  - `flutter-assets-generator.showIgnored` - 显示被忽略的文件
  - `flutter-assets-generator.openDocs` - 打开文档

### 7.2 命令实现
- [ ] 实现 `generateCommand()`:
  - 查找当前活动文件所在的 Flutter 项目
  - 调用 `generateAssets()`
  - 显示结果通知
- [ ] 实现 `generateAllCommand()`:
  - 查找所有 Flutter 项目
  - 遍历调用 `generateAssets()`
  - 显示汇总结果
- [ ] 实现 `addToAssetsCommand()`:
  - 获取右键点击的文件/文件夹 URI
  - 判断是文件还是文件夹
  - 计算相对路径
  - 读取 pubspec.yaml
  - 添加路径到 `flutter.assets` 数组
  - 去重和排序
  - 保留 YAML 格式写回文件
  - 触发生成
- [ ] 实现 `showIgnoredCommand()`:
  - 扫描并收集被忽略的文件
  - 在新文档中展示列表
- [ ] 实现 `openDocsCommand()`:
  - 打开在线文档链接

---

## 阶段 8: 右键菜单

### 8.1 菜单配置
- [ ] 在 `package.json` 中配置 `menus.explorer/context`:
  - 命令: `flutter-assets-generator.addToAssets`
  - 显示条件: `explorerResourceIsFolder || resourceExtname =~ /\.(png|jpg|jpeg|gif|webp|svg|ttf|otf|mp3|mp4|json)$/`
  - 分组: `flutter@1`

### 8.2 路径智能处理
- [ ] 检测选中的是文件还是文件夹
- [ ] 文件夹: 添加 `assets/images/` (带尾部斜杠)
- [ ] 文件: 添加 `assets/icon.png` (不带斜杠)
- [ ] 检查路径是否已存在
- [ ] 自动去除重复路径

### 8.3 YAML 修改
- [ ] 实现 `updatePubspecYaml()` 函数
- [ ] 使用正则表达式局部修改 (保留格式和注释)
- [ ] 在 `flutter.assets` 数组中插入新路径
- [ ] 保持原有缩进和格式
- [ ] 错误处理: 没有 `flutter:` 节点的情况

---

## 阶段 9: 可视化功能 - Hover 提示

### 9.1 Hover Provider 实现
- [ ] 实现 `AssetHoverProvider` 类
- [ ] 注册 Hover Provider: `vscode.languages.registerHoverProvider('dart', ...)`
- [ ] 在 `provideHover()` 中:
  - 检测光标位置的单词是否匹配 `Assets.\w+` 模式
  - 解析常量名，查找对应的资源文件路径
  - 读取文件信息 (大小、类型)
  - 生成 Hover 内容:
    - 显示文件路径
    - 显示文件大小
    - 显示文件类型
    - 提供"打开文件"链接

### 9.2 资源路径解析
- [ ] 实现 `resolveAssetPath()` 函数
- [ ] 根据常量名反向查找资源文件路径
- [ ] 处理 `named_with_parent` 的情况
- [ ] 返回绝对文件路径

### 9.3 配置控制
- [ ] 根据 `enableHover` 配置控制是否启用
- [ ] 在用户设置中提供开关

---

## 阶段 10: 可视化功能 - 点击跳转

### 10.1 Definition Provider 实现
- [ ] 实现 `AssetDefinitionProvider` 类
- [ ] 注册 Definition Provider: `vscode.languages.registerDefinitionProvider('dart', ...)`
- [ ] 在 `provideDefinition()` 中:
  - 检测光标位置的单词是否匹配 `Assets.\w+`
  - 解析常量名，查找资源文件路径
  - 返回 `vscode.Location` 指向资源文件

### 10.2 跳转逻辑
- [ ] 支持 `Cmd+Click` (Mac) / `Ctrl+Click` (Win) 跳转
- [ ] 在新标签页打开资源文件
- [ ] 错误处理: 文件不存在的情况

---

## 阶段 11: 多模块支持

### 11.1 项目检测
- [ ] 实现 `findAllFlutterProjects()` 函数
- [ ] 获取所有工作区根目录: `vscode.workspace.workspaceFolders`
- [ ] 递归搜索 `pubspec.yaml`: `vscode.workspace.findFiles()`
- [ ] 解析每个 `pubspec.yaml`，检查是否包含 `flutter:` 节点
- [ ] 返回 Flutter 项目列表

### 11.2 多项目生成
- [ ] 实现 `generateForAllProjects()` 函数
- [ ] 遍历所有 Flutter 项目
- [ ] 为每个项目独立调用 `generateAssets()`
- [ ] 显示汇总结果: `Generated assets for N Flutter project(s)`

### 11.3 当前项目识别
- [ ] 实现 `getCurrentFlutterProject()` 函数
- [ ] 根据当前活动文件路径识别所属项目
- [ ] 返回对应的 Flutter 项目

---

## 阶段 12: 错误处理和通知

### 12.1 错误处理
- [ ] 实现全局错误捕获
- [ ] 错误类型:
  - `pubspec.yaml` 格式错误
  - 资源路径不存在
  - 文件写入权限不足
  - YAML 解析失败
  - 文件名包含非法字符
- [ ] 友好的错误提示:
  - 使用 `vscode.window.showErrorMessage()`
  - 提供错误原因和解决建议
  - 包含相关文档链接

### 12.2 OUTPUT 面板
- [ ] 创建 OUTPUT 通道: `vscode.window.createOutputChannel('Flutter Assets Generator')`
- [ ] 记录关键操作:
  - 开始生成
  - 扫描到的文件数量
  - 被忽略的文件数量
  - 生成的常量数量
  - 命名冲突警告
  - 错误详情和堆栈
- [ ] 提供调试信息

### 12.3 用户通知
- [ ] 成功通知: `✅ Assets generated successfully`
- [ ] 失败通知: `❌ Failed to generate assets: {reason}`
- [ ] 警告通知: `⚠️ Duplicate asset name detected`
- [ ] 根据 `showNotifications` 配置控制是否显示

---

## 阶段 13: 测试

### 13.1 单元测试
- [ ] 测试 `toCamelCase()` - 命名转换
  - 测试 `snake_case` → `camelCase`
  - 测试 `@` 符号处理
  - 测试 `.` 替换为 `_`
  - 测试数字开头
- [ ] 测试 `preprocessFilename()` - 文件名预处理
- [ ] 测试 `generateConstantName()` - 常量名生成
  - 测试基础命名
  - 测试 `named_with_parent`
  - 测试冲突解决
- [ ] 测试 `ConfigManager` - 配置读取
  - 测试默认值
  - 测试配置验证
- [ ] 测试 `AssetScanner` - 文件扫描
  - 测试文件过滤
  - 测试路径归一化
- [ ] 目标覆盖率: > 80%

### 13.2 集成测试
- [ ] 创建测试工作区 (临时目录)
- [ ] 测试完整生成流程:
  - 创建 `pubspec.yaml`
  - 创建资源文件
  - 触发生成命令
  - 验证生成的 Dart 文件内容
- [ ] 测试文件监听:
  - 添加新文件 → 重新生成
  - 删除文件 → 重新生成
  - 修改文件 → 重新生成
- [ ] 测试多模块支持:
  - 创建多根工作区
  - 验证为每个项目生成
- [ ] 测试错误处理:
  - YAML 格式错误
  - 路径不存在
  - 权限不足

### 13.3 性能测试
- [ ] 测试生成 100 个资源文件 < 500ms
- [ ] 测试生成 1000 个资源文件 < 2s
- [ ] 测试生成 5000 个资源文件 < 10s
- [ ] 测试防抖机制 (300ms)

---

## 阶段 14: 文档

### 14.1 README.md
- [ ] **快速开始** (5 分钟上手):
  - 安装插件
  - 配置 `pubspec.yaml`
  - 运行生成命令
  - 使用生成的常量
- [ ] **配置参考**:
  - 完整配置项列表
  - 每个配置项的说明和示例
  - 常见配置组合
- [ ] **命名规范详解**:
  - 文件名预处理规则
  - 命名冲突解决策略
  - 最佳实践
- [ ] **常见问题**:
  - 为什么生成的常量名不符合预期?
  - 如何忽略某些文件?
  - 多模块项目如何使用?
  - 与 Android Studio 插件的差异
- [ ] **故障排查**:
  - 常见错误及解决方案
  - 如何查看详细日志
  - 如何报告 bug
- [ ] 添加截图和 GIF 演示

### 14.2 CHANGELOG.md
- [ ] 创建 CHANGELOG.md
- [ ] 记录 v1.0.0 的所有功能

### 14.3 示例项目
- [ ] **minimal-example** (最小示例):
  - `pubspec.yaml` (最简配置)
  - `assets/icon.png`
  - `lib/main.dart` (演示如何使用)
  - `lib/generated/assets.dart` (生成结果)
- [ ] **multi-directory-example** (多目录示例):
  - `assets/images/`, `assets/icons/`, `assets/fonts/`, `assets/audio/`
  - 演示 `named_with_parent` 效果
- [ ] **advanced-example** (高级配置示例):
  - 自定义分割规则
  - 路径忽略
  - 父目录命名
- [ ] **package-example** (Flutter Package 示例):
  - 展示 `leading_with_package_name: true` 的用法

---

## 阶段 15: 发布准备

### 15.1 package.json 完善
- [ ] 填写元数据:
  - `name`: `flutter-assets-generator`
  - `displayName`: `Flutter Assets Generator`
  - `description`: 插件描述
  - `version`: `1.0.0`
  - `publisher`: 发布者名称
  - `repository`: GitHub 仓库链接
  - `keywords`: `flutter`, `assets`, `generator`, `dart`
  - `categories`: `Other`
  - `icon`: 插件图标 (128x128)
- [ ] 配置激活事件: `onLanguage:dart`, `workspaceContains:**/pubspec.yaml`
- [ ] 配置引擎版本: `^1.75.0`

### 15.2 许可证和协议
- [ ] 添加 `LICENSE` 文件 (MIT)
- [ ] 在 `package.json` 中声明许可证

### 15.3 图标和截图
- [ ] 设计插件图标 (128x128)
- [ ] 准备功能截图 (至少 3 张)
- [ ] 录制功能演示 GIF

### 15.4 质量检查
- [ ] 所有测试通过
- [ ] 单元测试覆盖率 > 80%
- [ ] 在 Windows/macOS/Linux 上手动测试
- [ ] 性能指标达标
- [ ] 文档审查完成
- [ ] 代码审查完成

### 15.5 打包和发布
- [ ] 使用 `vsce package` 打包插件
- [ ] 测试 `.vsix` 文件安装
- [ ] 发布到 VSCode Marketplace: `vsce publish`
- [ ] 创建 GitHub Release
- [ ] 发布到社区 (Reddit, Twitter, Medium)

---

## 进度追踪

**总任务数**: 约 200+ 项
**已完成**: 0 项
**进度**: 0%

**预计时间**: 4-6 周

---

## 开发顺序建议

1. **第 1 周**: 阶段 1-4 (项目基础 + 配置 + 扫描 + 命名)
2. **第 2 周**: 阶段 5-7 (代码生成 + 文件监听 + 命令)
3. **第 3 周**: 阶段 8-11 (右键菜单 + 可视化 + 多模块)
4. **第 4 周**: 阶段 12-13 (错误处理 + 测试)
5. **第 5 周**: 阶段 14 (文档和示例)
6. **第 6 周**: 阶段 15 (发布准备)

---

## 关键里程碑

- [ ] **Milestone 1**: 核心生成功能可用 (阶段 1-5)
- [ ] **Milestone 2**: 文件监听和命令完成 (阶段 6-7)
- [ ] **Milestone 3**: 完整功能实现 (阶段 8-11)
- [ ] **Milestone 4**: 测试和文档完成 (阶段 12-14)
- [ ] **Milestone 5**: v1.0 发布 (阶段 15)

---

**注意**: 本 TODO 列表基于 PRD_FINAL.md 生成，所有功能均为 P0 优先级，需严格按顺序实施。

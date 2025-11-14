# PRD 文档评审 - 补充建议

**评审日期**: 2025-11-13
**评审人**: Claude Code Assistant

---

## 总体评价

PRD_REVIEW.md 已经做了非常出色的评审工作，本文档作为补充，提供一些额外的建议和不同视角的观点。

---

## 1. 配置层级设计 - 强烈建议简化

### 对应 PRD_REVIEW 问题 #3

**我的立场**: 强烈支持**方案 A**（删除 `.vscode/settings.json` 覆盖功能）

**额外理由**:

1. **团队协作一致性**:
   - 如果允许个人通过 `.vscode/settings.json` 自定义前缀，会导致不同团队成员生成的代码不一致
   - 这违背了代码生成工具的核心价值：**确保自动生成的代码在团队中保持一致**

2. **Git 冲突风险**:
   - 如果 `.vscode/settings.json` 被提交到 Git，个人配置会污染团队设置
   - 如果 `.vscode/settings.json` 被 `.gitignore`，每个人的配置不同会导致 PR diff 混乱

3. **认知负担**:
   - 当生成的常量名不符合预期时，开发者需要检查多个位置
   - 新成员加入团队时学习成本增加

**行动建议**:
- 删除 PRD 第 72-90 行的"工作区覆盖配置"章节
- 在 PRD 第 48 行后添加设计原则说明：

```markdown
#### 3.3. 配置文件设计原则

**核心原则**: 所有影响生成代码的配置必须在 `pubspec.yaml` 中定义，确保团队成员生成一致的代码。

**配置层级** (优先级从高到低):
1. **项目配置** (`pubspec.yaml` 的 `flutter_assets_generator` 节)
   - 提交到 Git，团队共享
   - 影响生成的代码内容

2. **用户全局配置** (VSCode User Settings)
   - 仅影响插件行为（如是否启用自动生成、通知设置等）
   - 不影响生成的代码内容
   - 示例配置项:
     ```json
     {
       "flutter-assets-generator.enableAutoGeneration": true,
       "flutter-assets-generator.showNotifications": true
     }
     ```

**为什么不支持工作区级覆盖？**
- 避免团队成员生成不一致的代码
- 减少配置复杂度和认知负担
- 如需自定义前缀，直接调整目录结构即可
```

---

## 2. 命名风格功能范围 - 务实建议

### 对应 PRD_REVIEW 问题 #1

**我的立场**: 支持**方案 A**，但建议保留配置字段

**实施方案**:

在 PRD 第 36 行修改为：

```markdown
### 3.2. 资源命名规范

#### 3.2.1. 命名风格配置

**v1.0 版本说明**:
- 当前版本仅实现 `camelCase` 命名风格（与原 Android Studio 插件保持一致）
- `snake_case` 和 `PascalCase` 已列入未来规划（见第 6 节）

**配置项**:
```yaml
flutter_assets_generator:
  # 命名风格 (v1.0 仅支持 camelCase)
  naming_style: camelCase
```

**生成示例**:
```dart
// 文件: assets/images/home_icon.png
// 生成: static const String imagesHomeIcon = 'assets/images/home_icon.png';
```

**常量命名转换规则** (camelCase):
- 移除文件扩展名
- 将分隔符 (默认 `-` 和 `_`) 分割的单词转为小驼峰
- 第一个单词小写，后续单词首字母大写
- 示例:
  - `home_icon.png` → `homeIcon`
  - `user-profile.png` → `userProfile`
  - `404-page.png` → `n404Page` (数字开头自动添加 `n` 前缀)
```

**优点**:
1. 保留配置字段，未来扩展时无需修改配置结构
2. 文档中明确标注当前限制，不会产生误导
3. 集中精力确保核心功能稳定可靠

---

## 3. 性能优化要求 - 具体化建议

### 对应 PRD 第 4 节"非功能需求"

**问题**: PRD 第 100 行提到"插件的运行不应影响 VSCode 的性能"，但缺少具体指标和实施措施。

**建议补充**:

在 PRD 第 98 行后添加：

```markdown
## 4. 非功能需求

### 4.1. 性能要求

#### 4.1.1. 响应时间指标

| 操作 | 目标响应时间 | 测试场景 |
|-----|------------|---------|
| 命令触发到开始扫描 | < 100ms | 任何项目规模 |
| 扫描 100 个资源文件 | < 500ms | 典型小型项目 |
| 扫描 1000 个资源文件 | < 2s | 典型中型项目 |
| 扫描 5000 个资源文件 | < 10s | 大型项目 |
| 生成 Dart 文件 | < 200ms | 任何项目规模 |

#### 4.1.2. 文件监听性能

**防抖策略**:
```typescript
// 文件变化后 300ms 内无新变化才触发生成
const DEBOUNCE_DELAY = 300; // 毫秒
```

**批量处理**:
- 多个文件同时变化时，只触发一次生成
- 避免在用户批量复制/移动文件时频繁重新生成

**可配置开关**:
```yaml
flutter_assets_generator:
  # 是否启用自动检测（监听文件变化）
  auto_detection: true
```

用户可通过设置 `auto_detection: false` 关闭自动监听，改为手动触发。

#### 4.1.3. 内存使用

**限制**:
- 插件常驻内存占用 < 10MB
- 生成过程中峰值内存 < 50MB（5000 个资源文件的场景）

**实施措施**:
- 使用流式处理大文件
- 及时释放不再使用的对象
- 避免在内存中缓存所有资源文件内容

#### 4.1.4. 线程模型

**异步处理**:
- 文件扫描、代码生成在后台线程执行
- 不阻塞 VSCode 主线程（UI 保持响应）
- 使用 `async/await` 确保代码可读性

**进度提示**:
```typescript
vscode.window.withProgress({
  location: vscode.ProgressLocation.Notification,
  title: "Generating Flutter assets...",
  cancellable: false
}, async (progress) => {
  // 扫描文件
  progress.report({ increment: 30, message: "Scanning files..." });

  // 生成代码
  progress.report({ increment: 40, message: "Generating code..." });

  // 写入文件
  progress.report({ increment: 30, message: "Writing file..." });
});
```

### 4.2. 稳定性

#### 4.2.1. 错误处理

**关键场景**:
1. `pubspec.yaml` 格式错误
2. 资源文件路径不存在
3. 生成文件写入权限不足
4. YAML 解析失败
5. 文件名包含非法字符

**处理策略**:
- 所有错误必须被捕获，不允许插件崩溃
- 错误信息通过 `vscode.window.showErrorMessage()` 友好展示
- 关键错误记录到 OUTPUT 面板的插件通道

**示例**:
```typescript
try {
  await generateAssets();
  vscode.window.showInformationMessage('✅ Assets generated successfully');
} catch (error) {
  vscode.window.showErrorMessage(
    `❌ Failed to generate assets: ${error.message}`
  );
  outputChannel.appendLine(`[ERROR] ${error.stack}`);
}
```

#### 4.2.2. 降级方案

**当配置项缺失时**:
- 使用默认值，不中断生成流程
- 在 OUTPUT 面板提示使用了默认值

**当资源路径不存在时**:
- 跳过该路径，继续处理其他路径
- 在 OUTPUT 面板记录警告

### 4.3. 易用性

#### 4.3.1. 安装体验

- 插件大小 < 5MB（压缩后）
- 安装后无需额外配置即可使用（使用默认配置）
- 提供 Quick Start 引导（首次使用时显示）

#### 4.3.2. 错误信息友好性

**差的错误提示**:
```
Error: ENOENT: no such file or directory
```

**好的错误提示**:
```
❌ Asset path not found: 'assets/images/'

Tip: Please check the 'flutter.assets' section in pubspec.yaml
     and ensure the directory exists.
```

#### 4.3.3. 文档可达性

- 在命令面板提供 `Flutter Assets Generator: Open Documentation` 命令
- 错误提示中包含相关文档链接
- README 包含常见问题解答

### 4.4. 兼容性

#### 4.4.1. VSCode 版本

- 最低支持版本: VSCode 1.75.0 (2023-02)
- 测试覆盖: 最新 Stable 和 Insiders 版本

#### 4.4.2. Flutter SDK 版本

- 支持 Flutter 2.x 和 3.x
- 向前兼容原则：生成的代码兼容旧版本 Flutter

#### 4.4.3. 操作系统

- Windows 10/11
- macOS 11+
- Linux (Ubuntu 20.04+)

**平台特定注意事项**:
- 路径分隔符处理（`/` vs `\`）
- 文件名大小写敏感性（Linux/macOS vs Windows）
- 文件监听权限（macOS 需要授权）

---

## 4. CodeLens 预览功能 - 实现优先级建议

### 对应 PRD_REVIEW 问题 #4

**我的观点**: 虽然这是原插件的亮点功能，但建议**不要在 v1.0 实现**

**理由**:

1. **技术复杂度高**:
   - VSCode 的 CodeLens API 不直接支持图片展示
   - 需要使用 Webview + Decoration API 组合实现
   - 需要处理图片缓存、Base64 编码、缩略图生成等

2. **边际效益递减**:
   - 核心价值在于自动生成代码，CodeLens 是锦上添花
   - 开发时间投入与用户获益不成正比

3. **维护成本**:
   - 需要监听资源文件变化更新预览
   - 需要处理不同文件格式（PNG/JPG/SVG/GIF/WebP）
   - 需要处理超大图片的性能问题

**建议**:
- v1.0: 实现核心功能（扫描 + 生成 + 文件监听）
- v1.1: 实现简单的"点击常量跳转到资源文件"功能
- v2.0: 实现完整的 CodeLens 图片预览功能

**替代方案** (v1.0 可实现):
```typescript
// 提供 Hover 提示，而非 CodeLens
vscode.languages.registerHoverProvider('dart', {
  provideHover(document, position, token) {
    const range = document.getWordRangeAtPosition(position, /Assets\.\w+/);
    if (range) {
      const assetName = document.getText(range);
      const assetPath = resolveAssetPath(assetName);

      return new vscode.Hover([
        `**Asset Path**: ${assetPath}`,
        '[Open File](command:vscode.open?${assetPath})'
      ]);
    }
  }
});
```

这样用户鼠标悬停在 `Assets.xxx` 上时，可以看到文件路径并点击打开，实现成本低得多。

---

## 5. 右键菜单功能 - 交互细节建议

### 对应 PRD_REVIEW 问题 #6

**补充细节**:

#### 5.1. 菜单显示条件

建议**更智能地控制菜单显示**:

```json
// package.json
"menus": {
  "explorer/context": [
    {
      "command": "flutter-assets-generator.addToAssets",
      "when": "explorerResourceIsFolder && resourcePath =~ /assets/ || resourceExtname =~ /\\.(png|jpg|jpeg|gif|webp|svg|ttf|otf|mp3|mp4|json)$/",
      "group": "flutter@1"
    }
  ]
}
```

**逻辑**:
- 只在路径包含 `assets` 的文件夹上显示（避免误操作）
- 或在支持的资源文件上显示
- 放在 `flutter` 分组，与其他 Flutter 命令归类

#### 5.2. 智能路径处理

```typescript
async function addToAssets(uri: vscode.Uri) {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
  const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);

  // 智能判断是否添加尾部斜杠
  const isDirectory = (await vscode.workspace.fs.stat(uri)).type === vscode.FileType.Directory;
  const pathToAdd = isDirectory ? `${relativePath}/` : relativePath;

  // 读取 pubspec.yaml
  const pubspecPath = path.join(workspaceFolder.uri.fsPath, 'pubspec.yaml');
  const content = await vscode.workspace.fs.readFile(vscode.Uri.file(pubspecPath));
  const yaml = YAML.parse(content.toString());

  // 检查是否已存在
  if (!yaml.flutter) yaml.flutter = {};
  if (!yaml.flutter.assets) yaml.flutter.assets = [];

  if (yaml.flutter.assets.includes(pathToAdd)) {
    vscode.window.showInformationMessage(`Path already exists: ${pathToAdd}`);
    return;
  }

  // 添加路径
  yaml.flutter.assets.push(pathToAdd);

  // 排序（可选，保持整洁）
  yaml.flutter.assets.sort();

  // 写回文件（保持格式）
  await updatePubspecYaml(pubspecPath, yaml);

  // 触发生成
  await generateAssets();

  vscode.window.showInformationMessage(`✅ Added to assets: ${pathToAdd}`);
}
```

#### 5.3. 批量添加支持

支持用户选中多个文件/文件夹，一次性添加：

```json
"menus": {
  "explorer/context": [
    {
      "command": "flutter-assets-generator.addToAssets",
      "when": "...",
      "group": "flutter@1"
    }
  ]
}
```

命令实现：
```typescript
vscode.commands.registerCommand(
  'flutter-assets-generator.addToAssets',
  async (...uris: vscode.Uri[]) => {
    // 处理多选情况
    const paths = await Promise.all(uris.map(uri => processPath(uri)));
    await addMultipleToAssets(paths);
  }
);
```

---

## 6. 测试策略 - 具体化建议

### PRD 第 5 节"技术方案"缺少测试计划

**建议在 PRD 第 5 节后添加第 5.3 节：测试策略**

```markdown
### 5.3. 测试策略

#### 5.3.1. 单元测试

**测试框架**: Jest

**测试覆盖**:
- 命名转换函数（camelCase、文件名预处理）
- 路径解析和归一化
- YAML 配置解析
- 常量名冲突检测
- 文件忽略规则

**目标覆盖率**: > 80%

**示例**:
```typescript
describe('Naming Converter', () => {
  describe('camelCase', () => {
    it('converts snake_case to camelCase', () => {
      expect(toCamelCase('home_icon')).toBe('homeIcon');
    });

    it('handles @ symbol', () => {
      expect(toCamelCase('icon@2x')).toBe('icon2x');
    });

    it('handles dots', () => {
      expect(toCamelCase('icon.v2.png')).toBe('iconV2');
    });
  });

  describe('with parent directory', () => {
    it('adds parent directory prefix', () => {
      const result = generateConstantName('assets/images/home.png', {
        namedWithParent: true
      });
      expect(result).toBe('imagesHome');
    });
  });
});
```

#### 5.3.2. 集成测试

**测试框架**: @vscode/test-electron

**测试场景**:
1. 完整的生成流程（扫描 → 生成 → 写入）
2. 文件监听触发重新生成
3. 多模块项目支持
4. 配置项生效验证
5. 错误处理和降级

**示例**:
```typescript
describe('Extension Integration', () => {
  it('generates assets file from pubspec.yaml', async () => {
    // 创建临时工作区
    const workspaceDir = await createTempWorkspace({
      'pubspec.yaml': `
        name: test_app
        flutter:
          assets:
            - assets/images/
      `,
      'assets/images/home.png': '<binary data>'
    });

    // 触发生成命令
    await vscode.commands.executeCommand('flutter-assets-generator.generate');

    // 验证生成的文件
    const generatedFile = path.join(workspaceDir, 'lib/generated/assets.dart');
    const content = await fs.readFile(generatedFile, 'utf-8');

    expect(content).toContain('class Assets');
    expect(content).toContain('static const String imagesHome');
  });
});
```

#### 5.3.3. E2E 测试

**测试场景**:
- 真实 Flutter 项目中的表现
- 与 Flutter 命令的兼容性
- 不同操作系统的兼容性

**测试项目**:
- 准备 3 个不同规模的 Flutter 示例项目（小/中/大）
- 在 Windows/macOS/Linux 上运行 E2E 测试套件

#### 5.3.4. 性能测试

**测试场景**:
| 资源文件数量 | 目录数量 | 目标时间 | 测试频率 |
|------------|---------|---------|---------|
| 100 | 5 | < 500ms | 每次 PR |
| 1000 | 20 | < 2s | 每次 PR |
| 5000 | 50 | < 10s | 每周 |

**实施方式**:
```typescript
describe('Performance', () => {
  it('generates 1000 assets within 2 seconds', async () => {
    const workspaceDir = await createWorkspaceWith1000Assets();

    const startTime = Date.now();
    await generateAssets(workspaceDir);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(2000);
  });
});
```

#### 5.3.5. 回归测试

**策略**:
- 每个 bug 修复后，添加对应的回归测试用例
- 确保同类问题不再出现

**问题追踪**:
```typescript
// test/regression/issue-001.test.ts
describe('Regression: Issue #1', () => {
  it('should not duplicate constants when named_with_parent is true', async () => {
    // 复现 bug 的最小场景
    // 验证修复后的行为
  });
});
```

---

## 7. 文档和示例 - 用户体验建议

### PRD 中缺少用户文档和示例规划

**建议在 PRD 第 6 节"未来规划"后添加第 7 节：用户文档和示例**

```markdown
## 7. 用户文档和示例

### 7.1. README.md 结构

1. **快速开始** (5 分钟上手)
   - 安装插件
   - 配置 `pubspec.yaml`
   - 运行生成命令
   - 使用生成的常量

2. **配置参考**
   - 完整配置项列表
   - 每个配置项的说明和示例
   - 常见配置组合

3. **命名规范详解**
   - 文件名预处理规则
   - 命名冲突解决策略
   - 最佳实践

4. **常见问题**
   - 为什么生成的常量名不符合预期？
   - 如何忽略某些文件？
   - 多模块项目如何使用？
   - 与 Android Studio 插件的差异

5. **故障排查**
   - 常见错误及解决方案
   - 如何查看详细日志
   - 如何报告 bug

### 7.2. 示例项目

**准备以下示例项目**:

1. **minimal-example** (最小示例)
   ```
   minimal-example/
   ├── pubspec.yaml (最简配置)
   ├── assets/
   │   └── icon.png
   └── lib/
       ├── main.dart (演示如何使用)
       └── generated/
           └── assets.dart (生成结果)
   ```

2. **multi-directory-example** (多目录示例)
   ```
   multi-directory-example/
   ├── pubspec.yaml
   ├── assets/
   │   ├── images/
   │   ├── icons/
   │   ├── fonts/
   │   └── audio/
   └── lib/generated/assets.dart
   ```

3. **advanced-example** (高级配置示例)
   - 自定义分割规则
   - 路径忽略
   - 父目录命名

4. **package-example** (Flutter Package 示例)
   - 展示 `leading_with_package_name: true` 的用法

### 7.3. 视频教程

**建议录制以下视频** (每个 2-3 分钟):
1. 插件安装和基本使用
2. 配置项详解
3. 多模块项目使用
4. 常见问题排查

### 7.4. 迁移指南

**为 Android Studio 插件用户提供迁移指南**:

1. **配置迁移**
   - Android Studio 的全局配置如何迁移到 VSCode
   - `pubspec.yaml` 配置完全兼容，无需修改

2. **功能对比**
   - 功能对照表（见 PRD_REVIEW 问题 #11）
   - 快捷键映射

3. **已知差异**
   - CodeLens 预览功能在 v1.0 未实现（如果采纳我的建议）
   - 可视化配置界面在未来版本实现

---

## 8. 发布和推广策略

### PRD 中未提及的内容

**建议在 PRD 第 6 节后添加发布计划**:

```markdown
## 8. 发布和推广策略

### 8.1. 版本规划

**v1.0.0 (MVP)** - 预计 4-6 周
- ✅ 核心功能：扫描 + 生成 + 文件监听
- ✅ 配置支持（pubspec.yaml）
- ✅ 右键菜单快速添加
- ✅ 基本错误处理
- ✅ 文档和示例

**v1.1.0** - 预计 2-3 周
- ✅ Hover 提示（显示资源路径）
- ✅ 点击跳转到资源文件
- ✅ 性能优化

**v1.2.0** - 预计 2-3 周
- ✅ 多模块项目支持优化
- ✅ 更智能的错误提示
- ✅ 配置验证和自动修复

**v2.0.0** - 预计 6-8 周
- ✅ 可视化配置界面
- ✅ 实时预览
- ✅ CodeLens 图片预览（可选）
- ✅ 更多命名风格（snake_case、PascalCase）

### 8.2. 发布渠道

1. **VSCode Marketplace**
   - 官方发布渠道
   - 提供详细的描述和截图
   - 定期更新

2. **GitHub Repository**
   - 开源项目
   - Issue 追踪
   - Pull Request 欢迎贡献

3. **社区推广**
   - Reddit (r/FlutterDev)
   - Medium 博客文章
   - Twitter/X 推广
   - Flutter Community Slack

### 8.3. 质量门禁

**发布前必须满足**:
- ✅ 所有 P0/P1 测试用例通过
- ✅ 单元测试覆盖率 > 80%
- ✅ 集成测试通过
- ✅ 在 Windows/macOS/Linux 上手动测试通过
- ✅ 文档审查通过
- ✅ 性能指标达标

### 8.4. 用户反馈机制

1. **Issue 模板**
   - Bug 报告模板
   - 功能请求模板
   - 问题描述规范

2. **快速响应**
   - P0 问题 24 小时内响应
   - P1 问题 3 天内响应

3. **迭代改进**
   - 每月发布一个小版本
   - 根据用户反馈调整优先级
```

---

## 9. 风险和缓解措施

### PRD 中未提及的内容

**建议在 PRD 第 4 节后添加第 4.5 节：风险评估**

```markdown
### 4.5. 风险评估和缓解措施

| 风险 | 影响 | 概率 | 缓解措施 |
|-----|------|------|---------|
| **技术风险** | | | |
| VSCode API 限制导致功能无法实现 | 高 | 低 | 提前进行技术预研和 PoC |
| 文件监听在某些系统上不稳定 | 中 | 中 | 提供手动触发选项，降级方案 |
| 大型项目性能问题 | 高 | 中 | 实施性能测试，优化算法 |
| **产品风险** | | | |
| 用户期待与原插件完全一致 | 中 | 高 | 在文档中明确说明差异 |
| 配置复杂度劝退新用户 | 中 | 中 | 提供开箱即用的默认配置 |
| **项目风险** | | | |
| 开发时间超出预期 | 中 | 中 | MVP 范围最小化，迭代发布 |
| 缺少测试覆盖导致质量问题 | 高 | 中 | 建立测试规范，强制覆盖率 |
| **外部风险** | | | |
| Flutter/VSCode API 破坏性更新 | 高 | 低 | 关注官方更新，及时适配 |
| 竞品出现 | 低 | 低 | 快速迭代，保持功能领先 |
```

---

## 10. 总结 - 核心建议

### 立即行动项 (本周)

1. ✅ **删除 `.vscode/settings.json` 覆盖功能**（PRD 第 72-90 行）
   - 简化配置层级，降低理解成本
   - 确保团队代码生成一致性

2. ✅ **修正配置项遗漏**（PRD 第 54-69 行）
   - 补充: `output_dir`、`output_filename`、`auto_detection`
   - 修正: `package_parameter_enabled` → `leading_with_package_name`

3. ✅ **明确命名风格范围**（PRD 第 36-41 行）
   - v1.0 仅实现 `camelCase`
   - 其他风格移至未来规划

### 建议补充的章节

1. **第 4.1 节：性能要求** - 具体化指标
2. **第 4.5 节：风险评估** - 识别和缓解
3. **第 5.3 节：测试策略** - 质量保障
4. **第 7 节：用户文档和示例** - 用户体验
5. **第 8 节：发布和推广策略** - 产品成功

### MVP 范围建议 (v1.0)

**包含**:
- ✅ 核心功能（扫描 + 生成 + 监听）
- ✅ pubspec.yaml 配置（完整）
- ✅ 右键菜单快速添加
- ✅ 基本错误处理
- ✅ 文档和示例

**不包含** (延后到 v1.1+):
- ❌ CodeLens 图片预览
- ❌ 可视化配置界面
- ❌ snake_case/PascalCase 命名风格
- ❌ 高级命名规则（正则替换）

### 与 PRD_REVIEW.md 的关系

本文档是 **补充**，而非替代：
- PRD_REVIEW.md 已经做了出色的技术评审
- 本文档提供了不同视角的建议（产品、测试、文档、发布）
- 两份文档配合使用，可以更全面地优化 PRD

---

**评审人**: Claude Code Assistant
**建议使用方式**: 将本文档与 PRD_REVIEW.md 一起讨论，综合考虑两份评审意见后修订 PRD.md

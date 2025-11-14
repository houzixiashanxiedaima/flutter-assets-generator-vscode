# PRD: Flutter Assets Generator for VSCode

**版本**: v1.0
**评审日期**: 2025-11-14
**状态**: Final

---

## 1. 背景

`FlutterAssetsGenerator` 是一个广受欢迎的 Android Studio/IntelliJ IDEA 插件，它可以帮助 Flutter 开发者自动生成资源的引用文件，从而避免手动输入和维护资源路径，提高了开发效率和代码质量。然而，许多 Flutter 开发者使用 VSCode 作为他们的主要开发工具，但目前缺少一个功能对等、体验优秀的 VSCode 插件。

为了填补这一空白，我们计划将 `FlutterAssetsGenerator` 的核心功能迁移到 VSCode 平台，为广大的 VSCode 用户提供同样便捷的资源管理体验。

**原项目**: `/Users/yuyi/Downloads/venv/manhuagui/FlutterAssetsGenerator/`

---

## 2. 目标

- 开发一个 VSCode 插件，实现 `FlutterAssetsGenerator` 的核心功能
- 遵循原插件的资源命名规范，确保迁移后的一致性
- 提供良好的用户体验，无缝集成到 VSCode 的开发流程中
- 插件应该易于安装、配置和使用

### 2.1. 功能迁移对照表

| 功能分类 | 功能点 | Android Studio | VSCode v1.0 | 备注 |
|---------|-------|---------------|-------------|------|
| **核心功能** | | | | |
| | 扫描资源文件 | ✅ | ✅ | 完全迁移 |
| | 生成 Dart 代码 | ✅ | ✅ | 完全迁移 |
| | pubspec.yaml 配置 | ✅ | ✅ | 完全迁移 |
| **命名风格** | | | | |
| | camelCase | ✅ | ✅ | 完全迁移 |
| | snake_case | ❌ | 🚀 | v2.0 规划 |
| | PascalCase | ❌ | 🚀 | v2.0 规划 |
| **文件监听** | | | | |
| | 自动检测变化 | ✅ | ✅ | 技术适配(chokidar) |
| | 300ms 防抖 | ✅ | ✅ | 完全迁移 |
| **配置系统** | | | | |
| | 全局设置 | ✅ (IDE Settings) | ✅ (User Settings) | 技术适配 |
| | 项目设置 | ✅ (pubspec.yaml) | ✅ (pubspec.yaml) | 完全迁移 |
| **快捷操作** | | | | |
| | 命令面板触发 | ✅ | ✅ | 技术适配 |
| | 右键菜单添加路径 | ✅ | ✅ | 完全迁移 |
| **高级功能** | | | | |
| | 多模块支持 | ✅ | ✅ | 技术适配(Multi-root) |
| | Package 前缀 | ✅ | ✅ | 完全迁移 |
| | 路径忽略 | ✅ | ✅ | 完全迁移 |
| | 自定义分割规则 | ✅ | ✅ | 完全迁移 |
| **可视化功能** | | | | |
| | Hover 提示 | ❌ | ✅ | v1.0 实现 |
| | 点击跳转 | ✅ | ✅ | v1.0 实现 |
| | CodeLens 图片预览 | ✅ | 🚀 | v1.1 规划 |
| **未来规划** | | | | |
| | 可视化配置界面 | ❌ | 🚀 | v2.0 规划 |
| | 实时预览 | ❌ | 🚀 | v2.0 规划 |

**图例**:
- ✅ 完全支持
- 🚀 规划中
- ❌ 不支持

---

## 3. 功能需求

### 3.1. 自动生成资源引用文件

插件的核心功能是自动扫描 `pubspec.yaml` 中定义的资源路径，并生成一个 Dart 文件，其中包含所有资源的静态常量引用。

#### 3.1.1. 触发方式

- **方式 1: 命令面板手动触发**
  - 按 `Cmd+Shift+P` (Mac) / `Ctrl+Shift+P` (Win)，选择 `Flutter: Generate Assets`

- **方式 2: 自动监听触发**
  - 插件监听 `pubspec.yaml` 中定义的资源路径，当文件增删改时自动重新生成
  - 使用 300ms 防抖策略，避免频繁触发

- **方式 3: 右键菜单快速添加**
  - 在 VSCode 资源管理器中右键点击文件夹或文件
  - 选择 `Flutter: Add to Assets`
  - 插件自动将该路径添加到 `pubspec.yaml` 的 `flutter.assets` 数组
  - 自动触发资源生成
  - **智能处理**:
    - 如果选择文件夹，添加 `assets/images/` (带尾部斜杠)
    - 如果选择单个文件，添加 `assets/icon.png` (不带斜杠)
    - 自动去除重复路径
    - 自动清理不存在的路径

#### 3.1.2. 生成内容

- 生成的 Dart 文件包含一个类，类名可以通过 `pubspec.yaml` 进行配置(默认: `Assets`)
- 类中为每个资源文件生成一个 `static const String` 类型的常量
- 常量的值是资源文件相对于项目根目录的路径

**示例生成代码**:

```dart
/// Generated file. Do not edit.
class Assets {
  Assets._();

  static const String imagesHomeIcon = 'assets/images/home_icon.png';
  static const String iconsSettings = 'assets/icons/settings.svg';
  static const String fontsRoboto = 'assets/fonts/Roboto-Regular.ttf';
}
```

#### 3.1.3. 文件过滤规则

插件在扫描资源时，会自动跳过以下类型的文件/文件夹:

**自动忽略规则** (无法配置):
1. **隐藏文件/文件夹**: 以 `.` 开头的项(如 `.DS_Store`、`.gitkeep`)
2. **Flutter 密度变体目录**: `2.0x/`, `3.0x/`, `Mx/`, `Nx/`
   - 理由: Flutter 会自动根据设备像素比选择对应目录的资源
   - 示例: `assets/images/icon.png` 和 `assets/images/2.0x/icon.png` 只生成 `Assets.imagesIcon`

**用户自定义忽略** (通过 `path_ignore` 配置):
```yaml
flutter_assets_generator:
  path_ignore:
    - "assets/fonts/"           # 忽略整个字体目录
    - "assets/images/dark/"     # 忽略暗色主题图片
    - "assets/temp/"            # 忽略临时文件
```

**匹配规则**:
- 支持相对路径匹配(从项目根目录开始)
- 支持目录匹配(以 `/` 结尾)
- 支持单个文件匹配

**调试技巧**:
- 生成时会在 OUTPUT 面板显示被忽略的文件数量
- 可通过 `Flutter: Show Ignored Assets` 命令查看完整忽略列表

#### 3.1.4. 多模块 / 多根工作区支持

插件支持以下场景:

**场景 1: 单一 Flutter 项目**
```
my_app/
├── pubspec.yaml
├── lib/
└── assets/
```
→ 生成 `lib/generated/assets.dart`

**场景 2: Flutter Package 项目**
```
my_package/
├── pubspec.yaml
└── lib/
    └── src/
```
→ 生成 `lib/generated/assets.dart`
→ 如果 `leading_with_package_name: true`，路径前缀为 `packages/my_package/`

**场景 3: Multi-root Workspace (多根工作区)**
```
workspace.code-workspace (VSCode 工作区文件)
  ├── app/          ← Flutter 应用
  │   └── pubspec.yaml
  ├── core/         ← Flutter 包
  │   └── pubspec.yaml
  └── ui_kit/       ← Flutter 包
      └── pubspec.yaml
```
→ 插件自动检测所有 Flutter 项目(通过 `pubspec.yaml` 中的 `flutter:` 节)
→ 分别为每个项目生成独立的资源文件
→ 支持在命令面板选择"为当前项目生成"或"为所有项目生成"

**实现逻辑**:
1. 使用 `vscode.workspace.workspaceFolders` 获取所有根目录
2. 递归搜索每个根目录下的 `pubspec.yaml`
3. 解析 YAML，检查是否包含 `flutter:` 节点(判断是否为 Flutter 项目)
4. 为每个 Flutter 项目独立生成资源文件

---

### 3.2. 资源命名规范

#### 3.2.1. 命名风格配置

**v1.0 版本说明**:
- 当前版本仅实现 `camelCase` 命名风格(与原 Android Studio 插件保持一致)
- `snake_case` 和 `PascalCase` 已列入未来规划(见第 6 节)

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
- 将分隔符(默认 `-` 和 `_`) 分割的单词转为小驼峰
- 第一个单词小写，后续单词首字母大写
- 示例:
  - `home_icon.png` → `homeIcon`
  - `user-profile.png` → `userProfile`
  - `404-page.png` → `n404Page` (数字开头自动添加 `n` 前缀)

#### 3.2.2. 文件名预处理流程

在应用命名风格前，文件名会经过以下预处理步骤:

```
原始文件名: "home.icon@2x.png"
    ↓
步骤 1: 移除扩展名
    → "home.icon@2x"
    ↓
步骤 2: 删除 @ 符号
    → "home.icon2x"
    ↓
步骤 3: 将 . 替换为 _
    → "home_icon2x"
    ↓
步骤 4: 应用 filename_split_pattern 分割(默认 [-_])
    → ["home", "icon2x"]
    ↓
步骤 5: 应用命名风格转换 (camelCase)
    → "homeIcon2x"
    ↓
步骤 6: 如果 named_with_parent: true，添加父目录前缀
    → "imagesHomeIcon2x"
```

**特殊字符处理规则**:

| 字符 | 处理方式 | 示例 |
|-----|---------|------|
| `.` | 替换为 `_` | `icon.v2.png` → `iconV2` |
| `@` | 删除 | `icon@2x.png` → `icon2x` |
| `-` | 作为分隔符(默认) | `home-icon.png` → `homeIcon` |
| `_` | 作为分隔符(默认) | `home_icon.png` → `homeIcon` |
| 空格 | 保留但不推荐 | `home icon.png` → `homeIcon` |
| 大写字母 | 转为小写后处理 | `HomeIcon.png` → `homeIcon` |

**注意事项**:
- 文件名分隔符可通过 `filename_split_pattern` 自定义(正则表达式)
- 不推荐文件名包含空格、中文或其他特殊字符
- 如果文件名以数字开头(如 `404.png`)，生成的常量名为 `n404`(Dart 标识符规范)

#### 3.2.3. 可选的父目录命名

插件提供一个配置项，允许在常量名中包含父目录的名称，以避免命名冲突。

```yaml
flutter_assets_generator:
  # 是否在常量名中包含父目录名
  named_with_parent: true
```

**示例**:
- `assets/images/home_icon.png` → `imagesHomeIcon`
- `assets/icons/home_icon.png` → `iconsHomeIcon`

#### 3.2.4. 命名冲突处理

当多个资源文件生成相同的常量名时，插件按以下策略解决:

**策略 1: 启用 `named_with_parent`(推荐)**

```yaml
flutter_assets_generator:
  named_with_parent: true
```

**处理流程**:
```
assets/images/icon.png   → icon (基础名)
assets/icons/icon.png    → icon (冲突检测)

↓ 添加父目录名

assets/images/icon.png   → imagesIcon ✓
assets/icons/icon.png    → iconsIcon  ✓
```

**策略 2: 多层目录冲突**

```
assets/ui/light/bg.png   → uiLightBg (父+祖父)
assets/ui/dark/bg.png    → uiDarkBg  (父+祖父)
```

**策略 3: 仍然冲突时的行为**

如果经过上述处理仍存在冲突(极少见)，插件会:

- 后扫描的文件覆盖前者
- 在 OUTPUT 面板显示警告:
  ```
  ⚠️ Duplicate asset name detected:
    - 'assetsIcon' defined in:
      • assets/icons/icon.png
      • assets/images/icon.png (overridden)
  ```
- 在生成的代码中添加注释:
  ```dart
  // Warning: Duplicate name, previous definition overridden
  static const String assetsIcon = 'assets/icons/icon.png';
  ```

**最佳实践**:

为避免命名冲突，建议:
1. 始终启用 `named_with_parent: true`
2. 使用清晰的目录结构:
   ```
   assets/
   ├── images/        # 图片
   ├── icons/         # 图标
   ├── fonts/         # 字体
   └── audio/         # 音频
   ```
3. 避免在同一目录下使用相同的基础文件名

---

### 3.3. 配置文件

#### 3.3.1. 配置设计原则

**核心原则**: 所有影响生成代码的配置必须在 `pubspec.yaml` 中定义，确保团队成员生成一致的代码。

**配置层级** (优先级从高到低):

1. **项目配置** (`pubspec.yaml` 的 `flutter_assets_generator` 节)
   - 提交到 Git，团队共享
   - 影响生成的代码内容

2. **用户全局配置** (VSCode User Settings)
   - 仅影响插件行为(如是否启用自动生成、通知设置等)
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

#### 3.3.2. 项目配置 (`pubspec.yaml`)

这是主要的配置文件，用于团队共享的项目级配置。

```yaml
flutter_assets_generator:
  # 生成文件输出目录(相对于 lib/ 目录)
  output_dir: generated

  # 生成的 Dart 文件名(不含 .dart 扩展名)
  output_filename: assets

  # 是否自动监听文件变化并重新生成
  auto_detection: true

  # 生成的 Dart 类名
  class_name: Assets

  # 命名风格 (v1.0 仅支持 camelCase)
  naming_style: camelCase

  # 是否在常量名中包含父目录名
  named_with_parent: true

  # 文件名分割规则(正则表达式)
  filename_split_pattern: "[-_]"

  # 是否为 Flutter package 添加 packages/ 前缀
  leading_with_package_name: false

  # 忽略的路径列表
  path_ignore:
    - "assets/images/3.0x/"
```

**配置项说明**:

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|-------|------|
| `output_dir` | string | `"generated"` | 生成文件输出目录(相对于 lib/) |
| `output_filename` | string | `"assets"` | 生成的 Dart 文件名(不含扩展名) |
| `auto_detection` | boolean | `true` | 是否自动监听文件变化 |
| `class_name` | string | `"Assets"` | 生成的 Dart 类名 |
| `naming_style` | string | `"camelCase"` | 命名风格(v1.0 仅支持 camelCase) |
| `named_with_parent` | boolean | `true` | 是否包含父目录名 |
| `filename_split_pattern` | string | `"[-_]"` | 文件名分割规则(正则) |
| `leading_with_package_name` | boolean | `false` | 是否添加 packages/ 前缀 |
| `path_ignore` | array | `[]` | 忽略的路径列表 |

#### 3.3.3. `leading_with_package_name` 配置说明

**使用场景**: 当你的项目是一个 **Flutter package**(发布到 pub.dev 的库)时使用。

**效果对比**:

```yaml
# pubspec.yaml
name: my_ui_kit
flutter:
  assets:
    - assets/icons/
```

**当 `leading_with_package_name: false` (默认)**:
```dart
class Assets {
  static const String iconsHome = 'assets/icons/home.png';
}
```

**当 `leading_with_package_name: true`**:
```dart
class Assets {
  static const String iconsHome = 'packages/my_ui_kit/assets/icons/home.png';
}
```

**为什么需要这个配置？**

当其他项目依赖你的 package 时，访问你的资源需要使用 `packages/` 前缀:
```dart
// 在使用你的 package 的项目中
Image.asset('packages/my_ui_kit/assets/icons/home.png')
```

如果开启此配置，你的 package 中的代码也可以使用同样的路径，确保一致性。

---

### 3.4. 资源可视化和导航

#### 3.4.1. Hover 提示功能

在 Dart 文件中，当鼠标悬停在 `Assets.xxx` 形式的资源引用上时:

- 显示资源文件的完整路径
- 显示文件大小和类型
- 提供"打开文件"链接

**示例**:
```dart
// 鼠标悬停在 Assets.imagesHome 上
Image.asset(Assets.imagesHome)

// 显示提示:
// Asset Path: assets/images/home.png
// File Size: 24.5 KB
// Type: PNG Image
// [Open File]
```

#### 3.4.2. 点击跳转功能

- 支持 `Cmd+Click` (Mac) / `Ctrl+Click` (Win) 快速跳转到资源文件
- 在新标签页打开资源文件

#### 3.4.3. 配置项

```yaml
flutter_assets_generator:
  enable_hover: true              # 是否启用 Hover 提示
```

---

### 3.5. 文件监听

插件应该能够监听资源目录下的文件变化，并在文件发生变化时自动更新生成的 Dart 文件。

**监听逻辑**:
- 监听 `pubspec.yaml` 中 `flutter` -> `assets` 字段定义的路径
- 当资源文件被添加、删除或重命名时，自动触发代码生成
- 使用 300ms 防抖策略，避免频繁触发

**性能优化**:
- 使用 `chokidar` 的 `awaitWriteFinish` 选项，避免文件未写完就触发
- 批量处理: 多个文件同时变化时，只触发一次生成
- 提供 `auto_detection` 配置项允许用户关闭自动监听

---

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
  # 是否启用自动检测(监听文件变化)
  auto_detection: true
```

用户可通过设置 `auto_detection: false` 关闭自动监听，改为手动触发。

#### 4.1.3. 内存使用

**限制**:
- 插件常驻内存占用 < 10MB
- 生成过程中峰值内存 < 50MB(5000 个资源文件的场景)

**实施措施**:
- 使用流式处理大文件
- 及时释放不再使用的对象
- 避免在内存中缓存所有资源文件内容

#### 4.1.4. 线程模型

**异步处理**:
- 文件扫描、代码生成在后台执行
- 不阻塞 VSCode 主线程(UI 保持响应)
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

---

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

---

### 4.3. 易用性

#### 4.3.1. 安装体验

- 插件大小 < 5MB(压缩后)
- 安装后无需额外配置即可使用(使用默认配置)
- 提供 Quick Start 引导(首次使用时显示)

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

---

### 4.4. 兼容性

#### 4.4.1. VSCode 版本

- 最低支持版本: VSCode 1.75.0 (2023-02)
- 测试覆盖: 最新 Stable 和 Insiders 版本

#### 4.4.2. Flutter SDK 版本

- 支持 Flutter 2.x 和 3.x
- 向前兼容原则: 生成的代码兼容旧版本 Flutter

#### 4.4.3. 操作系统

- Windows 10/11
- macOS 11+
- Linux (Ubuntu 20.04+)

**平台特定注意事项**:
- 路径分隔符处理(`/` vs `\`)
- 文件名大小写敏感性(Linux/macOS vs Windows)
- 文件监听权限(macOS 需要授权)

---

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

---

## 5. 技术方案

### 5.1. 技术栈

- **平台**: VSCode Extension
- **语言**: TypeScript
- **核心库**:
  - `vscode` API: 用于与 VSCode 的核心功能进行交互，例如命令面板、文件系统、通知等
  - `chokidar`: 用于实现文件系统的监听功能
  - `js-yaml`: 用于解析和序列化 `pubspec.yaml` 文件

### 5.2. 关键技术挑战与解决方案

#### 挑战 1: YAML 修改需保留格式和注释

**问题**:
- `js-yaml` 的 `dump()` 方法会丢失原始格式和注释
- 用户手动编写的 pubspec.yaml 格式会被破坏

**解决方案**:

使用正则表达式进行局部修改，避免完全重新序列化:

```typescript
function addAssetPath(yamlContent: string, newPath: string): string {
  const assetsRegex = /^(\s*)assets:\s*$/m;
  const match = yamlContent.match(assetsRegex);

  if (match) {
    const indent = match[1];
    const assetIndent = indent + '  ';
    const insertion = `${assetIndent}- ${newPath}\n`;
    // 在 assets: 后插入
    return yamlContent.replace(assetsRegex, `$&\n${insertion}`);
  }

  return yamlContent;
}
```

---

#### 挑战 2: 文件监听的性能优化

**问题**:
- 大型项目可能有数千个资源文件
- 频繁的文件变化可能导致性能问题

**解决方案**:

```typescript
import * as chokidar from 'chokidar';
import { debounce } from 'lodash';

class AssetWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private generateDebounced: Function;

  constructor() {
    // 300ms 防抖，与原插件保持一致
    this.generateDebounced = debounce(() => {
      this.generateAssets();
    }, 300);
  }

  start(assetPaths: string[]) {
    this.watcher = chokidar.watch(assetPaths, {
      ignored: /(^|[\/\\])\../,  // 忽略隐藏文件
      persistent: true,
      ignoreInitial: true,       // 初始扫描不触发事件
      awaitWriteFinish: {        // 等待文件写入完成
        stabilityThreshold: 100,
        pollInterval: 50
      }
    });

    this.watcher
      .on('add', this.generateDebounced)
      .on('unlink', this.generateDebounced)
      .on('change', this.generateDebounced);
  }

  stop() {
    this.watcher?.close();
  }
}
```

**优化措施**:
1. 使用 `debounce` 防止频繁触发
2. 使用 `awaitWriteFinish` 避免文件未写完就触发
3. 提供配置项允许用户关闭自动监听

---

#### 挑战 3: Multi-root Workspace 支持

**问题**:
- VSCode 支持多根工作区，需要处理多个独立的 Flutter 项目

**解决方案**:

```typescript
async function findAllFlutterProjects(): Promise<FlutterProject[]> {
  const projects: FlutterProject[] = [];

  // 获取所有工作区根目录
  const workspaceFolders = vscode.workspace.workspaceFolders || [];

  for (const folder of workspaceFolders) {
    // 递归搜索 pubspec.yaml
    const pubspecFiles = await vscode.workspace.findFiles(
      new vscode.RelativePattern(folder, '**/pubspec.yaml'),
      '**/node_modules/**'
    );

    for (const pubspecUri of pubspecFiles) {
      const content = await vscode.workspace.fs.readFile(pubspecUri);
      const yamlContent = yaml.load(content.toString());

      // 检查是否为 Flutter 项目
      if (yamlContent.flutter) {
        projects.push({
          root: vscode.Uri.joinPath(pubspecUri, '..'),
          pubspec: pubspecUri,
          config: yamlContent
        });
      }
    }
  }

  return projects;
}
```

---

### 5.3. 实施步骤

1. **项目初始化**: 使用 `yo code` 创建一个新的 VSCode 插件项目
2. **命令注册**: 在 `package.json` 中注册插件的命令，例如 `flutter-assets-generator.generate`
3. **配置读取**: 实现读取和解析 `pubspec.yaml` 中插件配置的逻辑
4. **文件扫描与代码生成**:
   - 实现扫描资源目录、收集资源文件的功能
   - 根据命名规范生成 Dart 代码
   - 将生成的代码写入到指定的文件中
5. **文件监听**: 使用 chokidar，监听资源文件的变化，并调用代码生成逻辑
6. **右键菜单集成**: 实现右键菜单"添加到 Assets"功能
7. **Hover 和跳转**: 实现 Hover 提示和点击跳转功能
8. **通知与错误处理**: 实现向用户显示通知(如生成成功、失败)和错误处理的逻辑

---

### 5.4. 测试策略

#### 5.4.1. 单元测试

**测试框架**: Jest

**测试覆盖**:
- 命名转换函数(camelCase、文件名预处理)
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

---

#### 5.4.2. 集成测试

**测试框架**: @vscode/test-electron

**测试场景**:
1. 完整的生成流程(扫描 → 生成 → 写入)
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

---

#### 5.4.3. 性能测试

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

---

#### 5.4.4. 回归测试

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

## 6. 未来规划

### v1.1.0 (预计 2-3 周)
- ✅ CodeLens 图片预览功能
- ✅ 性能优化
- ✅ 更智能的错误提示

### v1.2.0 (预计 2-3 周)
- ✅ 多模块项目支持优化
- ✅ 配置验证和自动修复
- ✅ 更多命令(如: 清理未使用的资源)

### v2.0.0 (预计 6-8 周)
- ✅ **可视化配置界面**
- ✅ **实时预览**: 修改配置时立即显示生成示例
- ✅ **双向同步**: 可视化界面与 `pubspec.yaml` 保持同步
- ✅ **更多命名风格**: 支持 `snake_case`、`PascalCase`
- ✅ **高级命名规则**: 使用正则表达式进行替换

### 长期规划
- 与其他 Flutter 插件集成
- 支持自定义代码模板
- 支持资源使用情况分析

---

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
   - 为什么生成的常量名不符合预期?
   - 如何忽略某些文件?
   - 多模块项目如何使用?
   - 与 Android Studio 插件的差异

5. **故障排查**
   - 常见错误及解决方案
   - 如何查看详细日志
   - 如何报告 bug

---

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

---

### 7.3. 迁移指南

**为 Android Studio 插件用户提供迁移指南**:

1. **配置迁移**
   - Android Studio 的全局配置如何迁移到 VSCode
   - `pubspec.yaml` 配置完全兼容，无需修改

2. **功能对比**
   - 功能对照表(见第 2.1 节)
   - 快捷键映射

3. **已知差异**
   - CodeLens 预览功能在 v1.1 实现
   - 可视化配置界面在 v2.0 实现

---

## 8. 发布和推广策略

### 8.1. 版本规划

**v1.0.0 (MVP)** - 预计 4-6 周
- ✅ 核心功能: 扫描 + 生成 + 文件监听
- ✅ 配置支持(pubspec.yaml)
- ✅ 右键菜单快速添加
- ✅ Hover 提示和跳转
- ✅ 基本错误处理
- ✅ 文档和示例

**v1.1.0** - 预计 2-3 周
- ✅ CodeLens 图片预览
- ✅ 性能优化

**v2.0.0** - 预计 6-8 周
- ✅ 可视化配置界面
- ✅ 实时预览
- ✅ 更多命名风格

---

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

---

### 8.3. 质量门禁

**发布前必须满足**:
- ✅ 所有 P0/P1 测试用例通过
- ✅ 单元测试覆盖率 > 80%
- ✅ 集成测试通过
- ✅ 在 Windows/macOS/Linux 上手动测试通过
- ✅ 文档审查通过
- ✅ 性能指标达标

---

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

---

## 9. 附录

### 9.1. 代码生成流程图

```
                      +----------------------+
                      |   触发 `generate` 命令 |
                      +-----------+----------+
                                  |
                                  v
                      +----------------------+
                      | 读取 `pubspec.yaml`  |
                      |   (项目配置)         |
                      +-----------+----------+
                                  |
                                  v
                      +----------------------+
                      |   扫描所有资源文件   |
                      +-----------+----------+
                                  |
          +-----------------------+-----------------------+
          |                                               |
          v                                               v
+---------+-----------+                       +-----------+---------+
|  对于每个资源文件   |                       |   (循环结束)        |
+---------+-----------+                       +-----------+---------+
          |                                               ^
          v                                               |
+---------+-----------+                                   |
| 应用文件名预处理规则 |                                   |
| (删除@, .替换为_等)  |                                   |
+---------+-----------+                                   |
          |                                               |
          v                                               |
+---------+-----------+                                   |
|   应用命名风格转换   |                                   |
|   (camelCase)       |                                   |
+---------+-----------+                                   |
          |                                               |
          v                                               |
+---------+-----------+                                   |
| 检测命名冲突,应用   |                                   |
| named_with_parent   |                                   |
+---------+-----------+                                   |
          |                                               |
          v                                               |
+---------+-----------+                       +-----------+---------+
|   生成 Dart 代码行   |                       |   将所有代码行写入   |
+---------------------+                       |   到 `.dart` 文件    |
          |                                   +-----------+---------+
          +-----------------------------------+           |
                                                          v
                                              +----------------------+
                                              |         结束         |
                                              +----------------------+
```

---

### 9.2. 技术参考

**原项目关键源码位置**:
- 配置常量: `src/main/java/com/crzsc/plugin/utils/Constants.kt`
- 资源扫描: `src/main/java/com/crzsc/plugin/utils/FileGenerator.kt`
- 命名转换: `src/main/java/com/crzsc/plugin/utils/PluginUtils.kt`
- 配置读取: `src/main/java/com/crzsc/plugin/utils/FileHelperNew.kt`
- 文件监听: `src/main/java/com/crzsc/plugin/listener/PsiTreeListener.kt`

**VSCode 扩展开发文档**:
- [Extension API](https://code.visualstudio.com/api)
- [Language Features](https://code.visualstudio.com/api/language-extensions/programmatic-language-features)
- [File System Watcher](https://code.visualstudio.com/api/references/vscode-api#FileSystemWatcher)

---

**文档版本**: 1.0 Final
**最后更新**: 2025-11-14
**评审人**: Claude (Sonnet 4.5)

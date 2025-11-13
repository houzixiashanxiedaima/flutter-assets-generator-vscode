# PRD 文档评审报告

**评审日期**: 2025-11-13
**评审对象**: Flutter Assets Generator VSCode 插件 PRD
**原项目**: FlutterAssetsGenerator (Android Studio/IntelliJ IDEA)
**目标平台**: Visual Studio Code

---

## 📊 评审概述

基于对 FlutterAssetsGenerator 原项目的深度源码分析，本评审报告识别出 PRD 文档中的关键问题和遗漏功能。原项目位于：`/Users/yuyi/Downloads/venv/manhuagui/FlutterAssetsGenerator/`

---

## 🔴 严重问题 (P0 级别)

### 问题 1: 命名风格功能过度承诺

**位置**: PRD 第 36-41 行

**问题描述**:
PRD 声称支持三种命名风格 (`camelCase`、`snake_case`、`PascalCase`)，但**原插件仅实现了 `camelCase`**。

**证据**:
```kotlin
// 位置: FlutterAssetsGenerator/src/main/java/com/crzsc/plugin/utils/PluginUtils.kt:36-52
fun String.toLowCamelCase(regex: Regex): String {
    val newStr = this.replace(Regex("[@]"), "")
    val split = newStr.split(regex)
    val sb = StringBuilder()
    for (i in split.indices) {
        if (i == 0) {
            sb.append(split[i].lowerCaseFirst())
        } else {
            sb.append(split[i].upperCaseFirst())
        }
    }
    return sb.toString()
}
```

原插件只有 `toLowCamelCase()` 方法，没有 snake_case 或 PascalCase 实现。

**修改建议**:
- **方案 A (保守)**: 删除 `snake_case` 和 `PascalCase`，在 PRD 中明确标注"v1.0 仅支持 camelCase，其他命名风格列入未来规划（第 6 节）"
- **方案 B (进取)**: 保留但标注为**新增功能**（非迁移功能），并在实施步骤中单独列出开发计划

**建议选择**: 方案 A（保持迁移范围可控）

---

### 问题 2: 核心配置项遗漏

**位置**: PRD 第 54-69 行 (pubspec.yaml 配置清单)

**问题描述**:
PRD 配置清单缺少 3 个原插件已有的重要配置项：

| 配置项 | 原插件字段 | 默认值 | 用途 | PRD 状态 |
|--------|-----------|--------|------|---------|
| 输出目录 | `output_dir` | `"generated"` | 指定生成文件位置（相对于 lib/） | ❌ 缺失 |
| 输出文件名 | `output_filename` | `"assets"` | 指定生成的 .dart 文件名（不含扩展名） | ❌ 缺失 |
| 自动检测开关 | `auto_detection` | `true` | 控制文件监听功能是否启用 | ❌ 缺失 |

**证据**:
```kotlin
// 位置: FlutterAssetsGenerator/src/main/java/com/crzsc/plugin/utils/Constants.kt
const val KEY_OUTPUT_DIR = "output_dir"
const val KEY_OUTPUT_FILENAME = "output_filename"
const val KEY_AUTO_DETECTION = "auto_detection"
const val DEFAULT_OUTPUT_DIR = "generated"
const val DEFAULT_OUTPUT_FILENAME = "assets"
```

原项目 README.md 中的配置示例：
```yaml
flutter_assets_generator:
  output_dir: generated          # ⬅️ PRD 中缺失
  auto_detection: true           # ⬅️ PRD 中缺失
  named_with_parent: true
  output_filename: assets        # ⬅️ PRD 中缺失
  class_name: Assets
```

**影响分析**:
- 用户无法自定义生成文件的位置和名称
- 无法关闭自动监听功能（可能导致性能问题）
- 降低了插件的灵活性和可用性

**修改建议**:
在 PRD 3.3.1 节补充完整配置清单：

```yaml
flutter_assets_generator:
  # 生成文件输出目录（相对于 lib/ 目录）
  output_dir: generated

  # 生成的 Dart 文件名（不含 .dart 扩展名）
  output_filename: assets

  # 是否自动监听文件变化并重新生成
  auto_detection: true

  # 生成的 Dart 类名
  class_name: Assets

  # 命名风格（camelCase | snake_case | PascalCase）
  naming_style: camelCase

  # 是否在常量名中包含父目录名
  named_with_parent: true

  # 文件名分割规则（正则表达式）
  filename_split_pattern: "[-_]"

  # 是否为 Flutter package 添加 packages/ 前缀
  leading_with_package_name: false

  # 忽略的路径列表
  path_ignore: []
```

---

### 问题 3: `.vscode/settings.json` 配置层级设计冲突

**位置**: PRD 第 72-90 行

**问题描述**:
PRD 提出的"工作区覆盖配置"与原插件的配置层级不匹配，存在概念混乱。

**原插件配置层级**:
```
全局设置 (IDE 级别，存储在 FlutterAssetsGenerator.xml)
    ↓ (优先级低)
项目设置 (pubspec.yaml 的 flutter_assets_generator 节)
```

**PRD 提出的层级**:
```
项目设置 (pubspec.yaml)
    ↓ (优先级低)
工作区覆盖 (.vscode/settings.json 的 prefixOverrides)
```

**冲突分析**:

1. **范围混乱**:
   - `.vscode/settings.json` 在 VSCode 中是**工作区级配置**（可提交到 Git）
   - PRD 第 73 行说"可以随工作区共享"，但同时又说"个性化定制"（第 75 行），自相矛盾
   - 如果目的是"个性化"，应使用用户级设置（`~/Library/Application Support/Code/User/settings.json`）

2. **功能冗余**:
   - 原插件通过 `pubspec.yaml` 本身就能实现团队共享配置
   - `prefixOverrides` 功能可以直接通过调整 `pubspec.yaml` 中的目录结构实现
   - 示例：想要 `imageHomeIcon` 而非 `imagesHomeIcon`，可以将目录改为 `assets/image/` 而非 `assets/images/`

3. **用户困惑**:
   - 三层配置增加了理解成本
   - 用户需要记住：全局设置 < pubspec.yaml < .vscode/settings.json 的优先级
   - 调试配置问题时需要检查多个位置

**修改建议**:

**方案 A (推荐)**: 保留两层配置，删除 `.vscode/settings.json` 覆盖功能
```
VSCode 用户设置 (全局，~/.config/Code/User/settings.json)
    ↓ 优先级低
pubspec.yaml (项目级，团队共享)
```

**方案 B**: 如果确实需要三层，重新定义功能边界
- **用户设置**: 跨项目的个人偏好（如默认 `class_name`、`naming_style`）
- **工作区设置**: 当前 VSCode 工作区的开发环境配置（如 `auto_detection` 开关）
- **pubspec.yaml**: 项目代码生成规范（提交到 Git，团队共享）

优先级: pubspec.yaml > 工作区设置 > 用户设置

**方案 C**: 如果 `prefixOverrides` 是核心需求，改为在 `pubspec.yaml` 中实现
```yaml
flutter_assets_generator:
  prefix_mappings:
    "assets/images/": "image"   # assets/images/home.png -> imageHome
    "assets/audio/": "audio"    # assets/audio/bg.mp3 -> audioBg
```

**建议选择**: 方案 A（简单清晰）或方案 C（功能不丢失）

---

## 🟡 重要遗漏功能 (P1 级别)

### 问题 4: Gutter Icon / CodeLens 预览功能未提及

**问题描述**:
原插件的**亮点功能**之一完全未在 PRD 中体现。

**原插件实现**:
```kotlin
// 位置: FlutterAssetsGenerator/src/main/java/com/crzsc/plugin/provider/AssetsLineMarkerProvider.kt
class AssetsLineMarkerProvider : LineMarkerProvider {
    override fun getLineMarkerInfo(element: PsiElement): LineMarkerInfo<*>? {
        // 检测到资源引用时，在行号旁显示图标
        // 对于图片：显示缩略图
        // 对于 SVG：渲染 SVG 预览
        // 点击可跳转到资源文件
    }
}
```

**效果演示** (来自原项目 README):
- 在 `Assets.imageLoading` 旁边显示图片缩略图
- 点击图标可快速定位到 `assets/images/loading.png`

**VSCode 对应实现**: `vscode.languages.registerCodeLensProvider`

**修改建议**:
在 PRD 第 3 节"功能需求"中新增 3.5 节：

```markdown
### 3.5. 资源可视化预览 (CodeLens)

为生成的资源常量提供可视化预览功能，提升开发体验。

#### 3.5.1. 触发条件
- 在 Dart 文件中检测到 `Assets.xxx` 形式的资源引用
- 或在生成的资源文件（如 `lib/generated/assets.dart`）中

#### 3.5.2. 显示内容
- **图片资源** (png, jpg, gif, webp):
  - 显示图片缩略图（尺寸：16x16 或 32x32）
  - 悬停时显示原始尺寸和文件大小

- **SVG 资源**:
  - 渲染 SVG 预览图
  - 悬停时显示 SVG 尺寸信息

- **其他资源** (字体、音频、视频):
  - 显示文件类型图标
  - 悬停时显示文件路径和大小

#### 3.5.3. 交互功能
- 点击 CodeLens 可快速跳转到资源文件
- 支持通过 `Cmd+Click` (Mac) / `Ctrl+Click` (Win) 在新标签页打开

#### 3.5.4. 配置项
```yaml
flutter_assets_generator:
  enable_code_lens: true          # 是否启用 CodeLens 预览
  code_lens_thumbnail_size: 32    # 缩略图尺寸 (16 | 32)
```
```

---

### 问题 5: 多模块支持的实现细节缺失

**位置**: PRD 第 127 行（未来规划）

**问题描述**:
PRD 将多模块支持列为"未来规划"，但原插件**已经实现**了多模块支持。

**原插件实现**:
```kotlin
// 位置: FlutterAssetsGenerator/src/main/java/com/crzsc/plugin/utils/FileHelperNew.kt:26-39
fun generateFileForAllFlutterModules(project: Project) {
    project.allModules()
        .filter { FlutterModuleUtils.isFlutterModule(it) }  // 过滤 Flutter 模块
        .forEach { module ->
            val config = getPubSpecConfig(module)
            if (config != null) {
                generateOne(config)  // 为每个模块生成独立的资源文件
            }
        }
}
```

**功能特性**:
1. 自动识别项目中的所有 Flutter 模块
2. 为每个模块独立生成资源文件
3. 每个模块可有独立的配置

**VSCode 对应场景**: Multi-root Workspace（多根工作区）

**修改建议**:

1. **将多模块支持移至核心功能**（第 3 节），而非未来规划
2. **在 3.1 节补充多模块处理逻辑**:

```markdown
#### 3.1.4. 多模块 / 多根工作区支持

插件支持以下场景：

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
→ 插件自动检测所有 Flutter 项目（通过 `pubspec.yaml` 中的 `flutter:` 节）
→ 分别为每个项目生成独立的资源文件
→ 支持在命令面板选择"为当前项目生成"或"为所有项目生成"

**实现逻辑**:
1. 使用 `vscode.workspace.workspaceFolders` 获取所有根目录
2. 递归搜索每个根目录下的 `pubspec.yaml`
3. 解析 YAML，检查是否包含 `flutter:` 节点（判断是否为 Flutter 项目）
4. 为每个 Flutter 项目独立生成资源文件
```

---

### 问题 6: 右键菜单功能未提及

**位置**: 无（PRD 中完全未提及）

**问题描述**:
原插件提供了便捷的右键菜单功能，可快速将目录添加到 `pubspec.yaml`。

**原插件实现**:
```kotlin
// 位置: FlutterAssetsGenerator/src/main/java/com/crzsc/plugin/actions/GenerateDirAction.kt
class GenerateDirAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        // 1. 获取用户右键选择的文件/文件夹
        // 2. 计算相对于项目根目录的路径
        // 3. 自动添加到 pubspec.yaml 的 flutter.assets 数组
        // 4. 清理不存在的路径
        // 5. 触发资源生成
    }
}
```

**功能演示** (来自原项目 README):
> Right-click on folder or file, then click `Flutter: Configuring Paths`.

**修改建议**:

在 PRD 3.1 节"触发方式"中补充：

```markdown
### 3.1. 自动生成资源引用文件

*   **触发方式**:
    *   **方式 1: 命令面板手动触发**
        按 `Cmd+Shift+P` (Mac) / `Ctrl+Shift+P` (Win)，选择 `Flutter: Generate Assets`

    *   **方式 2: 自动监听触发**
        插件监听 `pubspec.yaml` 中定义的资源路径，当文件增删改时自动重新生成

    *   **方式 3: 右键菜单快速添加** ⬅️ 新增
        - 在 VSCode 资源管理器中右键点击文件夹或文件
        - 选择 `Flutter: Add to Assets`
        - 插件自动将该路径添加到 `pubspec.yaml` 的 `flutter.assets` 数组
        - 自动触发资源生成
        - **智能处理**:
          - 如果选择文件夹，添加 `assets/images/` (带尾部斜杠)
          - 如果选择单个文件，添加 `assets/icon.png` (不带斜杠)
          - 自动去除重复路径
          - 自动清理不存在的路径
```

**package.json 中的配置** (已包含):
```json
"menus": {
  "explorer/context": [
    {
      "command": "flutter-assets-generator.addToAssets",
      "when": "explorerResourceIsFolder || resourceExtname =~ /\\.(png|jpg|svg|gif|webp|ttf|otf|mp3|mp4)$/",
      "group": "flutter@1"
    }
  ]
}
```

---

## 🟢 次要问题 (P2 级别)

### 问题 7: 忽略规则描述不完整

**位置**: PRD 第 67-68 行

**问题描述**:
PRD 只提到用户配置的 `path_ignore`，但原插件还有两类自动忽略规则。

**原插件实现**:
```kotlin
// 位置: FlutterAssetsGenerator/src/main/java/com/crzsc/plugin/utils/FileGenerator.kt:24
private val ignoreList = listOf("2.0x", "3.0x", "Mx", "Nx")  // 硬编码忽略

// 位置: 同文件 109 行
root.children.filter {
    !it.name.startsWith('.') &&        // 自动忽略隐藏文件
    checkName(it.name) &&              // 检查是否在硬编码忽略列表
    !pathIgnore                         // 检查用户自定义 path_ignore
}
```

**忽略逻辑**:
1. **自动忽略隐藏文件**: 所有以 `.` 开头的文件/文件夹
2. **自动忽略密度变体**: `2.0x/`, `3.0x/`, `Mx/`, `Nx/` 目录（Flutter 多密度资源）
3. **用户自定义忽略**: `path_ignore` 配置项

**修改建议**:

在 PRD 3.1 节补充"文件过滤规则"：

```markdown
#### 3.1.3. 文件过滤规则

插件在扫描资源时，会自动跳过以下类型的文件/文件夹：

**自动忽略规则** (无法配置):
1. **隐藏文件/文件夹**: 以 `.` 开头的项（如 `.DS_Store`、`.gitkeep`）
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
- 支持相对路径匹配（从项目根目录开始）
- 支持目录匹配（以 `/` 结尾）
- 支持单个文件匹配

**调试技巧**:
- 生成时会在 OUTPUT 面板显示被忽略的文件数量
- 可通过 `Flutter: Show Ignored Assets` 命令查看完整忽略列表
```

---

### 问题 8: 文件名处理规则不明确

**位置**: PRD 第 31-45 行（命名规范）

**问题描述**:
PRD 未说明文件名的预处理规则，导致以下边界情况不明确：
- 文件名包含 `.` (如 `icon.v2.png`)
- 文件名包含 `@` (如 `icon@2x.png`)
- 大小写混合 (如 `HomeIcon.png`)

**原插件处理逻辑**:
```kotlin
// 位置: FlutterAssetsGenerator/src/main/java/com/crzsc/plugin/utils/FileGenerator.kt:143
var key = it.nameWithoutExtension     // 1. 移除扩展名: "icon.v2.png" -> "icon.v2"
    .replace(".", "_")                // 2. 点号转下划线: "icon.v2" -> "icon_v2"
    .toLowCamelCase(regex)            // 3. 应用 camelCase: "icon_v2" -> "iconV2"

// 位置: PluginUtils.kt:36
fun String.toLowCamelCase(regex: Regex): String {
    val newStr = this.replace(Regex("[@]"), "")  // 删除 @ 符号
    // ... 后续处理
}
```

**处理顺序**:
1. 移除文件扩展名
2. 删除 `@` 符号
3. 将 `.` 替换为 `_`
4. 应用 `filename_split_pattern` 分割（默认 `[-_]`）
5. 应用命名风格转换

**示例**:
| 原文件名 | 处理步骤 | 最终常量名 |
|---------|---------|-----------|
| `icon@2x.png` | `icon@2x` → `icon2x` → `icon2x` | `icon2x` |
| `home.icon.png` | `home.icon` → `home_icon` → `homeIcon` | `homeIcon` |
| `HomeIcon.png` | `HomeIcon` → `HomeIcon` → `homeIcon` | `homeIcon` |
| `bg-image_v2.jpg` | `bg-image_v2` → `bgImageV2` | `bgImageV2` |

**修改建议**:

在 PRD 3.2 节补充"文件名预处理规则"：

```markdown
### 3.2. 资源命名规范

#### 3.2.1. 文件名预处理流程

在应用命名风格前，文件名会经过以下预处理步骤：

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
步骤 4: 应用 filename_split_pattern 分割（默认 [-_]）
    → ["home", "icon2x"]
    ↓
步骤 5: 应用命名风格转换 (camelCase)
    → "homeIcon2x"
    ↓
步骤 6: 如果 named_with_parent: true，添加父目录前缀
    → "imagesHomeIcon2x"
```

#### 3.2.2. 特殊字符处理规则

| 字符 | 处理方式 | 示例 |
|-----|---------|------|
| `.` | 替换为 `_` | `icon.v2.png` → `iconV2` |
| `@` | 删除 | `icon@2x.png` → `icon2x` |
| `-` | 作为分隔符（默认） | `home-icon.png` → `homeIcon` |
| `_` | 作为分隔符（默认） | `home_icon.png` → `homeIcon` |
| 空格 | 保留但不推荐 | `home icon.png` → `homeIcon` |
| 大写字母 | 转为小写后处理 | `HomeIcon.png` → `homeIcon` |

**注意事项**:
- 文件名分隔符可通过 `filename_split_pattern` 自定义（正则表达式）
- 不推荐文件名包含空格、中文或其他特殊字符
- 如果文件名以数字开头（如 `404.png`），生成的常量名为 `n404`（Dart 标识符规范）
```

---

### 问题 9: 配置项名称错误

**位置**: PRD 第 57 行

**问题描述**:
PRD 中的配置项名称与原插件不匹配。

**PRD 中**: `package_parameter_enabled`
**原插件中**: `leading_with_package_name`

**证据**:
```kotlin
// 位置: FlutterAssetsGenerator/src/main/java/com/crzsc/plugin/utils/Constants.kt:18
const val KEY_LEADING_WITH_PACKAGE_NAME = "leading_with_package_name"
```

**修改建议**:

修正 PRD 3.3.1 节配置项：

```yaml
flutter_assets_generator:
  # 修正前:
  # package_parameter_enabled: false

  # 修正后:
  leading_with_package_name: false  # 是否为 Flutter package 添加 packages/{name}/ 前缀
```

**功能说明补充**:

```markdown
#### leading_with_package_name 配置说明

**使用场景**: 当你的项目是一个 **Flutter package**（发布到 pub.dev 的库）时使用。

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

当其他项目依赖你的 package 时，访问你的资源需要使用 `packages/` 前缀：
```dart
// 在使用你的 package 的项目中
Image.asset('packages/my_ui_kit/assets/icons/home.png')
```

如果开启此配置，你的 package 中的代码也可以使用同样的路径，确保一致性。
```

---

### 问题 10: 命名冲突解决策略未说明

**位置**: 无（PRD 中完全未提及）

**问题描述**:
当两个不同路径的文件生成相同常量名时，PRD 未说明处理策略。

**原插件策略**:
```kotlin
// 位置: FlutterAssetsGenerator/src/main/java/com/crzsc/plugin/utils/FileGenerator.kt:145-151
if (namedWithParent) {
    key = "${parent.name.toLowCamelCase(regex)}${key.upperCaseFirst()}"

    // 如果仍冲突，添加祖父目录名
    if (map.containsKey(key)) {
        key = "${parent.parent.name.toLowCamelCase(regex)}${key.upperCaseFirst()}"
    }
    map[key] = value  // 如果还冲突，后者覆盖前者（无警告）
}
```

**冲突示例**:
```
assets/
├── images/
│   └── icon.png       → icon
├── icons/
│   └── icon.png       → icon  ⚠️ 冲突！
└── ui/
    ├── light/
    │   └── bg.png     → bg
    └── dark/
        └── bg.png     → bg    ⚠️ 冲突！
```

**解决策略**:
1. **如果 `named_with_parent: true`**: 自动添加父目录名
   - `assets/images/icon.png` → `imagesIcon`
   - `assets/icons/icon.png` → `iconsIcon`

2. **如果仍冲突**: 添加祖父目录名
   - `assets/ui/light/bg.png` → `uiLightBg`
   - `assets/ui/dark/bg.png` → `uiDarkBg`

3. **如果依然冲突**: **后扫描的文件覆盖前者**（原插件无警告，建议改进）

**修改建议**:

在 PRD 3.2 节补充"命名冲突解决"：

```markdown
### 3.2.3. 命名冲突处理

当多个资源文件生成相同的常量名时，插件按以下策略解决：

#### 策略 1: 启用 `named_with_parent`（默认）

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

#### 策略 2: 多层目录冲突

```
assets/ui/light/bg.png   → uiLightBg (父+祖父)
assets/ui/dark/bg.png    → uiDarkBg  (父+祖父)
```

#### 策略 3: 仍然冲突时的行为

如果经过上述处理仍存在冲突（极少见），插件会：

**原 Android Studio 插件行为** (不推荐):
- 后扫描的文件**静默覆盖**前者
- 无警告提示

**VSCode 插件改进建议** (推荐):
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

#### 最佳实践

为避免命名冲突，建议：
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
```

---

## 📋 文档结构改进建议 (P3 级别)

### 问题 11: 缺少迁移对比表

**建议**: 在 PRD 第 2 节"目标"后新增 **2.1 功能迁移对照表**

```markdown
## 2.1. 功能迁移对照表

| 功能分类 | 功能点 | Android Studio | VSCode | 备注 |
|---------|-------|---------------|--------|------|
| **核心功能** | | | | |
| | 扫描资源文件 | ✅ | ✅ | 完全迁移 |
| | 生成 Dart 代码 | ✅ | ✅ | 完全迁移 |
| | pubspec.yaml 配置 | ✅ | ✅ | 完全迁移 |
| **命名风格** | | | | |
| | camelCase | ✅ | ✅ | 完全迁移 |
| | snake_case | ❌ | ⚠️ | **新增功能**（待评审） |
| | PascalCase | ❌ | ⚠️ | **新增功能**（待评审） |
| **文件监听** | | | | |
| | 自动检测变化 | ✅ | ✅ | 技术适配（chokidar） |
| | 300ms 防抖 | ✅ | ✅ | VSCode API 自带 |
| **配置系统** | | | | |
| | 全局设置 | ✅ (IDE Settings) | ✅ (User Settings) | 技术适配 |
| | 项目设置 | ✅ (pubspec.yaml) | ✅ (pubspec.yaml) | 完全迁移 |
| | 工作区覆盖 | ❌ | ⚠️ | **新增功能**（待评审） |
| **可视化功能** | | | | |
| | Gutter Icon 预览 | ✅ | ✅ (CodeLens) | 技术适配 |
| | 点击跳转 | ✅ | ✅ | 技术适配 |
| | SVG 渲染 | ✅ | ✅ | VSCode 原生支持 |
| **快捷操作** | | | | |
| | 命令面板触发 | ✅ | ✅ | 技术适配 |
| | 快捷键 (Alt/Option+G) | ✅ | ✅ | 技术适配 |
| | 右键菜单添加路径 | ✅ | ✅ | 完全迁移 |
| **高级功能** | | | | |
| | 多模块支持 | ✅ | ✅ | 技术适配（Multi-root） |
| | Package 前缀 | ✅ | ✅ | 完全迁移 |
| | 路径忽略 | ✅ | ✅ | 完全迁移 |
| | 自定义分割规则 | ✅ | ✅ | 完全迁移 |
| **未来规划** | | | | |
| | 可视化配置界面 | ❌ | 🚀 | **新增功能** |
| | 实时预览 | ❌ | 🚀 | **新增功能** |
| | 双向同步 | ❌ | 🚀 | **新增功能** |

**图例**:
- ✅ 完全支持
- ⚠️ 需评审确认
- 🚀 规划中
- ❌ 不支持
```

---

### 问题 12: 技术可行性分析缺失

**建议**: 在 PRD 第 5 节"技术方案"中补充 **5.2 关键技术挑战与解决方案**

```markdown
### 5.2. 关键技术挑战与解决方案

#### 挑战 1: YAML 修改需保留格式和注释

**问题**:
- `js-yaml` 的 `dump()` 方法会丢失原始格式和注释
- 用户手动编写的 pubspec.yaml 格式会被破坏

**解决方案**:
```typescript
import * as yaml from 'js-yaml';
import * as fs from 'fs';

// 方案 A: 使用 yaml.dump 的 preserveOrder 选项 (部分保留)
const options = {
  noRefs: true,
  sortKeys: false,
  lineWidth: -1  // 不自动换行
};

// 方案 B: 使用正则表达式直接修改文本 (推荐)
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

**推荐**: 使用正则表达式进行局部修改，避免完全重新序列化。

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

#### 挑战 3: CodeLens 图片预览的实现

**问题**:
- VSCode CodeLens API 不直接支持显示图片
- 需要自定义方案实现预览

**解决方案**:
```typescript
import * as vscode from 'vscode';

class AssetCodeLensProvider implements vscode.CodeLensProvider {
  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];
    const text = document.getText();

    // 匹配 Assets.xxx 模式
    const regex = /Assets\.(\w+)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const range = new vscode.Range(
        document.positionAt(match.index),
        document.positionAt(match.index + match[0].length)
      );

      const assetName = match[1];
      const assetPath = this.resolveAssetPath(assetName);

      // 方案 A: 使用 DecorationRenderOptions (仅限行内装饰)
      // 方案 B: 使用 CodeLens 显示 "👁 Preview" 按钮，点击打开预览
      const command: vscode.Command = {
        title: "$(file-media) Preview",
        command: 'flutter-assets-generator.previewAsset',
        arguments: [assetPath]
      };

      codeLenses.push(new vscode.CodeLens(range, command));
    }

    return codeLenses;
  }
}

// 预览命令
vscode.commands.registerCommand(
  'flutter-assets-generator.previewAsset',
  (assetPath: string) => {
    const panel = vscode.window.createWebviewPanel(
      'assetPreview',
      'Asset Preview',
      vscode.ViewColumn.Beside,
      { enableScripts: false }
    );

    const imageUri = panel.webview.asWebviewUri(vscode.Uri.file(assetPath));
    panel.webview.html = `
      <!DOCTYPE html>
      <html>
      <body style="background: transparent; text-align: center;">
        <img src="${imageUri}" style="max-width: 100%; height: auto;" />
      </body>
      </html>
    `;
  }
);
```

**推荐实现**:
- 在代码中显示 "$(file-media) Preview" 按钮
- 点击在侧边打开 Webview 预览面板
- 支持图片、SVG、视频的预览

---

#### 挑战 4: Multi-root Workspace 支持

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

// 为所有项目生成资源
async function generateForAllProjects() {
  const projects = await findAllFlutterProjects();

  for (const project of projects) {
    await generateAssets(project);
  }

  vscode.window.showInformationMessage(
    `Generated assets for ${projects.length} Flutter project(s)`
  );
}
```

---

#### 挑战 5: 可视化配置界面的实现

**问题**:
- 需要创建 Webview 面板
- 需要实现界面与配置文件的双向同步
- 需要提供实时预览功能

**解决方案**:
```typescript
// 使用 Webview + 前端框架 (Svelte/Vue)
class ConfigurationWebview {
  private panel: vscode.WebviewPanel | undefined;

  show(context: vscode.ExtensionContext) {
    this.panel = vscode.window.createWebviewPanel(
      'flutterAssetsConfig',
      'Flutter Assets Generator Configuration',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    // 加载 Svelte 构建的 HTML
    const htmlPath = vscode.Uri.joinPath(
      context.extensionUri,
      'webview',
      'index.html'
    );

    // 双向通信
    this.panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'save':
          await this.saveConfiguration(message.data);
          break;
        case 'preview':
          const preview = this.generatePreview(message.data);
          this.panel?.webview.postMessage({ command: 'updatePreview', preview });
          break;
      }
    });
  }

  private async saveConfiguration(config: any) {
    // 读取 pubspec.yaml
    // 更新 flutter_assets_generator 节
    // 写回文件
    // 触发资源生成
  }

  private generatePreview(config: any): string {
    // 根据配置生成示例常量名
    const examplePath = 'assets/images/home_icon.png';
    const constantName = this.generateConstantName(examplePath, config);
    return `static const String ${constantName} = '${examplePath}';`;
  }
}
```

**技术栈建议**:
- 前端: Svelte (轻量) 或 Vue 3 (生态丰富)
- 构建: Vite (快速)
- 通信: postMessage API
- 样式: VSCode Codicons + CSS Variables (主题适配)

---

#### 挑战 6: 测试策略

**问题**:
- 需要测试多种配置组合
- 需要测试文件监听功能
- 需要测试 YAML 解析和修改

**解决方案**:
```typescript
// 单元测试 (使用 Jest)
describe('Naming Conventions', () => {
  test('camelCase conversion', () => {
    expect(toCamelCase('home_icon', /[-_]/)).toBe('homeIcon');
    expect(toCamelCase('icon@2x', /[-_]/)).toBe('icon2x');
  });

  test('with parent directory', () => {
    const result = generateConstantName('assets/images/home.png', {
      namedWithParent: true,
      namingStyle: 'camelCase'
    });
    expect(result).toBe('imagesHome');
  });
});

// 集成测试 (使用 @vscode/test-electron)
describe('Extension Integration Tests', () => {
  test('generates assets file', async () => {
    // 创建临时工作区
    // 创建 pubspec.yaml 和资源文件
    // 触发生成命令
    // 验证输出文件
  });
});
```

**测试覆盖目标**: >80%
```

---

## ✅ PRD 文档的优点

在指出问题的同时，也要肯定 PRD 的优秀之处：

1. **流程图清晰**: 第 7.2 节的代码生成流程图非常直观，能够帮助开发者快速理解业务逻辑

2. **UI 设计前瞻**: 第 7.1 节的可视化配置界面线框图展示了良好的用户体验设计思路

3. **未来规划完善**: 第 6 节展示了清晰的产品发展路线图，体现了长期思考

4. **结构完整**: 涵盖了 PRD 的标准要素（背景、目标、功能、非功能需求、技术方案等）

5. **配置灵活性**: 考虑了多种配置方式，体现了对不同用户需求的关注

6. **技术选型合理**: 选择的技术栈（TypeScript、js-yaml、chokidar）都是业界主流方案

---

## 📝 修订优先级建议

| 优先级 | 问题编号 | 问题描述 | 修复复杂度 | 影响范围 | 建议处理时间 |
|--------|---------|---------|----------|---------|-------------|
| **P0** | #2 | 配置项遗漏 | 低 | 核心功能 | 立即修正 |
| **P0** | #3 | 配置层级冲突 | 中 | 架构设计 | 讨论后决策 |
| **P1** | #1 | 命名风格过度承诺 | 低 | 功能范围 | 明确标注 |
| **P1** | #4 | CodeLens 预览遗漏 | 低 | 用户体验 | 补充功能说明 |
| **P1** | #5 | 多模块支持遗漏 | 低 | 核心功能 | 移至核心功能 |
| **P1** | #6 | 右键菜单遗漏 | 低 | 便捷性 | 补充功能说明 |
| **P2** | #7 | 忽略规则不完整 | 低 | 细节完善 | 补充说明 |
| **P2** | #8 | 文件名处理不明确 | 低 | 细节完善 | 补充说明 |
| **P2** | #9 | 配置项名称错误 | 低 | 规范统一 | 立即修正 |
| **P2** | #10 | 冲突解决策略缺失 | 低 | 边界情况 | 补充说明 |
| **P3** | #11 | 缺少迁移对比表 | 低 | 文档质量 | 可选优化 |
| **P3** | #12 | 技术可行性分析缺失 | 中 | 文档质量 | 可选优化 |

---

## 🎯 后续行动建议

### 第一步: 核心问题确认 (本周)
1. ✅ 确认是否保留 `snake_case` 和 `PascalCase` 支持（问题 #1）
2. ✅ 确认配置层级设计方案（问题 #3）
3. ✅ 补充遗漏的配置项（问题 #2、#9）

### 第二步: PRD 修订 (下周)
1. 根据确认结果修订第 3 节"功能需求"
2. 补充遗漏的功能说明（问题 #4、#5、#6）
3. 完善边界情况说明（问题 #7、#8、#10）

### 第三步: 文档增强 (可选)
1. 添加迁移对比表（问题 #11）
2. 补充技术可行性分析（问题 #12）
3. 添加示例项目结构和生成结果示例

### 第四步: 原型验证
1. 创建 VSCode 插件脚手架项目
2. 实现核心功能 MVP（资源扫描 + 代码生成）
3. 验证技术方案可行性
4. 根据实际开发情况调整 PRD

---

## 📚 参考资料

### 原项目分析报告
- **项目位置**: `/Users/yuyi/Downloads/venv/manhuagui/FlutterAssetsGenerator/`
- **关键源码位置**:
  - 配置常量: `src/main/java/com/crzsc/plugin/utils/Constants.kt`
  - 资源扫描: `src/main/java/com/crzsc/plugin/utils/FileGenerator.kt`
  - 命名转换: `src/main/java/com/crzsc/plugin/utils/PluginUtils.kt`
  - 配置读取: `src/main/java/com/crzsc/plugin/utils/FileHelperNew.kt`
  - 文件监听: `src/main/java/com/crzsc/plugin/listener/PsiTreeListener.kt`
  - CodeLens: `src/main/java/com/crzsc/plugin/provider/AssetsLineMarkerProvider.kt`

### VSCode 扩展开发文档
- [Extension API](https://code.visualstudio.com/api)
- [CodeLens Provider](https://code.visualstudio.com/api/references/vscode-api#CodeLensProvider)
- [File System Watcher](https://code.visualstudio.com/api/references/vscode-api#FileSystemWatcher)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)

---

**评审人**: Claude (Sonnet 4.5)
**联系方式**: 如有疑问或需要进一步讨论，请在项目 issue 中反馈

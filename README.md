# Flutter Assets Generator for VSCode

> 自动生成 Flutter 资源引用的 Dart 代码，提高开发效率

这是从 Android Studio/IntelliJ IDEA 插件 [FlutterAssetsGenerator](https://github.com/flutter-dev/FlutterAssetsGenerator) 迁移到 VSCode 的版本。

## 🚧 开发状态

**当前状态**: 核心功能开发完成

核心功能已实现（阶段 1-8），包括：
- ✅ 配置系统
- ✅ 资源扫描
- ✅ 命名转换
- ✅ 代码生成
- ✅ 文件监听
- ✅ VSCode 命令集成

相关文档：
- [PRD 最终版](./docs/PRD_FINAL.md)
- [TODO 任务列表](./TODO.md)

## ✨ 功能特性

### 已实现功能
- ✅ 自动扫描 `pubspec.yaml` 中配置的资源路径
- ✅ 生成包含所有资源常量的 Dart 类
- ✅ 支持多种命名风格 (camelCase / snake_case / PascalCase)
- ✅ 文件变化自动监听并重新生成
- ✅ 右键菜单快速添加资源路径
- ✅ 多根工作区支持
- ✅ 命名冲突自动检测和解决
- ✅ 路径过滤和忽略规则
- ✅ 输出日志和详细信息

### 待实现功能
- ⏳ Hover 提示显示资源详情
- ⏳ 点击跳转到资源文件
- ⏳ 单元测试和集成测试
- ⏳ 完整文档和示例项目

## 🚀 使用方法

### 1. 配置 pubspec.yaml

在你的 `pubspec.yaml` 中添加资源路径：

```yaml
flutter:
  assets:
    - assets/images/
    - assets/icons/
```

可选：添加生成配置（使用默认值可跳过）：

```yaml
flutter_assets_generator:
  output_dir: generated        # 输出目录（默认：generated）
  output_filename: assets      # 输出文件名（默认：assets）
  class_name: Assets           # 类名（默认：Assets）
  naming_style: camelCase      # 命名风格（默认：camelCase）
  named_with_parent: true      # 包含父目录名（默认：true）
  auto_detection: true         # 自动检测（默认：true）
```

### 2. 生成资源代码

打开命令面板（Ctrl+Shift+P 或 Cmd+Shift+P），运行：

```
Flutter: Generate Assets
```

或者右键点击资源文件/文件夹，选择 **"Flutter: Add to Assets"**。

### 3. 使用生成的代码

生成的文件位于 `lib/generated/assets.dart`：

```dart
import 'package:your_app/generated/assets.dart';

// 使用资源常量
Image.asset(Assets.imagesLogo);
```

## 🛠️ 开发环境设置

### 前置要求
- Node.js >= 18.0.0
- VSCode >= 1.80.0

### 安装依赖
```bash
cd flutter-assets-generator-vscode
npm install
```

### 编译项目
```bash
npm run compile
```

### 开发模式（监听变化）
```bash
npm run watch
```

### 运行扩展
1. 在 VSCode 中打开本项目
2. 按 `F5` 启动调试
3. 会打开一个新的 VSCode 窗口，加载了本扩展

### 运行测试
```bash
npm test
```

## 📁 项目结构

```
flutter-assets-generator-vscode/
├── src/
│   ├── extension.ts          # 扩展入口文件
│   ├── commands/             # VSCode 命令实现
│   ├── config/               # 配置管理
│   ├── core/                 # 核心业务逻辑
│   │   ├── AssetScanner.ts   # 资源扫描
│   │   ├── AssetGenerator.ts # 生成编排
│   │   ├── AssetWatcher.ts   # 文件监听
│   │   └── CodeGenerator.ts  # Dart 代码生成
│   ├── utils/                # 工具函数
│   │   └── NamingConverter.ts # 命名转换
│   ├── types/                # TypeScript 类型定义
│   └── providers/            # VSCode Provider（待实现）
├── test/                     # 测试文件
│   ├── unit/                 # 单元测试
│   ├── integration/          # 集成测试
│   └── fixtures/             # 测试数据
├── docs/                     # 文档
│   ├── PRD_FINAL.md          # 产品需求文档
│   └── CHANGES.md            # 变更对比
├── out/                      # 编译输出目录
├── package.json              # 扩展清单
├── tsconfig.json             # TypeScript 配置
├── TODO.md                   # 任务列表
└── README.md                 # 本文件
```

## 🔗 相关链接

- [原 Android Studio 插件](https://github.com/flutter-dev/FlutterAssetsGenerator)
- [VSCode 扩展开发文档](https://code.visualstudio.com/api)

## 📄 许可证

MIT License

---

**状态**: 核心功能已完成，可进行测试和使用。欢迎提出问题和建议！

# Flutter Assets Generator for VSCode

> 自动生成 Flutter 资源引用的 Dart 代码，提高开发效率

这是从 Android Studio/IntelliJ IDEA 插件 [FlutterAssetsGenerator](https://github.com/flutter-dev/FlutterAssetsGenerator) 迁移到 VSCode 的版本。

## 🚧 开发状态

**当前状态**: 需求评审阶段

本项目正在进行需求评审，请查看以下文档：
- [PRD 产品需求文档](./docs/PRD.md)
- [PRD 评审报告](./docs/PRD_REVIEW.md)

## 📋 功能规划

### 核心功能
- ✅ 自动扫描 `pubspec.yaml` 中配置的资源路径
- ✅ 生成包含所有资源常量的 Dart 类
- ✅ 支持 camelCase 命名风格
- ✅ 文件变化自动监听并重新生成
- ✅ 右键菜单快速添加资源路径

### 高级功能
- ⚠️ 多种命名风格支持 (camelCase / snake_case / PascalCase) - 待评审
- ✅ CodeLens 资源预览
- ✅ 多根工作区支持
- 🚀 可视化配置界面 - 规划中

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
│   ├── generator/             # 代码生成逻辑
│   ├── parser/                # pubspec.yaml 解析
│   ├── watcher/               # 文件监听
│   └── providers/             # CodeLens 等提供者
├── docs/
│   ├── PRD.md                 # 产品需求文档
│   └── PRD_REVIEW.md          # PRD 评审报告
├── out/                       # 编译输出目录
├── package.json               # 扩展清单
├── tsconfig.json              # TypeScript 配置
└── README.md                  # 本文件
```

## 🔗 相关链接

- [原 Android Studio 插件](https://github.com/flutter-dev/FlutterAssetsGenerator)
- [VSCode 扩展开发文档](https://code.visualstudio.com/api)

## 📄 许可证

MIT License

---

**注意**: 本项目目前处于开发初期，请先查看文档确认需求后再开始实现。

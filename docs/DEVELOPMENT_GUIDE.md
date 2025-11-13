# 开发指南

本文档提供项目的开发指南和最佳实践。

## 📋 开发流程

### 1. 需求评审阶段 (当前)

**任务清单**:
- [x] 阅读 PRD 文档 (`docs/PRD.md`)
- [x] 阅读 PRD 评审报告 (`docs/PRD_REVIEW.md`)
- [ ] 确认核心功能范围
- [ ] 确认技术方案
- [ ] 确认配置层级设计
- [ ] 更新 PRD 文档（如有需要）

**关键决策点**:
1. 是否支持 `snake_case` 和 `PascalCase` 命名风格？
2. 是否实现 `.vscode/settings.json` 配置覆盖功能？
3. 配置层级如何设计（2 层 vs 3 层）？

### 2. 设计阶段

**任务清单**:
- [ ] 设计目录结构
- [ ] 设计类和接口
- [ ] 设计配置读取逻辑
- [ ] 设计文件监听机制
- [ ] 编写技术设计文档

### 3. 实现阶段

**Phase 1 - MVP (最小可行产品)**:
- [ ] pubspec.yaml 解析
- [ ] 资源文件扫描
- [ ] camelCase 命名转换
- [ ] 代码生成
- [ ] 命令面板触发

**Phase 2 - 核心功能**:
- [ ] 文件监听 (chokidar)
- [ ] 配置读取（全局 + 项目）
- [ ] 父目录命名支持
- [ ] 重复命名处理
- [ ] 自动创建输出目录

**Phase 3 - 增强功能**:
- [ ] CodeLens 预览
- [ ] 右键菜单添加路径
- [ ] 多根工作区支持
- [ ] 通知和错误处理

**Phase 4 - 高级功能**:
- [ ] 多种命名风格（如果确认）
- [ ] 可视化配置界面
- [ ] 实时预览

### 4. 测试阶段

**单元测试**:
- [ ] 命名转换函数
- [ ] 配置解析逻辑
- [ ] 文件过滤规则
- [ ] 代码生成逻辑

**集成测试**:
- [ ] 完整生成流程
- [ ] 文件监听功能
- [ ] 多项目支持

**手动测试**:
- [ ] 在真实 Flutter 项目中测试
- [ ] 测试边界情况
- [ ] 性能测试

### 5. 发布阶段

- [ ] 编写用户文档
- [ ] 录制演示视频
- [ ] 发布到 VSCode Marketplace

---

## 🏗️ 架构设计

### 目录结构

```
src/
├── extension.ts              # 扩展入口，注册命令和事件
├── core/
│   ├── generator.ts          # 代码生成器
│   ├── scanner.ts            # 资源扫描器
│   └── naming.ts             # 命名转换工具
├── config/
│   ├── reader.ts             # 配置读取
│   ├── types.ts              # 配置类型定义
│   └── validator.ts          # 配置验证
├── parser/
│   ├── pubspec.ts            # pubspec.yaml 解析
│   └── yaml-utils.ts         # YAML 工具函数
├── watcher/
│   ├── file-watcher.ts       # 文件监听
│   └── debounce.ts           # 防抖工具
├── providers/
│   ├── code-lens.ts          # CodeLens 提供者
│   └── preview.ts            # 预览逻辑
├── commands/
│   ├── generate.ts           # 生成命令
│   ├── add-to-assets.ts      # 添加到 pubspec 命令
│   └── open-settings.ts      # 打开设置命令
└── utils/
    ├── file-utils.ts         # 文件操作工具
    ├── path-utils.ts         # 路径处理工具
    └── logger.ts             # 日志工具
```

### 核心类设计

```typescript
// config/types.ts
export interface AssetConfig {
  outputDir: string;
  outputFilename: string;
  className: string;
  namingStyle: 'camelCase' | 'snake_case' | 'PascalCase';
  namedWithParent: boolean;
  filenameSplitPattern: string;
  leadingWithPackageName: boolean;
  pathIgnore: string[];
  autoDetection: boolean;
}

// core/scanner.ts
export class AssetScanner {
  scan(paths: string[], config: AssetConfig): Map<string, string>;
  shouldIgnore(path: string, config: AssetConfig): boolean;
}

// core/naming.ts
export class NamingConverter {
  toCamelCase(filename: string, pattern: RegExp): string;
  toSnakeCase(filename: string, pattern: RegExp): string;
  toPascalCase(filename: string, pattern: RegExp): string;
  withParent(name: string, parent: string, pattern: RegExp): string;
}

// core/generator.ts
export class CodeGenerator {
  generate(assets: Map<string, string>, config: AssetConfig): string;
  resolveConflicts(assets: Map<string, string>): Map<string, string>;
}

// parser/pubspec.ts
export class PubspecParser {
  parse(content: string): PubspecData;
  getAssetPaths(): string[];
  getConfig(): AssetConfig;
  addAssetPath(path: string): void;
}
```

---

## 🧪 测试策略

### 单元测试示例

```typescript
// tests/naming.test.ts
import { NamingConverter } from '../src/core/naming';

describe('NamingConverter', () => {
  const converter = new NamingConverter();
  const pattern = /[-_]/;

  describe('toCamelCase', () => {
    test('converts snake_case to camelCase', () => {
      expect(converter.toCamelCase('home_icon', pattern)).toBe('homeIcon');
    });

    test('converts kebab-case to camelCase', () => {
      expect(converter.toCamelCase('home-icon', pattern)).toBe('homeIcon');
    });

    test('handles dots in filename', () => {
      expect(converter.toCamelCase('icon.v2', pattern)).toBe('iconV2');
    });

    test('handles @ symbol', () => {
      expect(converter.toCamelCase('icon@2x', pattern)).toBe('icon2x');
    });
  });

  describe('withParent', () => {
    test('adds parent directory name', () => {
      const result = converter.withParent('homeIcon', 'images', pattern);
      expect(result).toBe('imagesHomeIcon');
    });
  });
});
```

### 集成测试示例

```typescript
// tests/integration/generate.test.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

describe('Generate Assets Integration', () => {
  test('generates assets file for Flutter project', async () => {
    // 1. 创建临时工作区
    const workspaceFolder = createTempWorkspace();

    // 2. 创建 pubspec.yaml
    const pubspecContent = `
name: test_app
flutter:
  assets:
    - assets/images/
`;
    fs.writeFileSync(
      path.join(workspaceFolder, 'pubspec.yaml'),
      pubspecContent
    );

    // 3. 创建资源文件
    const assetsDir = path.join(workspaceFolder, 'assets', 'images');
    fs.mkdirSync(assetsDir, { recursive: true });
    fs.writeFileSync(path.join(assetsDir, 'home_icon.png'), '');

    // 4. 触发生成命令
    await vscode.commands.executeCommand('flutter-assets-generator.generate');

    // 5. 验证生成的文件
    const outputPath = path.join(
      workspaceFolder,
      'lib',
      'generated',
      'assets.dart'
    );
    expect(fs.existsSync(outputPath)).toBe(true);

    const content = fs.readFileSync(outputPath, 'utf-8');
    expect(content).toContain('class Assets');
    expect(content).toContain('imagesHomeIcon');
    expect(content).toContain('assets/images/home_icon.png');

    // 6. 清理
    cleanupTempWorkspace(workspaceFolder);
  });
});
```

---

## 🐛 调试技巧

### 1. 启用详细日志

```typescript
// src/utils/logger.ts
export class Logger {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('Flutter Assets Generator');
  }

  info(message: string) {
    this.outputChannel.appendLine(`[INFO] ${message}`);
  }

  debug(message: string) {
    if (process.env.DEBUG) {
      this.outputChannel.appendLine(`[DEBUG] ${message}`);
    }
  }

  error(message: string, error?: Error) {
    this.outputChannel.appendLine(`[ERROR] ${message}`);
    if (error) {
      this.outputChannel.appendLine(error.stack || error.message);
    }
    this.outputChannel.show();
  }
}
```

### 2. 使用 VSCode 调试器

在 `.vscode/launch.json` 中已配置好调试环境：
- 按 `F5` 启动扩展宿主
- 在代码中设置断点
- 在扩展宿主窗口中触发功能

### 3. 查看 OUTPUT 面板

运行时可在 VSCode 的 OUTPUT 面板选择 "Flutter Assets Generator" 查看日志。

---

## 📦 依赖管理

### 核心依赖

```json
{
  "js-yaml": "^4.1.0",      // YAML 解析
  "chokidar": "^3.5.3"      // 文件监听
}
```

### 为什么选择这些库？

**js-yaml**:
- 最流行的 YAML 解析库
- 支持 YAML 1.2 规范
- 可靠且维护良好

**chokidar**:
- 跨平台文件监听库
- 性能优秀，支持大量文件
- 原 Android Studio 插件也使用类似机制

---

## 🚀 性能优化

### 1. 文件扫描优化

```typescript
// 使用 glob 模式快速匹配
import { glob } from 'glob';

async function scanAssets(paths: string[]): Promise<string[]> {
  const patterns = paths.map(p => `${p}**/*`);
  return await glob(patterns, {
    ignore: ['**/.*', '**/2.0x/**', '**/3.0x/**'],  // 排除隐藏文件和密度变体
    nodir: true  // 只返回文件
  });
}
```

### 2. 防抖优化

```typescript
// 使用防抖避免频繁重新生成
import { debounce } from 'lodash';

class AssetWatcher {
  private generateDebounced = debounce(() => {
    this.generate();
  }, 300);  // 300ms 防抖，与原插件一致

  onFileChange() {
    this.generateDebounced();
  }
}
```

### 3. 缓存优化

```typescript
// 缓存配置读取结果
class ConfigCache {
  private cache = new Map<string, AssetConfig>();

  get(pubspecPath: string): AssetConfig | undefined {
    return this.cache.get(pubspecPath);
  }

  set(pubspecPath: string, config: AssetConfig) {
    this.cache.set(pubspecPath, config);
  }

  invalidate(pubspecPath: string) {
    this.cache.delete(pubspecPath);
  }
}
```

---

## 📚 参考资料

### VSCode 扩展开发
- [Extension API](https://code.visualstudio.com/api)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Testing Extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension)

### 原项目源码
- 命名转换: `FlutterAssetsGenerator/src/main/java/com/crzsc/plugin/utils/PluginUtils.kt`
- 资源扫描: `FlutterAssetsGenerator/src/main/java/com/crzsc/plugin/utils/FileGenerator.kt`
- 配置读取: `FlutterAssetsGenerator/src/main/java/com/crzsc/plugin/utils/FileHelperNew.kt`

### TypeScript 最佳实践
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Clean Code TypeScript](https://github.com/labs42io/clean-code-typescript)

---

## 💡 贡献指南

### 提交代码前

1. 运行 lint: `npm run lint`
2. 运行测试: `npm test`
3. 手动测试核心功能
4. 更新 CHANGELOG.md

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 添加 CodeLens 预览功能
fix: 修复命名冲突处理逻辑
docs: 更新开发指南
test: 添加命名转换单元测试
refactor: 重构配置读取逻辑
perf: 优化文件扫描性能
```

---

## 🔄 版本发布流程

### 1. 准备发布
- 更新版本号（package.json）
- 更新 CHANGELOG.md
- 运行所有测试
- 构建生产版本: `npm run vscode:prepublish`

### 2. 打包
```bash
npm install -g @vscode/vsce
vsce package
```

### 3. 发布
```bash
vsce publish
```

### 4. 发布后
- 在 GitHub 创建 Release
- 通知用户更新
- 收集反馈

---

## ❓ 常见问题

### Q1: 如何添加新的命名风格？

在 `src/core/naming.ts` 中添加新方法：

```typescript
export class NamingConverter {
  // 现有方法...

  // 新增命名风格
  toUpperSnakeCase(filename: string, pattern: RegExp): string {
    const parts = this.preprocess(filename).split(pattern);
    return parts.map(p => p.toUpperCase()).join('_');
  }
}
```

然后在 `src/core/generator.ts` 中使用：

```typescript
switch (config.namingStyle) {
  case 'camelCase':
    return this.naming.toCamelCase(filename, pattern);
  case 'UPPER_SNAKE_CASE':  // 新增
    return this.naming.toUpperSnakeCase(filename, pattern);
}
```

### Q2: 如何调试文件监听功能？

在 `src/utils/logger.ts` 中启用详细日志：

```typescript
this.watcher.on('add', (path) => {
  this.logger.debug(`File added: ${path}`);
});
```

### Q3: 如何处理大型项目的性能问题？

1. 使用 `path_ignore` 排除不需要的目录
2. 关闭 `auto_detection`，手动触发生成
3. 优化正则表达式性能
4. 考虑使用 Worker 线程处理大量文件

---

**最后更新**: 2025-11-13

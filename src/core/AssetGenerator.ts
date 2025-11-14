import * as vscode from 'vscode';
import { ConfigManager } from '../config/ConfigManager';
import { AssetScanner } from './AssetScanner';
import { NamingConverter } from '../utils/NamingConverter';
import { CodeGenerator } from './CodeGenerator';

/**
 * Result of asset generation
 */
export interface GenerationResult {
  success: boolean;
  message: string;
  outputPath?: string;
  totalAssets?: number;
  totalIgnored?: number;
  conflicts?: number;
  error?: string;
}

/**
 * Main orchestrator for asset generation
 */
export class AssetGenerator {
  private outputChannel: vscode.OutputChannel;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
  }

  /**
   * Generate assets for a Flutter project
   * @param projectRoot Project root directory
   * @returns Generation result
   */
  async generate(projectRoot: string): Promise<GenerationResult> {
    try {
      this.outputChannel.appendLine(`\n=== Starting asset generation for ${projectRoot} ===`);
      this.outputChannel.appendLine(`Time: ${new Date().toLocaleString()}`);

      // Step 1: Load configuration
      this.outputChannel.appendLine('\n[1/5] Loading configuration...');
      const config = await ConfigManager.loadConfig(projectRoot);
      this.outputChannel.appendLine(`  - Output: lib/${config.output_dir}/${config.output_filename}.dart`);
      this.outputChannel.appendLine(`  - Class name: ${config.class_name}`);
      this.outputChannel.appendLine(`  - Naming style: ${config.naming_style}`);
      this.outputChannel.appendLine(`  - Asset paths: ${config.assetPaths.length} path(s)`);

      // Check if there are any assets configured
      if (config.assetPaths.length === 0) {
        const message = 'No assets configured in pubspec.yaml';
        this.outputChannel.appendLine(`\n❌ ${message}`);
        return {
          success: false,
          message,
        };
      }

      // Step 2: Scan asset files
      this.outputChannel.appendLine('\n[2/5] Scanning asset files...');
      const scanner = new AssetScanner(config);
      const scanResult = await scanner.scan();
      this.outputChannel.appendLine(`  - Found: ${scanResult.totalScanned} file(s)`);
      this.outputChannel.appendLine(`  - Ignored: ${scanResult.totalIgnored} file(s)`);

      if (scanResult.totalIgnored > 0 && scanResult.ignoredPaths.length > 0) {
        this.outputChannel.appendLine('  - Ignored paths:');
        scanResult.ignoredPaths.slice(0, 10).forEach(p => {
          this.outputChannel.appendLine(`    • ${p}`);
        });
        if (scanResult.ignoredPaths.length > 10) {
          this.outputChannel.appendLine(`    ... and ${scanResult.ignoredPaths.length - 10} more`);
        }
      }

      if (scanResult.assets.length === 0) {
        const message = 'No asset files found to generate';
        this.outputChannel.appendLine(`\n⚠️  ${message}`);
        return {
          success: false,
          message,
          totalAssets: 0,
          totalIgnored: scanResult.totalIgnored,
        };
      }

      // Step 3: Generate constant names
      this.outputChannel.appendLine('\n[3/5] Generating constant names...');
      const namingConverter = new NamingConverter(config);
      const constants = namingConverter.generateConstants(scanResult.assets);
      this.outputChannel.appendLine(`  - Generated: ${constants.length} constant(s)`);

      // Check for conflicts
      const conflicts = namingConverter.detectConflicts(constants);
      if (conflicts.length > 0) {
        this.outputChannel.appendLine(`  - ⚠️  Conflicts detected: ${conflicts.length}`);
        conflicts.slice(0, 5).forEach(conflict => {
          this.outputChannel.appendLine(
            `    • ${conflict.name}: ${conflict.asset.relativePath} vs ${conflict.conflictWith}`
          );
        });
        if (conflicts.length > 5) {
          this.outputChannel.appendLine(`    ... and ${conflicts.length - 5} more conflicts`);
        }
      }

      // Step 4: Generate Dart code
      this.outputChannel.appendLine('\n[4/5] Generating Dart code...');
      const codeGenerator = new CodeGenerator(config);
      const code = codeGenerator.generate(constants);
      this.outputChannel.appendLine(`  - Code length: ${code.length} characters`);

      // Step 5: Write to file
      this.outputChannel.appendLine('\n[5/5] Writing to file...');
      const outputPath = await codeGenerator.writeToFile(code);
      this.outputChannel.appendLine(`  - Output: ${outputPath}`);

      // Success
      const message = `✅ Generated ${constants.length} asset constant(s)`;
      this.outputChannel.appendLine(`\n${message}`);
      this.outputChannel.appendLine(`Output: ${outputPath}`);

      return {
        success: true,
        message,
        outputPath,
        totalAssets: constants.length,
        totalIgnored: scanResult.totalIgnored,
        conflicts: conflicts.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.outputChannel.appendLine(`\n❌ Error: ${errorMessage}`);

      if (error instanceof Error && error.stack) {
        this.outputChannel.appendLine('\nStack trace:');
        this.outputChannel.appendLine(error.stack);
      }

      return {
        success: false,
        message: `Failed to generate assets: ${errorMessage}`,
        error: errorMessage,
      };
    }
  }

  /**
   * Generate assets for all Flutter projects in workspace
   * @returns Array of generation results
   */
  async generateAll(): Promise<GenerationResult[]> {
    const projects = await ConfigManager.findAllFlutterProjects();

    if (projects.length === 0) {
      return [
        {
          success: false,
          message: 'No Flutter projects found in workspace',
        },
      ];
    }

    this.outputChannel.appendLine(`\n=== Generating assets for ${projects.length} project(s) ===\n`);

    const results: GenerationResult[] = [];

    for (const projectRoot of projects) {
      const result = await this.generate(projectRoot);
      results.push(result);
    }

    return results;
  }

  /**
   * Show generation result to user
   * @param result Generation result
   * @param showNotifications Whether to show notifications
   */
  showResult(result: GenerationResult, showNotifications: boolean = true): void {
    if (!showNotifications) {
      return;
    }

    if (result.success) {
      vscode.window.showInformationMessage(result.message);
    } else {
      vscode.window.showErrorMessage(result.message);
    }
  }

  /**
   * Show results for multiple projects
   * @param results Array of generation results
   * @param showNotifications Whether to show notifications
   */
  showResults(results: GenerationResult[], showNotifications: boolean = true): void {
    if (!showNotifications) {
      return;
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    if (failCount === 0) {
      vscode.window.showInformationMessage(
        `✅ Generated assets for ${successCount} project(s)`
      );
    } else {
      vscode.window.showWarningMessage(
        `⚠️  Generated assets for ${successCount} project(s), ${failCount} failed`
      );
    }
  }
}

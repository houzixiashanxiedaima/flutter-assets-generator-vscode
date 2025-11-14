import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { AssetGeneratorConfig, PubspecYaml, ResolvedConfig, UserSettings } from '../types/config';

/**
 * Manages configuration reading and parsing for the Flutter Assets Generator
 */
export class ConfigManager {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private static readonly DEFAULT_CONFIG: Required<AssetGeneratorConfig> = {
    output_dir: 'generated',
    output_filename: 'assets',
    auto_detection: true,
    class_name: 'Assets',
    naming_style: 'camelCase',
    named_with_parent: true,
    filename_split_pattern: '[-_]',
    leading_with_package_name: false,
    path_ignore: [],
  };

  /**
   * Find pubspec.yaml in the workspace
   * @param workspaceFolder Workspace folder to search in
   * @returns Path to pubspec.yaml or undefined if not found
   */
  static async findPubspecYaml(workspaceFolder: vscode.WorkspaceFolder): Promise<string | undefined> {
    const pubspecPath = path.join(workspaceFolder.uri.fsPath, 'pubspec.yaml');

    try {
      await fs.promises.access(pubspecPath, fs.constants.R_OK);
      return pubspecPath;
    } catch {
      // Try to find pubspec.yaml in subdirectories
      const files = await vscode.workspace.findFiles(
        new vscode.RelativePattern(workspaceFolder, '**/pubspec.yaml'),
        '**/node_modules/**',
        10
      );

      return files.length > 0 ? files[0].fsPath : undefined;
    }
  }

  /**
   * Find all Flutter projects in the workspace
   * @returns Array of project root paths
   */
  static async findAllFlutterProjects(): Promise<string[]> {
    const projects: string[] = [];
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders) {
      return projects;
    }

    for (const folder of workspaceFolders) {
      const pubspecFiles = await vscode.workspace.findFiles(
        new vscode.RelativePattern(folder, '**/pubspec.yaml'),
        '**/node_modules/**',
        50
      );

      for (const file of pubspecFiles) {
        try {
          const content = await fs.promises.readFile(file.fsPath, 'utf-8');
          const pubspec = yaml.load(content) as PubspecYaml;

          // Check if it's a Flutter project
          if (pubspec.flutter) {
            projects.push(path.dirname(file.fsPath));
          }
        } catch (error) {
          // Skip invalid YAML files
          console.error(`Failed to parse ${file.fsPath}:`, error);
        }
      }
    }

    return projects;
  }

  /**
   * Read and parse pubspec.yaml
   * @param pubspecPath Path to pubspec.yaml
   * @returns Parsed pubspec content
   */
  static async readPubspecYaml(pubspecPath: string): Promise<PubspecYaml> {
    try {
      const content = await fs.promises.readFile(pubspecPath, 'utf-8');
      const pubspec = yaml.load(content) as PubspecYaml;

      if (!pubspec || typeof pubspec !== 'object') {
        throw new Error('Invalid pubspec.yaml format');
      }

      return pubspec;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to read pubspec.yaml: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Load configuration for a Flutter project
   * @param projectRoot Project root directory
   * @returns Resolved configuration with defaults applied
   */
  static async loadConfig(projectRoot: string): Promise<ResolvedConfig> {
    const pubspecPath = path.join(projectRoot, 'pubspec.yaml');
    const pubspec = await this.readPubspecYaml(pubspecPath);

    // Merge user config with defaults
    const userConfig = pubspec.flutter_assets_generator || {};
    const config: Required<AssetGeneratorConfig> = {
      ...this.DEFAULT_CONFIG,
      ...userConfig,
    };

    // Get asset paths from pubspec.yaml
    const assetPaths = pubspec.flutter?.assets || [];

    // Validate configuration
    this.validateConfig(config);

    return {
      ...config,
      projectRoot,
      packageName: pubspec.name,
      assetPaths,
    };
  }

  /**
   * Validate configuration values
   * @param config Configuration to validate
   */
  private static validateConfig(config: Required<AssetGeneratorConfig>): void {
    // Validate naming_style
    const validNamingStyles = ['camelCase', 'snake_case', 'PascalCase'];
    if (!validNamingStyles.includes(config.naming_style)) {
      throw new Error(
        `Invalid naming_style: ${config.naming_style}. Must be one of: ${validNamingStyles.join(', ')}`
      );
    }

    // Validate filename_split_pattern is a valid regex
    try {
      new RegExp(config.filename_split_pattern);
    } catch {
      throw new Error(`Invalid filename_split_pattern: ${config.filename_split_pattern}. Must be a valid regex.`);
    }

    // Validate path_ignore is an array
    if (!Array.isArray(config.path_ignore)) {
      throw new Error('path_ignore must be an array of strings');
    }
  }

  /**
   * Get VSCode user settings for the extension
   * @returns User settings
   */
  static getUserSettings(): UserSettings {
    const config = vscode.workspace.getConfiguration('flutter-assets-generator');

    return {
      enableAutoGeneration: config.get('autoDetection', true),
      showNotifications: config.get('showNotifications', true),
      enableHover: config.get('enableHover', true),
    };
  }

  /**
   * Get the current Flutter project for the active editor
   * @returns Project root path or undefined
   */
  static async getCurrentFlutterProject(): Promise<string | undefined> {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return undefined;
    }

    const activeFilePath = activeEditor.document.uri.fsPath;
    const projects = await this.findAllFlutterProjects();

    // Find the project that contains the active file
    return projects.find(projectRoot => activeFilePath.startsWith(projectRoot));
  }
}

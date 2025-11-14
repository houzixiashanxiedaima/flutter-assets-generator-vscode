import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { ConfigManager } from '../config/ConfigManager';
import { AssetGenerator } from '../core/AssetGenerator';

/**
 * Add file or folder to pubspec.yaml assets
 */
export async function addToAssetsCommand(
  uri: vscode.Uri,
  outputChannel: vscode.OutputChannel
): Promise<void> {
  try {
    if (!uri) {
      vscode.window.showErrorMessage('No file or folder selected');
      return;
    }

    // Find the Flutter project containing this file
    const projects = await ConfigManager.findAllFlutterProjects();
    const projectRoot = projects.find(project => uri.fsPath.startsWith(project));

    if (!projectRoot) {
      vscode.window.showErrorMessage('Selected file is not in a Flutter project');
      return;
    }

    // Calculate relative path
    const relativePath = path.relative(projectRoot, uri.fsPath);
    const normalizedPath = relativePath.replace(/\\/g, '/');

    // Check if it's a directory
    const stat = await fs.promises.stat(uri.fsPath);
    const assetPath = stat.isDirectory() ? `${normalizedPath}/` : normalizedPath;

    // Read pubspec.yaml
    const pubspecPath = path.join(projectRoot, 'pubspec.yaml');
    const pubspecContent = await fs.promises.readFile(pubspecPath, 'utf-8');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pubspec = yaml.load(pubspecContent) as any;

    // Initialize flutter.assets if needed
    if (!pubspec.flutter) {
      pubspec.flutter = {};
    }
    if (!pubspec.flutter.assets) {
      pubspec.flutter.assets = [];
    }

    // Check if already exists
    if (pubspec.flutter.assets.includes(assetPath)) {
      vscode.window.showInformationMessage(`Asset path already exists: ${assetPath}`);
      return;
    }

    // Add to assets
    pubspec.flutter.assets.push(assetPath);

    // Sort assets for better readability
    pubspec.flutter.assets.sort();

    // Write back to file
    const newContent = yaml.dump(pubspec, {
      indent: 2,
      lineWidth: 80,
      noRefs: true,
    });

    await fs.promises.writeFile(pubspecPath, newContent, 'utf-8');

    vscode.window.showInformationMessage(`Added to assets: ${assetPath}`);

    // Ask if user wants to generate now
    const answer = await vscode.window.showQuickPick(['Yes', 'No'], {
      placeHolder: 'Generate assets now?',
    });

    if (answer === 'Yes') {
      const generator = new AssetGenerator(outputChannel);
      const result = await generator.generate(projectRoot);
      const userSettings = ConfigManager.getUserSettings();
      generator.showResult(result, userSettings.showNotifications);
      outputChannel.show(true);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to add to assets: ${message}`);
    outputChannel.appendLine(`\n❌ Error: ${message}`);
  }
}

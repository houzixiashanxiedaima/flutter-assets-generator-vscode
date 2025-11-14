import * as vscode from 'vscode';
import { ConfigManager } from './config/ConfigManager';
import { AssetGenerator } from './core/AssetGenerator';
import { AssetWatcher } from './core/AssetWatcher';
import { generateCommand, generateAllCommand } from './commands/GenerateCommand';
import { addToAssetsCommand } from './commands/AddToAssetsCommand';

let outputChannel: vscode.OutputChannel;
const watchers: Map<string, AssetWatcher> = new Map();

export async function activate(context: vscode.ExtensionContext) {
  console.log('Flutter Assets Generator is now active');

  // Create output channel
  outputChannel = vscode.window.createOutputChannel('Flutter Assets Generator');
  context.subscriptions.push(outputChannel);

  outputChannel.appendLine('Flutter Assets Generator activated');
  outputChannel.appendLine(`Version: ${context.extension.packageJSON.version}`);

  // Register generate command
  const generateCmd = vscode.commands.registerCommand(
    'flutter-assets-generator.generate',
    async () => {
      await generateCommand(outputChannel);
    }
  );

  // Register generate all command
  const generateAllCmd = vscode.commands.registerCommand(
    'flutter-assets-generator.generateAll',
    async () => {
      await generateAllCommand(outputChannel);
    }
  );

  // Register add to assets command
  const addToAssetsCmd = vscode.commands.registerCommand(
    'flutter-assets-generator.addToAssets',
    async (uri: vscode.Uri) => {
      await addToAssetsCommand(uri, outputChannel);
    }
  );

  // Register open settings command
  const openSettingsCmd = vscode.commands.registerCommand(
    'flutter-assets-generator.openSettings',
    async () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'flutter-assets-generator');
    }
  );

  // Register show output command
  const showOutputCmd = vscode.commands.registerCommand(
    'flutter-assets-generator.showOutput',
    () => {
      outputChannel.show();
    }
  );

  context.subscriptions.push(
    generateCmd,
    generateAllCmd,
    addToAssetsCmd,
    openSettingsCmd,
    showOutputCmd
  );

  // Setup file watchers for auto-detection
  await setupWatchers();

  // Watch for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async event => {
      if (event.affectsConfiguration('flutter-assets-generator')) {
        outputChannel.appendLine('\nConfiguration changed, restarting watchers...');
        await setupWatchers();
      }
    })
  );

  // Watch for workspace folder changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(async () => {
      outputChannel.appendLine('\nWorkspace folders changed, restarting watchers...');
      await setupWatchers();
    })
  );

  outputChannel.appendLine('\nFlutter Assets Generator is ready!');
  outputChannel.appendLine('Use "Flutter: Generate Assets" command to generate asset constants');
}

/**
 * Setup file watchers for all Flutter projects
 */
async function setupWatchers(): Promise<void> {
  // Stop all existing watchers
  for (const [, watcher] of watchers) {
    await watcher.stop();
  }
  watchers.clear();

  // Get user settings
  const userSettings = ConfigManager.getUserSettings();

  if (!userSettings.enableAutoGeneration) {
    outputChannel.appendLine('Auto-generation is disabled');
    return;
  }

  // Find all Flutter projects
  const projects = await ConfigManager.findAllFlutterProjects();

  if (projects.length === 0) {
    outputChannel.appendLine('No Flutter projects found');
    return;
  }

  outputChannel.appendLine(`\nSetting up watchers for ${projects.length} project(s)...`);

  // Create watchers for each project
  for (const projectRoot of projects) {
    try {
      const config = await ConfigManager.loadConfig(projectRoot);

      if (!config.auto_detection) {
        outputChannel.appendLine(`  • Skipping ${projectRoot} (auto_detection disabled)`);
        continue;
      }

      const generator = new AssetGenerator(outputChannel);
      const watcher = new AssetWatcher(config, generator);

      watcher.start();
      watchers.set(projectRoot, watcher);

      outputChannel.appendLine(`  • Watching ${projectRoot}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      outputChannel.appendLine(`  • Failed to setup watcher for ${projectRoot}: ${message}`);
    }
  }

  outputChannel.appendLine(`Watchers setup complete (${watchers.size} active)`);
}

export async function deactivate() {
  console.log('Flutter Assets Generator is being deactivated');

  // Stop all watchers
  for (const [, watcher] of watchers) {
    await watcher.stop();
  }
  watchers.clear();

  if (outputChannel) {
    outputChannel.appendLine('\nFlutter Assets Generator deactivated');
    outputChannel.dispose();
  }
}

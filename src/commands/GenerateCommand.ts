import * as vscode from 'vscode';
import { ConfigManager } from '../config/ConfigManager';
import { AssetGenerator } from '../core/AssetGenerator';

/**
 * Generate assets command implementation
 */
export async function generateCommand(
  outputChannel: vscode.OutputChannel
): Promise<void> {
  const generator = new AssetGenerator(outputChannel);
  const userSettings = ConfigManager.getUserSettings();

  try {
    // Get current Flutter project
    const projectRoot = await ConfigManager.getCurrentFlutterProject();

    if (!projectRoot) {
      vscode.window.showErrorMessage(
        'No Flutter project found. Please open a Flutter project first.'
      );
      return;
    }

    // Show progress
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Generating Flutter assets...',
        cancellable: false,
      },
      async progress => {
        progress.report({ increment: 0 });

        const result = await generator.generate(projectRoot);

        progress.report({ increment: 100 });

        // Show result
        generator.showResult(result, userSettings.showNotifications);

        // Show output channel
        outputChannel.show(true);
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to generate assets: ${message}`);
    outputChannel.appendLine(`\n❌ Error: ${message}`);
  }
}

/**
 * Generate assets for all projects command implementation
 */
export async function generateAllCommand(
  outputChannel: vscode.OutputChannel
): Promise<void> {
  const generator = new AssetGenerator(outputChannel);
  const userSettings = ConfigManager.getUserSettings();

  try {
    // Show progress
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Generating assets for all Flutter projects...',
        cancellable: false,
      },
      async progress => {
        progress.report({ increment: 0 });

        const results = await generator.generateAll();

        progress.report({ increment: 100 });

        // Show results
        generator.showResults(results, userSettings.showNotifications);

        // Show output channel
        outputChannel.show(true);
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to generate assets: ${message}`);
    outputChannel.appendLine(`\n❌ Error: ${message}`);
  }
}

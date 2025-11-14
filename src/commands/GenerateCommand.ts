import * as vscode from 'vscode';
import { ConfigManager } from '../config/ConfigManager';
import { AssetGenerator } from '../core/AssetGenerator';
import { ErrorHandler } from '../utils/ErrorHandler';

/**
 * Generate assets command implementation
 */
export async function generateCommand(
  outputChannel: vscode.OutputChannel
): Promise<void> {
  const generator = new AssetGenerator(outputChannel);
  const userSettings = ConfigManager.getUserSettings();
  const errorHandler = new ErrorHandler(outputChannel);

  try {
    // Get current Flutter project
    const projectRoot = await ConfigManager.getCurrentFlutterProject();

    if (!projectRoot) {
      const error = 'No Flutter project found. Please open a Flutter project first.';
      errorHandler.handleError(
        error,
        ErrorHandler.detectErrorType(error),
        userSettings.showNotifications
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

        // Show output channel if there were issues
        if (!result.success || (result.conflicts && result.conflicts > 0)) {
          outputChannel.show(true);
        }
      }
    );
  } catch (error) {
    const errorType = ErrorHandler.detectErrorType(error instanceof Error ? error : String(error));
    errorHandler.handleError(
      error instanceof Error ? error : String(error),
      errorType,
      userSettings.showNotifications
    );
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
  const errorHandler = new ErrorHandler(outputChannel);

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
    const errorType = ErrorHandler.detectErrorType(error instanceof Error ? error : String(error));
    errorHandler.handleError(
      error instanceof Error ? error : String(error),
      errorType,
      userSettings.showNotifications
    );
  }
}

import * as vscode from 'vscode';

/**
 * Error types for better error handling
 */
export enum ErrorType {
  PUBSPEC_NOT_FOUND = 'PUBSPEC_NOT_FOUND',
  PUBSPEC_PARSE_ERROR = 'PUBSPEC_PARSE_ERROR',
  NO_ASSETS_CONFIGURED = 'NO_ASSETS_CONFIGURED',
  ASSET_PATH_NOT_FOUND = 'ASSET_PATH_NOT_FOUND',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Error messages and solutions
 */
const ERROR_MESSAGES: Record<ErrorType, { message: string; solution: string; docsLink?: string }> = {
  [ErrorType.PUBSPEC_NOT_FOUND]: {
    message: 'pubspec.yaml not found',
    solution: 'Make sure you have a pubspec.yaml file in your Flutter project root.',
    docsLink: 'https://flutter.dev/docs/development/tools/pubspec',
  },
  [ErrorType.PUBSPEC_PARSE_ERROR]: {
    message: 'Failed to parse pubspec.yaml',
    solution: 'Check your pubspec.yaml for syntax errors. Make sure it is valid YAML format.',
    docsLink: 'https://yaml.org/spec/1.2/spec.html',
  },
  [ErrorType.NO_ASSETS_CONFIGURED]: {
    message: 'No assets configured in pubspec.yaml',
    solution: 'Add asset paths to your pubspec.yaml under flutter.assets section.',
    docsLink: 'https://flutter.dev/docs/development/ui/assets-and-images',
  },
  [ErrorType.ASSET_PATH_NOT_FOUND]: {
    message: 'Asset path does not exist',
    solution: 'Make sure the asset paths in pubspec.yaml point to existing files or directories.',
  },
  [ErrorType.FILE_WRITE_ERROR]: {
    message: 'Failed to write generated file',
    solution: 'Check if you have write permissions for the output directory. Make sure the directory exists.',
  },
  [ErrorType.INVALID_CONFIGURATION]: {
    message: 'Invalid configuration',
    solution: 'Check your flutter_assets_generator configuration in pubspec.yaml for invalid values.',
  },
  [ErrorType.UNKNOWN_ERROR]: {
    message: 'An unknown error occurred',
    solution: 'Please check the OUTPUT panel for more details.',
  },
};

/**
 * Handles errors with user-friendly messages and solutions
 */
export class ErrorHandler {
  private outputChannel: vscode.OutputChannel;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
  }

  /**
   * Handle an error with user-friendly message
   * @param error Error object or message
   * @param type Error type
   * @param showNotification Whether to show notification
   */
  handleError(error: Error | string, type: ErrorType = ErrorType.UNKNOWN_ERROR, showNotification: boolean = true): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorInfo = ERROR_MESSAGES[type];

    // Log to output channel
    this.outputChannel.appendLine('\n=== Error ===');
    this.outputChannel.appendLine(`Type: ${type}`);
    this.outputChannel.appendLine(`Message: ${errorInfo.message}`);
    this.outputChannel.appendLine(`Details: ${errorMessage}`);
    this.outputChannel.appendLine(`Solution: ${errorInfo.solution}`);

    if (errorInfo.docsLink) {
      this.outputChannel.appendLine(`Documentation: ${errorInfo.docsLink}`);
    }

    if (error instanceof Error && error.stack) {
      this.outputChannel.appendLine('\nStack trace:');
      this.outputChannel.appendLine(error.stack);
    }

    this.outputChannel.appendLine('=============\n');

    // Show notification if enabled
    if (showNotification) {
      const actions: string[] = ['Show Output'];

      if (errorInfo.docsLink) {
        actions.push('View Docs');
      }

      vscode.window.showErrorMessage(
        `${errorInfo.message}: ${errorMessage}`,
        ...actions
      ).then(action => {
        if (action === 'Show Output') {
          this.outputChannel.show();
        } else if (action === 'View Docs' && errorInfo.docsLink) {
          vscode.env.openExternal(vscode.Uri.parse(errorInfo.docsLink));
        }
      });
    }
  }

  /**
   * Show warning message
   * @param message Warning message
   * @param showNotification Whether to show notification
   */
  showWarning(message: string, showNotification: boolean = true): void {
    this.outputChannel.appendLine(`⚠️  Warning: ${message}`);

    if (showNotification) {
      vscode.window.showWarningMessage(message, 'Show Output').then(action => {
        if (action === 'Show Output') {
          this.outputChannel.show();
        }
      });
    }
  }

  /**
   * Show info message
   * @param message Info message
   * @param showNotification Whether to show notification
   */
  showInfo(message: string, showNotification: boolean = true): void {
    this.outputChannel.appendLine(`ℹ️  ${message}`);

    if (showNotification) {
      vscode.window.showInformationMessage(message);
    }
  }

  /**
   * Detect error type from error message
   * @param error Error object or message
   * @returns Detected error type
   */
  static detectErrorType(error: Error | string): ErrorType {
    const errorMessage = error instanceof Error ? error.message : error;
    const lowerMessage = errorMessage.toLowerCase();

    if (lowerMessage.includes('pubspec.yaml') && lowerMessage.includes('not found')) {
      return ErrorType.PUBSPEC_NOT_FOUND;
    }

    if (lowerMessage.includes('parse') || lowerMessage.includes('yaml') || lowerMessage.includes('invalid')) {
      return ErrorType.PUBSPEC_PARSE_ERROR;
    }

    if (lowerMessage.includes('no assets') || lowerMessage.includes('asset') && lowerMessage.includes('not configured')) {
      return ErrorType.NO_ASSETS_CONFIGURED;
    }

    if (lowerMessage.includes('not found') || lowerMessage.includes('does not exist')) {
      return ErrorType.ASSET_PATH_NOT_FOUND;
    }

    if (lowerMessage.includes('write') || lowerMessage.includes('permission')) {
      return ErrorType.FILE_WRITE_ERROR;
    }

    if (lowerMessage.includes('invalid') && lowerMessage.includes('config')) {
      return ErrorType.INVALID_CONFIGURATION;
    }

    return ErrorType.UNKNOWN_ERROR;
  }
}

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Flutter Assets Generator is now active');

    // Register generate command
    const generateCommand = vscode.commands.registerCommand(
        'flutter-assets-generator.generate',
        async () => {
            vscode.window.showInformationMessage('Generate Assets command triggered');
            // TODO: Implement asset generation logic
        }
    );

    // Register add to assets command
    const addToAssetsCommand = vscode.commands.registerCommand(
        'flutter-assets-generator.addToAssets',
        async (uri: vscode.Uri) => {
            vscode.window.showInformationMessage(`Add to Assets: ${uri.fsPath}`);
            // TODO: Implement add to pubspec.yaml logic
        }
    );

    // Register settings command
    const openSettingsCommand = vscode.commands.registerCommand(
        'flutter-assets-generator.openSettings',
        async () => {
            vscode.commands.executeCommand(
                'workbench.action.openSettings',
                'flutter-assets-generator'
            );
        }
    );

    context.subscriptions.push(generateCommand, addToAssetsCommand, openSettingsCommand);

    // TODO: Setup file watcher for auto-detection
    // TODO: Implement CodeLens provider for asset preview
}

export function deactivate() {
    // Cleanup if needed
}

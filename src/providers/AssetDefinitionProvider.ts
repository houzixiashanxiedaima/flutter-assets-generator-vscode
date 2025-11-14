import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager } from '../config/ConfigManager';

/**
 * Provides definition navigation for asset constants
 * Enables Cmd+Click (Mac) / Ctrl+Click (Windows) to jump to asset files
 */
export class AssetDefinitionProvider implements vscode.DefinitionProvider {
  /**
   * Provide definition location for asset constants
   */
  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _token: vscode.CancellationToken
  ): Promise<vscode.Location | undefined> {
    // Get the word at the cursor position
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
      return undefined;
    }

    // Get the full line to check if it's an Assets constant
    const line = document.lineAt(position.line).text;
    const wordStart = document.offsetAt(wordRange.start);
    const lineStart = document.offsetAt(new vscode.Position(position.line, 0));
    const relativeOffset = wordStart - lineStart;

    // Look for Assets.constantName pattern
    const beforeWord = line.substring(0, relativeOffset);
    const match = beforeWord.match(/Assets\.\s*$/);

    if (!match) {
      return undefined;
    }

    // Get the constant name
    const constantName = document.getText(wordRange);

    try {
      // Find the Flutter project
      const projectRoot = await ConfigManager.getCurrentFlutterProject();
      if (!projectRoot) {
        return undefined;
      }

      // Load configuration
      const config = await ConfigManager.loadConfig(projectRoot);

      // Read the generated assets file to find the asset path
      const generatedFilePath = path.join(
        projectRoot,
        'lib',
        config.output_dir,
        `${config.output_filename}.dart`
      );

      if (!fs.existsSync(generatedFilePath)) {
        return undefined;
      }

      const generatedContent = await fs.promises.readFile(generatedFilePath, 'utf-8');

      // Find the constant definition
      const regex = new RegExp(`static\\s+const\\s+String\\s+${constantName}\\s*=\\s*['"]([^'"]+)['"]`);
      const constantMatch = generatedContent.match(regex);

      if (!constantMatch) {
        return undefined;
      }

      const assetPath = constantMatch[1];

      // Resolve the actual file path
      let actualFilePath = assetPath;

      // Remove packages prefix if present
      if (actualFilePath.startsWith('packages/')) {
        actualFilePath = actualFilePath.replace(/^packages\/[^/]+\//, '');
      }

      const fullPath = path.join(projectRoot, actualFilePath);

      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        vscode.window.showWarningMessage(`Asset file not found: ${assetPath}`);
        return undefined;
      }

      // Return the location of the asset file
      const uri = vscode.Uri.file(fullPath);
      return new vscode.Location(uri, new vscode.Position(0, 0));
    } catch (error) {
      console.error('Error providing definition:', error);
      return undefined;
    }
  }
}

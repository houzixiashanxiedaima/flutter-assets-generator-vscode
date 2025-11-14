import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager } from '../config/ConfigManager';

/**
 * Provides hover information for asset constants
 */
export class AssetHoverProvider implements vscode.HoverProvider {
  /**
   * Provide hover information for asset constants
   */
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _token: vscode.CancellationToken
  ): Promise<vscode.Hover | undefined> {
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
        return new vscode.Hover(
          new vscode.MarkdownString(
            `**Asset Path**: \`${assetPath}\`\n\n⚠️ File not found`
          )
        );
      }

      // Get file stats
      const stats = await fs.promises.stat(fullPath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);
      const extension = path.extname(fullPath).slice(1).toUpperCase();
      const fileName = path.basename(fullPath);

      // Create hover content
      const markdown = new vscode.MarkdownString();
      markdown.isTrusted = true;
      markdown.supportHtml = true;

      markdown.appendMarkdown(`### 📦 Asset: \`${constantName}\`\n\n`);
      markdown.appendMarkdown(`**Path**: \`${assetPath}\`\n\n`);
      markdown.appendMarkdown(`**File**: ${fileName}\n\n`);
      markdown.appendMarkdown(`**Type**: ${extension || 'Unknown'}\n\n`);
      markdown.appendMarkdown(`**Size**: ${fileSizeKB} KB\n\n`);

      // Add command to open file
      const openFileCommand = vscode.Uri.parse(
        `command:vscode.open?${encodeURIComponent(JSON.stringify([vscode.Uri.file(fullPath)]))}`
      );
      markdown.appendMarkdown(`[Open File](${openFileCommand})\n\n`);

      return new vscode.Hover(markdown);
    } catch (error) {
      console.error('Error providing hover:', error);
      return undefined;
    }
  }
}

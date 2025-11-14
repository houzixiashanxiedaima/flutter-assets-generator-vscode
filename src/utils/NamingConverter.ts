import * as path from 'path';
import { ResolvedConfig } from '../types/config';
import { AssetFile, AssetConstant } from '../types/asset';

/**
 * Handles naming conversion for asset constants
 */
export class NamingConverter {
  private config: ResolvedConfig;
  private constantMap: Map<string, AssetFile> = new Map();

  constructor(config: ResolvedConfig) {
    this.config = config;
  }

  /**
   * Generate constants for all assets
   * @param assets Array of asset files
   * @returns Array of asset constants
   */
  generateConstants(assets: AssetFile[]): AssetConstant[] {
    this.constantMap.clear();
    const constants: AssetConstant[] = [];

    for (const asset of assets) {
      let constantName = this.generateConstantName(asset);

      // Check for conflicts
      const existingAsset = this.constantMap.get(constantName);
      let hasConflict = false;
      let conflictWith: string | undefined;

      if (existingAsset) {
        hasConflict = true;
        conflictWith = existingAsset.relativePath;

        // Try to resolve conflict with parent naming
        if (this.config.named_with_parent) {
          constantName = this.applyParentNaming(asset);

          // If still conflicts, add more parent directories
          if (this.constantMap.has(constantName)) {
            constantName = this.resolveDeepConflict(asset, constantName);
          }
        }
      }

      this.constantMap.set(constantName, asset);

      constants.push({
        name: constantName,
        value: asset.assetPath,
        asset,
        hasConflict,
        conflictWith,
      });
    }

    return constants;
  }

  /**
   * Generate constant name for an asset
   * @param asset Asset file
   * @returns Constant name
   */
  private generateConstantName(asset: AssetFile): string {
    const processedName = this.preprocessFilename(asset.filename);

    switch (this.config.naming_style) {
      case 'camelCase':
        return this.toCamelCase(processedName);
      case 'snake_case':
        return this.toSnakeCase(processedName);
      case 'PascalCase':
        return this.toPascalCase(processedName);
      default:
        return this.toCamelCase(processedName);
    }
  }

  /**
   * Preprocess filename before conversion
   * Steps:
   * 1. Remove file extension
   * 2. Remove @ symbols
   * 3. Replace . with _
   * 4. Split by pattern
   * 5. Handle numbers at start
   *
   * @param filename Filename with extension
   * @returns Processed name
   */
  private preprocessFilename(filename: string): string {
    // Step 1: Remove extension
    const nameWithoutExt = path.parse(filename).name;

    // Step 2: Remove @ symbols
    let processed = nameWithoutExt.replace(/@/g, '');

    // Step 3: Replace . with _
    processed = processed.replace(/\./g, '_');

    // Step 4: Already handled by split in conversion methods

    return processed;
  }

  /**
   * Convert to camelCase
   * @param name Processed filename
   * @returns camelCase name
   */
  private toCamelCase(name: string): string {
    const parts = this.splitName(name);

    if (parts.length === 0) {
      return 'asset';
    }

    // First part lowercase, rest capitalize first letter
    const result = parts
      .map((part, index) => {
        if (index === 0) {
          return part.toLowerCase();
        }
        return this.capitalize(part);
      })
      .join('');

    // Handle numbers at start
    return this.handleNumberPrefix(result);
  }

  /**
   * Convert to snake_case
   * @param name Processed filename
   * @returns snake_case name
   */
  private toSnakeCase(name: string): string {
    const parts = this.splitName(name);

    if (parts.length === 0) {
      return 'asset';
    }

    const result = parts.map(part => part.toLowerCase()).join('_');

    // Handle numbers at start
    return this.handleNumberPrefix(result);
  }

  /**
   * Convert to PascalCase
   * @param name Processed filename
   * @returns PascalCase name
   */
  private toPascalCase(name: string): string {
    const parts = this.splitName(name);

    if (parts.length === 0) {
      return 'Asset';
    }

    const result = parts.map(part => this.capitalize(part)).join('');

    // Handle numbers at start
    return this.handleNumberPrefix(result);
  }

  /**
   * Split name by configured pattern
   * @param name Name to split
   * @returns Array of name parts
   */
  private splitName(name: string): string[] {
    const pattern = new RegExp(this.config.filename_split_pattern);
    return name
      .split(pattern)
      .filter(part => part.length > 0)
      .map(part => part.trim());
  }

  /**
   * Capitalize first letter of a string
   * @param str String to capitalize
   * @returns Capitalized string
   */
  private capitalize(str: string): string {
    if (str.length === 0) {
      return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Handle names that start with numbers
   * @param name Name to check
   * @returns Name with 'n' prefix if starts with number
   */
  private handleNumberPrefix(name: string): string {
    if (/^\d/.test(name)) {
      return 'n' + name;
    }
    return name;
  }

  /**
   * Apply parent directory naming
   * @param asset Asset file
   * @returns Constant name with parent directory
   */
  private applyParentNaming(asset: AssetFile): string {
    const filename = this.preprocessFilename(asset.filename);
    const parentDir = asset.parentDir;

    // Combine parent and filename
    const combined = `${parentDir}_${filename}`;

    switch (this.config.naming_style) {
      case 'camelCase':
        return this.toCamelCase(combined);
      case 'snake_case':
        return this.toSnakeCase(combined);
      case 'PascalCase':
        return this.toPascalCase(combined);
      default:
        return this.toCamelCase(combined);
    }
  }

  /**
   * Resolve deep conflicts by adding more parent directories
   * @param asset Asset file
   * @param currentName Current conflicting name
   * @returns Resolved name
   */
  private resolveDeepConflict(asset: AssetFile, currentName: string): string {
    const pathParts = asset.relativePath.split('/');
    const filename = pathParts[pathParts.length - 1];
    const dirParts = pathParts.slice(0, -1);

    // Add more directory parts until no conflict
    for (let i = dirParts.length - 1; i >= 0; i--) {
      const parts = [...dirParts.slice(i), filename];
      const combined = parts.join('_');

      const testName =
        this.config.naming_style === 'camelCase'
          ? this.toCamelCase(this.preprocessFilename(combined))
          : this.config.naming_style === 'snake_case'
            ? this.toSnakeCase(this.preprocessFilename(combined))
            : this.toPascalCase(this.preprocessFilename(combined));

      if (!this.constantMap.has(testName)) {
        return testName;
      }
    }

    // If all else fails, add a number suffix
    let counter = 2;
    while (this.constantMap.has(`${currentName}${counter}`)) {
      counter++;
    }
    return `${currentName}${counter}`;
  }

  /**
   * Detect naming conflicts
   * @param constants Array of asset constants
   * @returns Array of constants with conflicts
   */
  detectConflicts(constants: AssetConstant[]): AssetConstant[] {
    return constants.filter(constant => constant.hasConflict);
  }
}

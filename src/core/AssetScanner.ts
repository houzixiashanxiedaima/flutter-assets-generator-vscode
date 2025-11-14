import * as fs from 'fs';
import * as path from 'path';
import { ResolvedConfig } from '../types/config';
import { AssetFile, ScanResult } from '../types/asset';

/**
 * Scans and filters asset files from the Flutter project
 */
export class AssetScanner {
  private config: ResolvedConfig;
  private ignoredPaths: string[] = [];

  constructor(config: ResolvedConfig) {
    this.config = config;
  }

  /**
   * Scan all asset files from configured paths
   * @returns Scan result with assets and statistics
   */
  async scan(): Promise<ScanResult> {
    const assets: AssetFile[] = [];
    let totalScanned = 0;
    this.ignoredPaths = [];

    for (const assetPath of this.config.assetPaths) {
      const absolutePath = this.resolveAssetPath(assetPath);

      try {
        const stat = await fs.promises.stat(absolutePath);

        if (stat.isDirectory()) {
          // Scan directory recursively
          const scannedFiles = await this.scanDirectory(absolutePath, assetPath);
          assets.push(...scannedFiles);
          totalScanned += scannedFiles.length;
        } else if (stat.isFile()) {
          // Single file
          const assetFile = this.createAssetFile(absolutePath, assetPath);
          if (assetFile && !this.shouldIgnore(assetFile)) {
            assets.push(assetFile);
            totalScanned++;
          } else if (assetFile) {
            this.ignoredPaths.push(assetFile.relativePath);
          }
        }
      } catch (error) {
        console.warn(`Asset path not found: ${absolutePath}`);
      }
    }

    return {
      assets,
      totalScanned,
      totalIgnored: this.ignoredPaths.length,
      ignoredPaths: this.ignoredPaths,
    };
  }

  /**
   * Recursively scan a directory for asset files
   * @param dirPath Absolute directory path
   * @param basePath Base asset path from pubspec.yaml
   * @returns Array of asset files
   */
  private async scanDirectory(dirPath: string, basePath: string): Promise<AssetFile[]> {
    const assets: AssetFile[] = [];

    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip hidden files and directories
        if (entry.name.startsWith('.')) {
          continue;
        }

        // Skip Flutter density variant directories
        if (this.isDensityVariantDir(entry.name) && entry.isDirectory()) {
          continue;
        }

        if (entry.isDirectory()) {
          // Recursively scan subdirectory
          const subAssets = await this.scanDirectory(fullPath, basePath);
          assets.push(...subAssets);
        } else if (entry.isFile()) {
          const relativePath = path.relative(this.config.projectRoot, fullPath);
          const assetFile = this.createAssetFile(fullPath, relativePath);

          if (assetFile && !this.shouldIgnore(assetFile)) {
            assets.push(assetFile);
          } else if (assetFile) {
            this.ignoredPaths.push(assetFile.relativePath);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to scan directory ${dirPath}:`, error);
    }

    return assets;
  }

  /**
   * Create an AssetFile object from a file path
   * @param absolutePath Absolute file path
   * @param relativePath Relative path from project root
   * @returns AssetFile or undefined if invalid
   */
  private createAssetFile(absolutePath: string, relativePath: string): AssetFile | undefined {
    try {
      const filename = path.basename(absolutePath);
      const extension = path.extname(filename).slice(1); // Remove leading dot
      const parentDir = path.basename(path.dirname(absolutePath));

      // Calculate asset path for Dart code
      let assetPath = this.normalizePath(relativePath);

      // Add package name prefix if enabled
      if (this.config.leading_with_package_name) {
        assetPath = `packages/${this.config.packageName}/${assetPath}`;
      }

      return {
        absolutePath,
        relativePath: this.normalizePath(relativePath),
        filename,
        extension,
        parentDir,
        assetPath,
      };
    } catch (error) {
      console.error(`Failed to create AssetFile for ${absolutePath}:`, error);
      return undefined;
    }
  }

  /**
   * Check if a file should be ignored based on configuration
   * @param asset Asset file to check
   * @returns true if the file should be ignored
   */
  private shouldIgnore(asset: AssetFile): boolean {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { path_ignore } = this.config;

    for (const ignorePath of path_ignore) {
      // Directory ignore (ends with /)
      if (ignorePath.endsWith('/')) {
        const dirPath = ignorePath.slice(0, -1);
        if (asset.relativePath.includes(dirPath)) {
          return true;
        }
      }
      // File ignore
      else if (asset.relativePath.includes(ignorePath)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a directory name is a Flutter density variant
   * @param dirName Directory name
   * @returns true if it's a density variant directory
   */
  private isDensityVariantDir(dirName: string): boolean {
    // Match patterns like: 2.0x, 3.0x, 4.0x, or Mx, Nx, etc.
    return /^(\d+\.?\d*x|[MN]x)$/i.test(dirName);
  }

  /**
   * Normalize path to use forward slashes
   * @param filePath Path to normalize
   * @returns Normalized path
   */
  private normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }

  /**
   * Resolve asset path relative to project root
   * @param assetPath Asset path from pubspec.yaml
   * @returns Absolute path
   */
  private resolveAssetPath(assetPath: string): string {
    // Remove trailing slash from directory paths
    const cleanPath = assetPath.endsWith('/') ? assetPath.slice(0, -1) : assetPath;
    return path.join(this.config.projectRoot, cleanPath);
  }
}

/**
 * Asset types for Flutter Assets Generator
 */

/**
 * Represents a scanned asset file
 */
export interface AssetFile {
  /** Absolute path to the file */
  absolutePath: string;

  /** Path relative to project root */
  relativePath: string;

  /** Filename with extension */
  filename: string;

  /** File extension (without dot) */
  extension: string;

  /** Parent directory name */
  parentDir: string;

  /** Asset path as it should appear in Dart code */
  assetPath: string;
}

/**
 * Result of asset scanning
 */
export interface ScanResult {
  /** List of scanned assets */
  assets: AssetFile[];

  /** Number of files scanned */
  totalScanned: number;

  /** Number of files ignored */
  totalIgnored: number;

  /** Paths that were ignored */
  ignoredPaths: string[];
}

/**
 * Asset constant information
 */
export interface AssetConstant {
  /** Constant name in Dart */
  name: string;

  /** Asset path value */
  value: string;

  /** Original asset file */
  asset: AssetFile;

  /** Whether this constant has a naming conflict */
  hasConflict?: boolean;

  /** Previous conflicting path if any */
  conflictWith?: string;
}

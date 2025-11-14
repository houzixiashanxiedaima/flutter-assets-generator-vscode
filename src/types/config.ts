/**
 * Configuration types for Flutter Assets Generator
 */

/**
 * Asset generator configuration from pubspec.yaml
 * Note: Uses snake_case to match YAML configuration keys
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface AssetGeneratorConfig {
  /** Output directory relative to lib folder (default: "generated") */
  output_dir?: string;

  /** Output filename without .dart extension (default: "assets") */
  output_filename?: string;

  /** Enable automatic asset detection and regeneration (default: true) */
  auto_detection?: boolean;

  /** Generated class name (default: "Assets") */
  class_name?: string;

  /** Naming style for constants (default: "camelCase") */
  naming_style?: 'camelCase' | 'snake_case' | 'PascalCase';

  /** Include parent directory name in variable names (default: true) */
  named_with_parent?: boolean;

  /** Regex pattern for splitting filename parts (default: "[-_]") */
  filename_split_pattern?: string;

  /** Prefix paths with packages/{name}/ for Flutter packages (default: false) */
  leading_with_package_name?: boolean;

  /** List of paths to ignore during scanning (default: []) */
  path_ignore?: string[];
}

/**
 * Pubspec.yaml structure (partial)
 */
export interface PubspecYaml {
  name: string;
  flutter?: {
    assets?: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  flutter_assets_generator?: AssetGeneratorConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Resolved configuration with defaults applied
 */
export interface ResolvedConfig extends Required<AssetGeneratorConfig> {
  /** Project root directory */
  projectRoot: string;

  /** Package name from pubspec.yaml */
  packageName: string;

  /** Asset paths from pubspec.yaml flutter.assets */
  assetPaths: string[];
}

/**
 * VSCode user settings
 */
export interface UserSettings {
  /** Enable automatic asset generation on file changes */
  enableAutoGeneration: boolean;

  /** Show notifications for generation results */
  showNotifications: boolean;

  /** Enable hover tooltips for asset constants */
  enableHover: boolean;
}

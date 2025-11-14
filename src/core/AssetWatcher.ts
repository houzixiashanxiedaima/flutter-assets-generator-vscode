import * as chokidar from 'chokidar';
import * as path from 'path';
import { debounce } from 'lodash';
import { ResolvedConfig } from '../types/config';
import { AssetGenerator } from './AssetGenerator';

/**
 * Watches asset files for changes and triggers regeneration
 */
export class AssetWatcher {
  private config: ResolvedConfig;
  private generator: AssetGenerator;
  private watcher: chokidar.FSWatcher | null = null;
  private debouncedGenerate: () => void;

  constructor(config: ResolvedConfig, generator: AssetGenerator) {
    this.config = config;
    this.generator = generator;

    // Create debounced generate function (300ms delay)
    this.debouncedGenerate = debounce(
      () => {
        this.onFileChange();
      },
      300,
      { leading: false, trailing: true }
    );
  }

  /**
   * Start watching asset files
   */
  start(): void {
    if (this.watcher) {
      console.warn('Asset watcher is already running');
      return;
    }

    if (!this.config.auto_detection) {
      console.log('Auto detection is disabled, not starting watcher');
      return;
    }

    // Get watch paths from asset paths
    const watchPaths = this.getWatchPaths();

    if (watchPaths.length === 0) {
      console.log('No asset paths to watch');
      return;
    }

    console.log('Starting asset watcher for paths:', watchPaths);

    // Create watcher
    this.watcher = chokidar.watch(watchPaths, {
      ignored: [
        // Ignore hidden files and directories
        /(^|[/\\])\../,
        // Ignore generated directory
        new RegExp(`lib/${this.config.output_dir}/`),
        // Ignore common build directories
        '**/build/**',
        '**/.dart_tool/**',
        '**/node_modules/**',
      ],
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100,
      },
    });

    // Register event handlers
    this.watcher
      .on('add', filePath => {
        console.log(`Asset added: ${filePath}`);
        this.debouncedGenerate();
      })
      .on('change', filePath => {
        console.log(`Asset changed: ${filePath}`);
        this.debouncedGenerate();
      })
      .on('unlink', filePath => {
        console.log(`Asset removed: ${filePath}`);
        this.debouncedGenerate();
      })
      .on('error', error => {
        console.error('Asset watcher error:', error);
      });

    console.log('Asset watcher started successfully');
  }

  /**
   * Stop watching asset files
   */
  async stop(): Promise<void> {
    if (!this.watcher) {
      return;
    }

    console.log('Stopping asset watcher...');

    try {
      await this.watcher.close();
      this.watcher = null;
      console.log('Asset watcher stopped');
    } catch (error) {
      console.error('Failed to stop asset watcher:', error);
    }
  }

  /**
   * Check if watcher is running
   */
  isRunning(): boolean {
    return this.watcher !== null;
  }

  /**
   * Get paths to watch based on asset configuration
   */
  private getWatchPaths(): string[] {
    return this.config.assetPaths.map(assetPath => {
      // Remove trailing slash if present
      const cleanPath = assetPath.endsWith('/') ? assetPath.slice(0, -1) : assetPath;
      return path.join(this.config.projectRoot, cleanPath);
    });
  }

  /**
   * Handle file change event
   */
  private async onFileChange(): Promise<void> {
    console.log('Asset change detected, regenerating...');

    try {
      const result = await this.generator.generate(this.config.projectRoot);

      // Don't show notifications for auto-regeneration to avoid spam
      // User can check OUTPUT panel for details
      if (!result.success) {
        console.error('Auto-regeneration failed:', result.message);
      }
    } catch (error) {
      console.error('Error during auto-regeneration:', error);
    }
  }
}

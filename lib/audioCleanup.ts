import { unlink, readdir, stat } from "fs/promises";
import { join } from "path";

interface CleanupConfig {
  maxAgeHours: number;
  maxFiles: number;
  patterns: string[];
  immediateCleanup: boolean;
}

const DEFAULT_CLEANUP_CONFIG: CleanupConfig = {
  maxAgeHours: 24, // 24 hours
  maxFiles: 100, // Keep only 100 most recent files
  patterns: [
    "memo-*.webm",
    "teil1_*.webm",
    "teil1_user_*.webm",
    "teil2_*.webm",
    "teil3_*.webm",
    "user-*.webm",
    "ai-*.webm",
    "merged-*.mp3",
    "speaking_*.webm",
  ],
  immediateCleanup: true,
};

class AudioCleanupService {
  private config: CleanupConfig;
  private uploadsDir: string;

  constructor(config: CleanupConfig = DEFAULT_CLEANUP_CONFIG) {
    this.config = config;
    this.uploadsDir = join(process.cwd(), "uploads");
  }

  /**
   * Clean up a specific audio file immediately after processing
   */
  async cleanupFile(fileName: string): Promise<boolean> {
    try {
      const filePath = join(this.uploadsDir, fileName);
      await unlink(filePath);
      console.log(`✅ Cleaned up audio file: ${fileName}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to clean up audio file ${fileName}:`, error);
      return false;
    }
  }

  /**
   * Clean up multiple files by pattern
   */
  async cleanupByPattern(pattern: string): Promise<number> {
    try {
      const files = await readdir(this.uploadsDir);
      const patternRegex = new RegExp(pattern.replace("*", ".*"));
      const matchingFiles = files.filter((file) => patternRegex.test(file));

      let cleanedCount = 0;
      for (const file of matchingFiles) {
        const success = await this.cleanupFile(file);
        if (success) cleanedCount++;
      }

      console.log(
        `🧹 Cleaned up ${cleanedCount} files matching pattern: ${pattern}`
      );
      return cleanedCount;
    } catch (error) {
      console.error(
        `❌ Failed to clean up files by pattern ${pattern}:`,
        error
      );
      return 0;
    }
  }

  /**
   * Clean up old files based on age
   */
  async cleanupOldFiles(): Promise<number> {
    try {
      const files = await readdir(this.uploadsDir);
      const now = Date.now();
      const maxAge = this.config.maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds

      let cleanedCount = 0;
      for (const file of files) {
        try {
          const filePath = join(this.uploadsDir, file);
          const stats = await stat(filePath);
          const fileAge = now - stats.mtime.getTime();

          if (fileAge > maxAge) {
            const success = await this.cleanupFile(file);
            if (success) cleanedCount++;
          }
        } catch (error) {
          console.error(`❌ Error checking file ${file}:`, error);
        }
      }

      console.log(
        `🧹 Cleaned up ${cleanedCount} old files (older than ${this.config.maxAgeHours} hours)`
      );
      return cleanedCount;
    } catch (error) {
      console.error("❌ Failed to clean up old files:", error);
      return 0;
    }
  }

  /**
   * Clean up excess files, keeping only the most recent ones
   */
  async cleanupExcessFiles(): Promise<number> {
    try {
      const files = await readdir(this.uploadsDir);
      const audioFiles = files.filter((file) =>
        this.config.patterns.some((pattern) => {
          const patternRegex = new RegExp(pattern.replace("*", ".*"));
          return patternRegex.test(file);
        })
      );

      if (audioFiles.length <= this.config.maxFiles) {
        console.log(
          `📊 No excess files to clean up (${audioFiles.length}/${this.config.maxFiles})`
        );
        return 0;
      }

      // Get file stats and sort by modification time (newest first)
      const fileStats = await Promise.all(
        audioFiles.map(async (file) => {
          const filePath = join(this.uploadsDir, file);
          const stats = await stat(filePath);
          return { file, mtime: stats.mtime };
        })
      );

      fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Keep only the most recent files
      const filesToDelete = fileStats.slice(this.config.maxFiles);
      let cleanedCount = 0;

      for (const { file } of filesToDelete) {
        const success = await this.cleanupFile(file);
        if (success) cleanedCount++;
      }

      console.log(
        `🧹 Cleaned up ${cleanedCount} excess files (kept ${this.config.maxFiles} most recent)`
      );
      return cleanedCount;
    } catch (error) {
      console.error("❌ Failed to clean up excess files:", error);
      return 0;
    }
  }

  /**
   * Perform comprehensive cleanup
   */
  async performCleanup(): Promise<{ oldFiles: number; excessFiles: number; totalCleaned: number }> {
    console.log("🧹 Starting comprehensive audio cleanup...");

    const oldFiles = await this.cleanupOldFiles();
    const excessFiles = await this.cleanupExcessFiles();
    const totalCleaned = oldFiles + excessFiles;

    console.log(`✅ Cleanup completed: ${totalCleaned} files cleaned up`);

    return {
      oldFiles,
      excessFiles,
      totalCleaned,
    };
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats(): Promise<{ totalFiles: number; audioFiles: number; totalSize: number; oldestFile: Date | null; newestFile: Date | null }> {
    try {
      const files = await readdir(this.uploadsDir);
      const audioFiles = files.filter((file) =>
        this.config.patterns.some((pattern) => {
          const patternRegex = new RegExp(pattern.replace("*", ".*"));
          return patternRegex.test(file);
        })
      );

      let oldestFile = null;
      let newestFile = null;
      let totalSize = 0;

      for (const file of audioFiles) {
        try {
          const filePath = join(this.uploadsDir, file);
          const stats = await stat(filePath);
          totalSize += stats.size;

          if (!oldestFile || stats.mtime < oldestFile) {
            oldestFile = stats.mtime;
          }
          if (!newestFile || stats.mtime > newestFile) {
            newestFile = stats.mtime;
          }
        } catch (error) {
          console.error(`❌ Error getting stats for file ${file}:`, error);
        }
      }

      return {
        totalFiles: files.length,
        audioFiles: audioFiles.length,
        oldestFile,
        newestFile,
        totalSize,
      };
    } catch (error) {
      console.error("❌ Failed to get cleanup stats:", error);
      return {
        totalFiles: 0,
        audioFiles: 0,
        oldestFile: null,
        newestFile: null,
        totalSize: 0,
      };
    }
  }
}

// Export singleton instance
const audioCleanup = new AudioCleanupService();

// Utility function for immediate cleanup after processing
async function cleanupAfterProcessing(fileName: string): Promise<void> {
  if (DEFAULT_CLEANUP_CONFIG.immediateCleanup) {
    await audioCleanup.cleanupFile(fileName);
  }
}

// Utility function to generate unique filename with cleanup
function generateAudioFileName(prefix: string, extension: string = "webm"): string {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}.${extension}`;
}

export {
  AudioCleanupService,
  audioCleanup,
  cleanupAfterProcessing,
  generateAudioFileName,
  DEFAULT_CLEANUP_CONFIG,
};

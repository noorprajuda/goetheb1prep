#!/usr/bin/env node

const {
  AudioCleanupService,
  DEFAULT_CLEANUP_CONFIG,
} = require("../lib/audioCleanup.js");

/**
 * Scheduled audio cleanup script
 * This script should be run periodically (e.g., every hour) to clean up old audio files
 *
 * Usage:
 * - Manual: node scripts/scheduled-audio-cleanup.js
 * - Cron: 0 * * * * cd /path/to/project && node scripts/scheduled-audio-cleanup.js
 * - PM2: pm2 start scripts/scheduled-audio-cleanup.js --cron "0 * * * *"
 */

async function runScheduledCleanup() {
  console.log("🕐 Starting scheduled audio cleanup...");
  console.log("📅 Time:", new Date().toISOString());

  try {
    // Create cleanup service with default config
    const cleanupService = new AudioCleanupService(DEFAULT_CLEANUP_CONFIG);

    // Get stats before cleanup
    const statsBefore = await cleanupService.getCleanupStats();
    console.log("📊 Stats before cleanup:", {
      totalFiles: statsBefore.totalFiles,
      audioFiles: statsBefore.audioFiles,
      totalSize: `${(statsBefore.totalSize / 1024 / 1024).toFixed(2)} MB`,
      oldestFile: statsBefore.oldestFile?.toISOString(),
      newestFile: statsBefore.newestFile?.toISOString(),
    });

    // Perform cleanup
    const result = await cleanupService.performCleanup();

    // Get stats after cleanup
    const statsAfter = await cleanupService.getCleanupStats();
    console.log("📊 Stats after cleanup:", {
      totalFiles: statsAfter.totalFiles,
      audioFiles: statsAfter.audioFiles,
      totalSize: `${(statsAfter.totalSize / 1024 / 1024).toFixed(2)} MB`,
      spaceSaved: `${(
        (statsBefore.totalSize - statsAfter.totalSize) /
        1024 /
        1024
      ).toFixed(2)} MB`,
    });

    console.log("✅ Scheduled cleanup completed successfully");
    console.log("📈 Cleanup results:", {
      oldFilesRemoved: result.oldFiles,
      excessFilesRemoved: result.excessFiles,
      totalFilesRemoved: result.totalCleaned,
    });

    // Exit with success code
    process.exit(0);
  } catch (error) {
    console.error("❌ Scheduled cleanup failed:", error);
    console.error("Stack trace:", error.stack);

    // Exit with error code
    process.exit(1);
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  runScheduledCleanup();
}

module.exports = { runScheduledCleanup };

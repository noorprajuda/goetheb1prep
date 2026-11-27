#!/usr/bin/env node

/**
 * GridFS Audio Cleanup Script
 *
 * This script cleans up expired audio files from GridFS storage.
 * It should be run periodically to prevent storage bloat.
 */

const { GridFSService } = require("../lib/gridfsService");

async function cleanupGridFSAudio() {
  try {
    console.log("🧹 Starting GridFS audio cleanup...");

    // Clean up files older than 7 days
    const deletedCount = await GridFSService.cleanupExpiredFiles(7);

    console.log(
      `✅ Cleanup completed. Deleted ${deletedCount} expired audio files.`
    );

    // Get storage statistics
    const stats = await GridFSService.getStorageStats();
    console.log("📊 Storage Statistics:");
    console.log(`   Total files: ${stats.totalFiles}`);
    console.log(
      `   Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(
      `   Average file size: ${(stats.averageFileSize / 1024).toFixed(2)} KB`
    );
  } catch (error) {
    console.error("❌ Error during GridFS cleanup:", error);
    process.exit(1);
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupGridFSAudio()
    .then(() => {
      console.log("🎉 GridFS cleanup script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 GridFS cleanup script failed:", error);
      process.exit(1);
    });
}

module.exports = { cleanupGridFSAudio };

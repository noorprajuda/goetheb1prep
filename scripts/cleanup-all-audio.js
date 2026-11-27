#!/usr/bin/env node

const {
  AudioCleanupService,
  DEFAULT_CLEANUP_CONFIG,
} = require("../lib/audioCleanup.js");
const { readdir, stat } = require("fs/promises");
const { join } = require("path");

/**
 * Comprehensive audio cleanup script
 * This script cleans up ALL audio files in the uploads directory
 * Use with caution - this will delete all audio files!
 *
 * Usage:
 * - Dry run: node scripts/cleanup-all-audio.js --dry-run
 * - Full cleanup: node scripts/cleanup-all-audio.js --force
 * - Clean specific pattern: node scripts/cleanup-all-audio.js --pattern "memo-*" --force
 */

async function listAudioFiles() {
  const uploadsDir = join(process.cwd(), "uploads");

  try {
    const files = await readdir(uploadsDir);
    const audioFiles = files.filter((file) =>
      DEFAULT_CLEANUP_CONFIG.patterns.some((pattern) => {
        const patternRegex = new RegExp(pattern.replace("*", ".*"));
        return patternRegex.test(file);
      })
    );

    console.log("📁 Audio files found:");
    console.log("==================");

    let totalSize = 0;
    for (const file of audioFiles) {
      try {
        const filePath = join(uploadsDir, file);
        const stats = await stat(filePath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        totalSize += stats.size;

        console.log(`📄 ${file} (${sizeMB} MB) - ${stats.mtime.toISOString()}`);
      } catch (error) {
        console.log(`❌ ${file} - Error reading file stats`);
      }
    }

    console.log("==================");
    console.log(
      `📊 Total: ${audioFiles.length} files, ${(
        totalSize /
        1024 /
        1024
      ).toFixed(2)} MB`
    );

    return { files: audioFiles, totalSize };
  } catch (error) {
    console.error("❌ Error listing audio files:", error);
    return { files: [], totalSize: 0 };
  }
}

async function runCleanup(options = {}) {
  const { dryRun = false, force = false, pattern = null } = options;

  console.log("🧹 Audio Cleanup Script");
  console.log("======================");
  console.log("📅 Time:", new Date().toISOString());
  console.log(
    "🔧 Mode:",
    dryRun ? "DRY RUN" : force ? "FORCE CLEANUP" : "NORMAL"
  );
  console.log("");

  if (!dryRun && !force) {
    console.log("⚠️  WARNING: This will delete audio files!");
    console.log(
      "   Use --force to proceed or --dry-run to see what would be deleted"
    );
    console.log("");
    return;
  }

  try {
    // List files before cleanup
    const { files: filesBefore, totalSize: sizeBefore } =
      await listAudioFiles();

    if (filesBefore.length === 0) {
      console.log("✅ No audio files found to clean up");
      return;
    }

    console.log("");

    if (dryRun) {
      console.log("🔍 DRY RUN - No files will be deleted");
      console.log(
        `📊 Would clean up ${filesBefore.length} files (${(
          sizeBefore /
          1024 /
          1024
        ).toFixed(2)} MB)`
      );
      return;
    }

    // Perform cleanup
    const cleanupService = new AudioCleanupService(DEFAULT_CLEANUP_CONFIG);

    let result;
    if (pattern) {
      console.log(`🎯 Cleaning up files matching pattern: ${pattern}`);
      const cleanedCount = await cleanupService.cleanupByPattern(pattern);
      result = { totalCleaned: cleanedCount, oldFiles: 0, excessFiles: 0 };
    } else {
      console.log("🧹 Performing full cleanup...");
      result = await cleanupService.performCleanup();
    }

    // List files after cleanup
    console.log("");
    const { files: filesAfter, totalSize: sizeAfter } = await listAudioFiles();

    console.log("");
    console.log("✅ Cleanup completed!");
    console.log("📈 Results:");
    console.log(`   Files removed: ${result.totalCleaned}`);
    console.log(
      `   Space saved: ${((sizeBefore - sizeAfter) / 1024 / 1024).toFixed(
        2
      )} MB`
    );
    console.log(`   Files remaining: ${filesAfter.length}`);
    console.log(
      `   Space remaining: ${(sizeAfter / 1024 / 1024).toFixed(2)} MB`
    );
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes("--dry-run"),
  force: args.includes("--force"),
  pattern:
    args.find((arg) => arg.startsWith("--pattern="))?.split("=")[1] || null,
};

// Run cleanup
runCleanup(options);

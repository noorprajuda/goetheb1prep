const { MongoClient } = require("mongodb");

async function cleanupExpiredAudio() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection("audio_storage");

    // Find and delete expired audio files
    const result = await collection.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    console.log(`Cleaned up ${result.deletedCount} expired audio files`);
  } catch (error) {
    console.error("Error cleaning up expired audio:", error);
  } finally {
    await client.close();
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanupExpiredAudio();
}

module.exports = { cleanupExpiredAudio };

const cron = require("node-cron");
const { cleanupExpiredAudio } = require("./cleanup-expired-audio");

// Schedule cleanup to run daily at 2 AM
cron.schedule("0 2 * * *", () => {
  console.log("Running daily audio cleanup...");
  cleanupExpiredAudio();
});

console.log("Audio cleanup cron job scheduled to run daily at 2 AM");

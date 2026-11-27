#!/usr/bin/env node

/**
 * Script to fix subscriptions with 1970 dates (Unix epoch)
 * Usage: node scripts/fix-1970-dates.js
 */

const { MongoDBUserService } = require("../lib/mongodbUserService");

async function fix1970Dates() {
  try {
    console.log("🔧 Fixing subscriptions with 1970 dates...");

    // Get database connection
    const { getDatabase } = await import("../lib/mongodb");
    const db = await getDatabase();

    // Find all subscriptions with 1970 dates
    const epochDate = new Date("1970-01-01T00:00:00.000Z");
    const subscriptions = await db
      .collection("subscriptions")
      .find({
        $or: [
          { currentPeriodStart: epochDate },
          { currentPeriodEnd: epochDate },
        ],
      })
      .toArray();

    console.log(
      `📋 Found ${subscriptions.length} subscriptions with 1970 dates`
    );

    for (const subscription of subscriptions) {
      console.log(
        `🔧 Fixing subscription ${subscription._id} for user ${subscription.userId}`
      );

      const now = new Date();
      let currentPeriodStart = subscription.currentPeriodStart;
      let currentPeriodEnd = subscription.currentPeriodEnd;

      // Fix currentPeriodStart if it's 1970
      if (currentPeriodStart.getTime() === epochDate.getTime()) {
        currentPeriodStart = now;
        console.log(`  ✅ Fixed currentPeriodStart: ${currentPeriodStart}`);
      }

      // Fix currentPeriodEnd if it's 1970
      if (currentPeriodEnd.getTime() === epochDate.getTime()) {
        // Calculate end date based on plan
        switch (subscription.plan) {
          case "1day":
            currentPeriodEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case "1week":
            currentPeriodEnd = new Date(
              now.getTime() + 7 * 24 * 60 * 60 * 1000
            );
            break;
          case "1month":
            currentPeriodEnd = new Date(
              now.getTime() + 30 * 24 * 60 * 60 * 1000
            );
            break;
          case "3months":
            currentPeriodEnd = new Date(
              now.getTime() + 90 * 24 * 60 * 60 * 1000
            );
            break;
          case "6months":
            currentPeriodEnd = new Date(
              now.getTime() + 180 * 24 * 60 * 60 * 1000
            );
            break;
          case "lifetime":
            currentPeriodEnd = new Date(
              now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000
            ); // 100 years
            break;
          default:
            currentPeriodEnd = new Date(
              now.getTime() + 30 * 24 * 60 * 60 * 1000
            ); // Default to 30 days
        }
        console.log(
          `  ✅ Fixed currentPeriodEnd: ${currentPeriodEnd} (plan: ${subscription.plan})`
        );
      }

      // Update the subscription
      await db.collection("subscriptions").updateOne(
        { _id: subscription._id },
        {
          $set: {
            currentPeriodStart,
            currentPeriodEnd,
            updatedAt: now,
          },
        }
      );

      console.log(`  ✅ Updated subscription ${subscription._id}`);
    }

    console.log(`✅ Fixed ${subscriptions.length} subscriptions`);
  } catch (error) {
    console.error("❌ Error fixing 1970 dates:", error);
  }
}

fix1970Dates()
  .then(() => {
    console.log("✅ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

#!/usr/bin/env node

/**
 * Script to fix a specific user's subscription with 1970 dates
 * Usage: node scripts/fix-user-subscription.js <userId>
 */

async function fixUserSubscription(userId) {
  try {
    console.log("🔧 Fixing subscription for user:", userId);

    // Get database connection
    const { getDatabase } = await import("../lib/mongodb.ts");
    const db = await getDatabase();

    // Find the subscription with 1970 dates
    const epochDate = new Date("1970-01-01T00:00:00.000Z");
    const subscription = await db.collection("subscriptions").findOne({
      userId: { $oid: userId },
      $or: [{ currentPeriodStart: epochDate }, { currentPeriodEnd: epochDate }],
    });

    if (!subscription) {
      console.log("❌ No subscription with 1970 dates found for user");
      return;
    }

    console.log("📋 Found subscription:", {
      id: subscription._id,
      plan: subscription.plan,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
    });

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
          currentPeriodEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case "1month":
          currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        case "3months":
          currentPeriodEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
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
          currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days
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

    console.log(`✅ Updated subscription ${subscription._id}`);

    // Verify the fix
    const updatedSubscription = await db
      .collection("subscriptions")
      .findOne({ _id: subscription._id });
    console.log("🎯 Updated subscription:", {
      currentPeriodStart: updatedSubscription.currentPeriodStart,
      currentPeriodEnd: updatedSubscription.currentPeriodEnd,
    });
  } catch (error) {
    console.error("❌ Error fixing subscription:", error);
  }
}

// Get userId from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.error("❌ Please provide userId as argument");
  console.log("Usage: node scripts/fix-user-subscription.js <userId>");
  process.exit(1);
}

fixUserSubscription(userId)
  .then(() => {
    console.log("✅ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

#!/usr/bin/env node

/**
 * Script to manually fix subscription status for a user
 * Usage: node scripts/fix-subscription-status.js <userId>
 */

const { MongoDBUserService } = require("../lib/mongodbUserService");
const { SubscriptionService } = require("../lib/subscriptionService");

async function fixSubscriptionStatus(userId) {
  try {
    console.log("🔧 Fixing subscription status for user:", userId);

    // Get user data
    const user = await MongoDBUserService.getUserById(userId);
    if (!user) {
      console.error("❌ User not found");
      return;
    }

    console.log("👤 User data:", {
      email: user.email,
      trialUsed: user.trialUsed,
      trialStartedAt: user.trialStartedAt,
    });

    // Get subscription data
    const userSubscription = await MongoDBUserService.getUserSubscription(
      userId
    );
    console.log("📋 Subscription data:", userSubscription);

    if (userSubscription?.subscription) {
      console.log("✅ Subscription found, checking status...");

      const now = new Date();
      const isActive =
        userSubscription.subscription.status === "active" &&
        userSubscription.subscription.currentPeriodEnd > now;

      console.log("📊 Subscription status:", {
        status: userSubscription.subscription.status,
        currentPeriodEnd: userSubscription.subscription.currentPeriodEnd,
        now: now,
        isActive: isActive,
      });

      if (isActive && !user.trialUsed) {
        console.log("🔧 Fixing trialUsed flag...");
        await MongoDBUserService.updateUser(userId, {
          trialUsed: true,
          trialEndedAt: userSubscription.subscription.currentPeriodStart,
        });
        console.log("✅ Fixed trialUsed flag");
      } else if (isActive) {
        console.log("✅ User already has correct trial status");
      } else {
        console.log("⚠️  Subscription is not active");
      }
    } else {
      console.log("❌ No subscription found for user");
    }

    // Check final status
    const finalStatus = await SubscriptionService.getSubscriptionStatus(userId);
    console.log("🎯 Final subscription status:", finalStatus);
  } catch (error) {
    console.error("❌ Error fixing subscription status:", error);
  }
}

// Get userId from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.error("❌ Please provide userId as argument");
  console.log("Usage: node scripts/fix-subscription-status.js <userId>");
  process.exit(1);
}

fixSubscriptionStatus(userId)
  .then(() => {
    console.log("✅ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

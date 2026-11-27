#!/usr/bin/env node

/**
 * Migration script to move subscriptions and payments from separate collections
 * to embedded documents within user documents
 */

const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in environment variables");
  process.exit(1);
}

async function migrateToEmbeddedSubscriptions() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db();
    const usersCollection = db.collection("users");
    const subscriptionsCollection = db.collection("subscriptions");
    const paymentsCollection = db.collection("payments");

    // Get all users
    const users = await usersCollection.find({}).toArray();
    console.log(`📊 Found ${users.length} users to migrate`);

    let migratedUsers = 0;
    let skippedUsers = 0;
    let errors = 0;

    for (const user of users) {
      try {
        const userId = user._id;

        // Get user's subscription
        const subscription = await subscriptionsCollection.findOne({ userId });

        // Get user's payments
        const payments = await paymentsCollection.find({ userId }).toArray();

        // Prepare update object
        const updateData = {};

        // Migrate subscription if exists
        if (subscription) {
          updateData.subscription = {
            plan: subscription.plan,
            status: subscription.status,
            stripeSubscriptionId: subscription.stripeSubscriptionId,
            stripeCustomerId: subscription.stripeCustomerId,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            cancelled: subscription.cancelled,
            cancelledAt: subscription.cancelledAt,
            autoRenew: subscription.autoRenew || false,
            createdAt: subscription.createdAt,
            updatedAt: subscription.updatedAt,
          };
          console.log(
            `  📝 Migrating subscription for user ${userId}: ${subscription.plan} (${subscription.status})`
          );
        }

        // Migrate payments if exist
        if (payments.length > 0) {
          updateData.payments = payments.map((payment) => ({
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            stripePaymentIntentId: payment.stripePaymentIntentId,
            stripeChargeId: payment.stripeChargeId,
            description: payment.description,
            createdAt: payment.createdAt,
          }));
          console.log(
            `  💳 Migrating ${payments.length} payments for user ${userId}`
          );
        }

        // Update user document
        if (Object.keys(updateData).length > 0) {
          await usersCollection.updateOne(
            { _id: userId },
            { $set: updateData }
          );
          migratedUsers++;
          console.log(`  ✅ Migrated user ${userId}`);
        } else {
          skippedUsers++;
          console.log(
            `  ⏭️  Skipped user ${userId} (no subscription or payments)`
          );
        }
      } catch (error) {
        console.error(`  ❌ Error migrating user ${user._id}:`, error.message);
        errors++;
      }
    }

    console.log("\n📊 Migration Summary:");
    console.log(`  ✅ Successfully migrated: ${migratedUsers} users`);
    console.log(`  ⏭️  Skipped: ${skippedUsers} users`);
    console.log(`  ❌ Errors: ${errors} users`);

    // Optional: Create backup of old collections
    console.log("\n💾 Creating backup of old collections...");
    const backupDate = new Date().toISOString().split("T")[0];

    // Rename collections to backup
    try {
      await subscriptionsCollection.rename(
        `subscriptions_backup_${backupDate}`
      );
      console.log("  ✅ Renamed subscriptions collection to backup");
    } catch (error) {
      console.log(
        "  ⚠️  Could not rename subscriptions collection (may already exist)"
      );
    }

    try {
      await paymentsCollection.rename(`payments_backup_${backupDate}`);
      console.log("  ✅ Renamed payments collection to backup");
    } catch (error) {
      console.log(
        "  ⚠️  Could not rename payments collection (may already exist)"
      );
    }

    console.log("\n🎉 Migration completed successfully!");
    console.log("📝 Next steps:");
    console.log("  1. Update your application code to use embedded structure");
    console.log("  2. Test the new structure thoroughly");
    console.log(
      "  3. After confirming everything works, you can drop the backup collections"
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run migration
migrateToEmbeddedSubscriptions().catch(console.error);

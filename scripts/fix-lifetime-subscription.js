const { MongoClient } = require("mongodb");

async function fixLifetimeSubscription() {
  const client = new MongoClient(
    process.env.MONGODB_URI || "mongodb://localhost:27017/speakingtest"
  );

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("speakingtest");
    const users = db.collection("users");

    // Find users with 6months subscription that should be lifetime
    // We'll look for subscriptions with very far future dates (like 2126) which indicates lifetime
    const farFutureDate = new Date("2120-01-01"); // Any date far in the future

    const usersWithFarFutureSubscriptions = await users
      .find({
        "subscription.plan": "6months",
        "subscription.currentPeriodEnd": { $gt: farFutureDate },
      })
      .toArray();

    console.log(
      `Found ${usersWithFarFutureSubscriptions.length} users with 6months subscription that should be lifetime`
    );

    for (const user of usersWithFarFutureSubscriptions) {
      console.log(
        `Updating user ${user.email} (${user._id}) from 6months to lifetime`
      );

      const result = await users.updateOne(
        { _id: user._id },
        {
          $set: {
            "subscription.plan": "lifetime",
            "subscription.updatedAt": new Date(),
          },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Successfully updated user ${user.email}`);
      } else {
        console.log(`❌ Failed to update user ${user.email}`);
      }
    }

    // Also check for any subscriptions that might have been created with wrong plan
    // Look for subscriptions with end date in 2126 (100 years from now)
    const year2126 = new Date("2126-01-01");
    const year2130 = new Date("2130-01-01");

    const usersWith2126Subscriptions = await users
      .find({
        "subscription.currentPeriodEnd": {
          $gte: year2126,
          $lt: year2130,
        },
        "subscription.plan": { $ne: "lifetime" },
      })
      .toArray();

    console.log(
      `Found ${usersWith2126Subscriptions.length} users with 2126 subscriptions that should be lifetime`
    );

    for (const user of usersWith2126Subscriptions) {
      console.log(
        `Updating user ${user.email} (${user._id}) from ${user.subscription.plan} to lifetime`
      );

      const result = await users.updateOne(
        { _id: user._id },
        {
          $set: {
            "subscription.plan": "lifetime",
            "subscription.updatedAt": new Date(),
          },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Successfully updated user ${user.email}`);
      } else {
        console.log(`❌ Failed to update user ${user.email}`);
      }
    }

    console.log("✅ Fix completed!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

fixLifetimeSubscription();

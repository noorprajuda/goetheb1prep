const { MongoClient } = require("mongodb");

async function fixCurrentSubscriptionToLifetime() {
  const client = new MongoClient(
    "mongodb+srv://goetheb1prep_db_user:MQaJYXaB6uSH7Oy4@cluster0.g2kkknv.mongodb.net/goetheb1prep"
  );

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("goetheb1prep");
    const users = db.collection("users");

    // Find the user
    const user = await users.findOne({
      email: "goetheb1preparation@gmail.com",
    });

    if (!user) {
      console.log("User not found");
      return;
    }

    console.log("Current subscription before fix:");
    console.log(`  Plan: ${user.subscription.plan}`);
    console.log(`  Status: ${user.subscription.status}`);
    console.log(`  Auto Renew: ${user.subscription.autoRenew}`);
    console.log(`  Current Period End: ${user.subscription.currentPeriodEnd}`);

    // Update to lifetime
    const result = await users.updateOne(
      { _id: user._id },
      {
        $set: {
          "subscription.plan": "lifetime",
          "subscription.autoRenew": false,
          "subscription.updatedAt": new Date(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log("✅ Successfully updated subscription to lifetime");

      // Verify the update
      const updatedUser = await users.findOne({ _id: user._id });
      console.log("\nUpdated subscription:");
      console.log(`  Plan: ${updatedUser.subscription.plan}`);
      console.log(`  Status: ${updatedUser.subscription.status}`);
      console.log(`  Auto Renew: ${updatedUser.subscription.autoRenew}`);
      console.log(
        `  Current Period End: ${updatedUser.subscription.currentPeriodEnd}`
      );
    } else {
      console.log("❌ Failed to update subscription");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

fixCurrentSubscriptionToLifetime();

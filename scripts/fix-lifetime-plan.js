const { MongoClient } = require("mongodb");

async function fixLifetimePlan() {
  const client = new MongoClient(
    "mongodb+srv://goetheb1prep_db_user:MQaJYXaB6uSH7Oy4@cluster0.g2kkknv.mongodb.net/goetheb1prep"
  );

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("goetheb1prep");
    const users = db.collection("users");

    // Find the user with the 19999 payment (lifetime plan)
    const user = await users.findOne({
      "payments.amount": 19999,
    });

    if (!user) {
      console.log("No user found with 19999 payment");
      return;
    }

    console.log(`Found user: ${user.email}`);
    console.log(`Current plan: ${user.subscription.plan}`);
    console.log(`Current end date: ${user.subscription.currentPeriodEnd}`);

    // Update the subscription plan to lifetime
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
      console.log("✅ Successfully updated subscription to lifetime plan");

      // Verify the update
      const updatedUser = await users.findOne({ _id: user._id });
      console.log(`Updated plan: ${updatedUser.subscription.plan}`);
      console.log(`Updated autoRenew: ${updatedUser.subscription.autoRenew}`);
    } else {
      console.log("❌ Failed to update subscription");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

fixLifetimePlan();

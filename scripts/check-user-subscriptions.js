const { MongoClient } = require("mongodb");

async function checkUserSubscriptions() {
  const client = new MongoClient(
    process.env.MONGODB_URI ||
      "mongodb+srv://goetheb1prep_db_user:MQaJYXaB6uSH7Oy4@cluster0.g2kkknv.mongodb.net/goetheb1prep"
  );

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("goetheb1prep");
    const users = db.collection("users");

    // First, let's see all users
    const allUsers = await users.find({}).toArray();
    console.log(`Found ${allUsers.length} total users in database`);

    // Find all users with subscriptions
    const usersWithSubscriptions = await users
      .find({
        subscription: { $exists: true },
      })
      .toArray();

    console.log(
      `Found ${usersWithSubscriptions.length} users with subscriptions`
    );

    for (const user of usersWithSubscriptions) {
      console.log("\n" + "=".repeat(50));
      console.log(`User: ${user.email} (${user._id})`);
      console.log(`Created: ${user.createdAt}`);
      console.log(`Updated: ${user.updatedAt}`);

      if (user.subscription) {
        console.log("Subscription details:");
        console.log(`  Plan: ${user.subscription.plan}`);
        console.log(`  Status: ${user.subscription.status}`);
        console.log(
          `  Current Period Start: ${user.subscription.currentPeriodStart}`
        );
        console.log(
          `  Current Period End: ${user.subscription.currentPeriodEnd}`
        );
        console.log(
          `  Stripe Subscription ID: ${user.subscription.stripeSubscriptionId}`
        );
        console.log(
          `  Stripe Customer ID: ${user.subscription.stripeCustomerId}`
        );
        console.log(`  Cancelled: ${user.subscription.cancelled}`);
        console.log(`  Auto Renew: ${user.subscription.autoRenew}`);
        console.log(`  Created: ${user.subscription.createdAt}`);
        console.log(`  Updated: ${user.subscription.updatedAt}`);
      }

      // Check if there are any payments
      if (user.payments && user.payments.length > 0) {
        console.log(`Payments (${user.payments.length}):`);
        user.payments.forEach((payment, index) => {
          console.log(`  Payment ${index + 1}:`);
          console.log(`    Amount: ${payment.amount}`);
          console.log(`    Plan: ${payment.plan}`);
          console.log(`    Status: ${payment.status}`);
          console.log(`    Created: ${payment.createdAt}`);
        });
      }
    }

    // Look specifically for lifetime subscriptions
    const lifetimeUsers = await users
      .find({
        "subscription.plan": "lifetime",
      })
      .toArray();

    console.log("\n" + "=".repeat(50));
    console.log(`LIFETIME SUBSCRIPTIONS: ${lifetimeUsers.length}`);
    for (const user of lifetimeUsers) {
      console.log(`- ${user.email}: ${user.subscription.currentPeriodEnd}`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

checkUserSubscriptions();

const { MongoClient } = require("mongodb");

async function investigateSubscriptions() {
  const client = new MongoClient(
    "mongodb+srv://goetheb1prep_db_user:MQaJYXaB6uSH7Oy4@cluster0.g2kkknv.mongodb.net/goetheb1prep"
  );

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("goetheb1prep");
    const users = db.collection("users");

    // Get the user
    const user = await users.findOne({
      email: "goetheb1preparation@gmail.com",
    });

    if (!user) {
      console.log("User not found");
      return;
    }

    console.log("=".repeat(60));
    console.log(`USER: ${user.email} (${user._id})`);
    console.log("=".repeat(60));

    // Check current subscription
    console.log("CURRENT SUBSCRIPTION:");
    if (user.subscription) {
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
    } else {
      console.log("  No subscription found");
    }

    // Check all payments
    console.log("\nPAYMENTS:");
    if (user.payments && user.payments.length > 0) {
      user.payments.forEach((payment, index) => {
        console.log(`  Payment ${index + 1}:`);
        console.log(
          `    Amount: ${payment.amount} (€${(payment.amount / 100).toFixed(
            2
          )})`
        );
        console.log(`    Plan: ${payment.plan || "undefined"}`);
        console.log(`    Status: ${payment.status}`);
        console.log(
          `    Stripe Payment Intent: ${payment.stripePaymentIntentId}`
        );
        console.log(`    Created: ${payment.createdAt}`);
        console.log(`    Updated: ${payment.updatedAt}`);
      });
    } else {
      console.log("  No payments found");
    }

    // Check if there are any other subscription-related fields
    console.log("\nOTHER SUBSCRIPTION FIELDS:");
    const subscriptionFields = Object.keys(user).filter(
      (key) =>
        key.toLowerCase().includes("subscription") ||
        key.toLowerCase().includes("plan") ||
        key.toLowerCase().includes("trial")
    );
    subscriptionFields.forEach((field) => {
      console.log(`  ${field}: ${JSON.stringify(user[field], null, 2)}`);
    });

    // Look for any embedded subscriptions or multiple subscription objects
    console.log("\nSEARCHING FOR MULTIPLE SUBSCRIPTIONS:");
    const allFields = Object.keys(user);
    allFields.forEach((field) => {
      if (typeof user[field] === "object" && user[field] !== null) {
        if (user[field].plan || user[field].status) {
          console.log(
            `  Found subscription-like object in field '${field}':`,
            JSON.stringify(user[field], null, 2)
          );
        }
      }
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

investigateSubscriptions();

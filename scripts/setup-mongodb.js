const { MongoClient } = require("mongodb");

async function setupMongoDB() {
  const uri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/goetheb1prep";
  const dbName = process.env.MONGODB_DB_NAME || "goetheb1prep";

  console.log("🚀 Setting up MongoDB for Goethe B1 Prep");
  console.log("=====================================");
  console.log(`URI: ${uri}`);
  console.log(`Database: ${dbName}`);

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);

    // Create collections with indexes
    console.log("\n📋 Creating collections and indexes...");

    // Users collection
    await db.createCollection("users");
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ confirmationCode: 1 });
    await db.collection("users").createIndex({ passwordResetToken: 1 });
    console.log("✅ Users collection created with indexes");

    // Subscriptions collection
    await db.createCollection("subscriptions");
    await db
      .collection("subscriptions")
      .createIndex({ userId: 1 }, { unique: true });
    await db
      .collection("subscriptions")
      .createIndex({ stripeSubscriptionId: 1 });
    await db.collection("subscriptions").createIndex({ stripeCustomerId: 1 });
    console.log("✅ Subscriptions collection created with indexes");

    // Payments collection
    await db.createCollection("payments");
    await db.collection("payments").createIndex({ userId: 1 });
    await db.collection("payments").createIndex({ subscriptionId: 1 });
    await db.collection("payments").createIndex({ stripePaymentIntentId: 1 });
    await db.collection("payments").createIndex({ createdAt: -1 });
    console.log("✅ Payments collection created with indexes");

    // Coupons collection
    await db.createCollection("coupons");
    await db.collection("coupons").createIndex({ code: 1 }, { unique: true });
    await db.collection("coupons").createIndex({ isActive: 1 });
    console.log("✅ Coupons collection created with indexes");

    // Audio memos collection
    await db.createCollection("audioMemos");
    await db.collection("audioMemos").createIndex({ userId: 1 });
    await db.collection("audioMemos").createIndex({ createdAt: -1 });
    console.log("✅ Audio memos collection created with indexes");

    // Speaking tests collection
    await db.createCollection("speakingTests");
    await db.collection("speakingTests").createIndex({ userId: 1 });
    await db.collection("speakingTests").createIndex({ testType: 1 });
    await db.collection("speakingTests").createIndex({ createdAt: -1 });
    console.log("✅ Speaking tests collection created with indexes");

    console.log("\n🎉 MongoDB setup completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Set MONGODB_URI in your environment variables");
    console.log("2. Update your application to use MongoDB services");
    console.log("3. Test the connection with: node scripts/test-mongodb.js");
  } catch (error) {
    console.error("❌ Error setting up MongoDB:", error);
  } finally {
    await client.close();
  }
}

// Run setup
setupMongoDB();

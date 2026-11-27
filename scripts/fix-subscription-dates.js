const { MongoClient, ObjectId } = require("mongodb");

async function fixSubscriptionDates() {
  const client = new MongoClient(
    process.env.MONGODB_URI || "mongodb://localhost:27017"
  );

  try {
    await client.connect();
    const db = client.db("goetheb1prep");
    const subscriptions = db.collection("subscriptions");

    // Find subscriptions with invalid dates (1970)
    const invalidSubscriptions = await subscriptions
      .find({
        currentPeriodStart: new Date("1970-01-01T00:00:00.000Z"),
        currentPeriodEnd: new Date("1970-01-01T00:00:00.000Z"),
      })
      .toArray();

    console.log(
      `Found ${invalidSubscriptions.length} subscriptions with invalid dates`
    );

    for (const sub of invalidSubscriptions) {
      const now = new Date();
      let endDate = new Date(now);

      // Calculate end date based on plan
      switch (sub.plan) {
        case "1day":
          endDate.setDate(now.getDate() + 1);
          break;
        case "1week":
          endDate.setDate(now.getDate() + 7);
          break;
        case "1month":
          endDate.setMonth(now.getMonth() + 1);
          break;
        case "3months":
          endDate.setMonth(now.getMonth() + 3);
          break;
        case "6months":
          endDate.setMonth(now.getMonth() + 6);
          break;
        case "lifetime":
          endDate.setFullYear(now.getFullYear() + 100);
          break;
        case "trial":
          endDate.setDate(now.getDate() + 3);
          break;
        default:
          endDate.setDate(now.getDate() + 30);
      }

      // Update the subscription with correct dates
      const result = await subscriptions.updateOne(
        { _id: sub._id },
        {
          $set: {
            currentPeriodStart: now,
            currentPeriodEnd: endDate,
            updatedAt: new Date(),
          },
        }
      );

      console.log(`Updated subscription ${sub._id} (${sub.plan}):`, {
        userId: sub.userId,
        plan: sub.plan,
        startDate: now,
        endDate: endDate,
        modified: result.modifiedCount,
      });
    }

    console.log("✅ All subscription dates fixed!");
  } catch (error) {
    console.error("Error fixing subscription dates:", error);
  } finally {
    await client.close();
  }
}

fixSubscriptionDates();

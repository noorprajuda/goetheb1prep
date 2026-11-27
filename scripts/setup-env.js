const fs = require("fs");
const path = require("path");

function setupEnvironment() {
  console.log("🔧 Setting up Environment Configuration");
  console.log("=====================================");

  const envPath = path.join(process.cwd(), ".env.local");
  const envExample = `# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/goetheb1prep
MONGODB_DB_NAME=goetheb1prep

# For MongoDB Atlas (replace with your connection string):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/goetheb1prep

# Email Configuration (Mailtrap)
MAILTRAP_API_TOKEN=your_mailtrap_api_token
MAILTRAP_ENDPOINT=https://send.api.mailtrap.io/api/send

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# App Configuration
NODE_ENV=development`;

  try {
    // Check if .env.local already exists
    if (fs.existsSync(envPath)) {
      console.log("⚠️  .env.local already exists");
      console.log(
        "   Please update it manually with the MongoDB configuration"
      );
      return;
    }

    // Create .env.local file
    fs.writeFileSync(envPath, envExample);
    console.log("✅ Created .env.local file");
    console.log("   Please update the values with your actual configuration");

    console.log("\n📋 Next Steps:");
    console.log("1. Update .env.local with your actual values");
    console.log("2. Install MongoDB locally or use MongoDB Atlas");
    console.log("3. Run: npm run setup-mongodb");
    console.log("4. Run: npm run test-mongodb");
    console.log("5. Start development: npm run dev");
  } catch (error) {
    console.error("❌ Error creating .env.local:", error.message);
  }
}

// Run setup
setupEnvironment();

#!/usr/bin/env node

/**
 * Setup script to configure Stripe test keys for development
 * Run this script before starting development: node scripts/setup-dev-stripe.js
 */

import fs from "node:fs";
import path from "node:path";

console.log("🔧 Setting up Stripe test keys for development...\n");

// Test keys (safe to use in development)
const testKeys = {
  STRIPE_PUBLISHABLE_KEY:
    process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_SECRET_KEY:
    process.env.STRIPE_SECRET_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    process.env.STRIPE_PUBLISHABLE_KEY,
};

// Read current .env.local
const envPath = path.join(process.cwd(), ".env.local");
let envContent = "";

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, "utf8");
  console.log("📖 Found existing .env.local file");
} else {
  console.log("⚠️  No .env.local file found, creating one...");
}

// Update Stripe keys to test keys
let updatedContent = envContent;

Object.entries(testKeys).forEach(([key, value]) => {
  const regex = new RegExp(`^${key}=.*$`, "m");
  const newLine = `${key}=${value}`;

  if (regex.test(updatedContent)) {
    updatedContent = updatedContent.replace(regex, newLine);
    console.log(`✅ Updated ${key}`);
  } else {
    updatedContent += `\n${newLine}`;
    console.log(`➕ Added ${key}`);
  }
});

// Write updated content
fs.writeFileSync(envPath, updatedContent);

console.log("\n🎉 Stripe test keys configured for development!");
console.log("\n📝 What was updated:");
console.log("   • STRIPE_PUBLISHABLE_KEY → Test key");
console.log("   • STRIPE_SECRET_KEY → Test key");
console.log("   • NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY → Test key");
console.log("\n🚀 You can now run: npm run dev");
console.log("\n💡 Test card numbers for Stripe:");
console.log("   • Success: 4242 4242 4242 4242");
console.log("   • Decline: 4000 0000 0000 0002");
console.log("   • Requires 3D Secure: 4000 0025 0000 3155");
console.log("   • Any future expiry date and CVC");

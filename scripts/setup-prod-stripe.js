#!/usr/bin/env node

/**
 * Setup script to configure Stripe live keys for production
 * Run this script before deploying: node scripts/setup-prod-stripe.js
 */

import fs from "node:fs";
import path from "node:path";

console.log("🔧 Setting up Stripe live keys for production...\n");

// Live keys (for production)
const liveKeys = {
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

// Update Stripe keys to live keys
let updatedContent = envContent;

Object.entries(liveKeys).forEach(([key, value]) => {
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

console.log("\n🎉 Stripe live keys configured for production!");
console.log("\n📝 What was updated:");
console.log("   • STRIPE_PUBLISHABLE_KEY → Live key");
console.log("   • STRIPE_SECRET_KEY → Live key");
console.log("   • NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY → Live key");
console.log("\n🚀 Ready for production deployment!");
console.log("\n⚠️  WARNING: Live keys will process real payments!");

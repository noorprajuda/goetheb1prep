# MongoDB Migration Guide

This guide explains how to migrate from Prisma (SQLite) to MongoDB for the Goethe B1 Prep Speaking Test application.

## 🎯 Migration Overview

The application has been migrated from:

- **From**: Prisma + SQLite
- **To**: MongoDB + Native MongoDB Driver

## 📋 What Was Changed

### 1. Database Layer

- ✅ Created `lib/mongodb.ts` - MongoDB connection
- ✅ Created `lib/models/User.ts` - MongoDB data models
- ✅ Created `lib/mongodbUserService.ts` - MongoDB service layer
- ✅ Updated `lib/userService.ts` - Now uses MongoDB
- ✅ Updated `lib/subscriptionService.ts` - Now uses MongoDB
- ✅ Updated `lib/db.ts` - Now exports MongoDB connection

### 2. Dependencies

- ✅ Removed: `@prisma/client`, `prisma`
- ✅ Added: `mongodb`, `mongoose`
- ✅ Updated `package.json` scripts

### 3. Data Models

All Prisma models converted to MongoDB collections:

- `users` - User accounts and authentication
- `subscriptions` - User subscription data
- `payments` - Payment records
- `coupons` - Discount and trial coupons
- `audioMemos` - Audio recordings
- `speakingTests` - Test results

## 🚀 Setup Instructions

### 1. Install MongoDB

#### Option A: Local MongoDB

```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community

# Ubuntu/Debian
sudo apt-get install -y mongodb
sudo systemctl start mongodb

# Windows
# Download from https://www.mongodb.com/try/download/community
```

#### Option B: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get your connection string

### 2. Set Environment Variables

Create `.env.local` file:

```bash
# MongoDB Configuration
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
NODE_ENV=development
```

### 3. Setup Database

```bash
# Install dependencies
npm install

# Setup MongoDB collections and indexes
npm run setup-mongodb

# Test MongoDB connection
npm run test-mongodb
```

### 4. Start Application

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## 🔧 Database Schema

### Collections Structure

#### Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  confirmationCode: String,
  isEmailVerified: Boolean,
  passwordResetToken: String,
  passwordResetExpires: Date,
  trialUsed: Boolean,
  trialStartedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Subscriptions Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (reference to users),
  plan: String, // "monthly", "yearly", "trial"
  status: String, // "active", "cancelled", "expired", "trial"
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Payments Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (reference to users),
  subscriptionId: ObjectId (reference to subscriptions),
  amount: Number, // Amount in cents
  currency: String,
  status: String, // "pending", "succeeded", "failed", "refunded"
  stripePaymentIntentId: String,
  stripeChargeId: String,
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔄 Data Migration

If you have existing data in SQLite, you'll need to migrate it:

### 1. Export SQLite Data

```bash
# Export users
sqlite3 prisma/dev.db "SELECT * FROM users;" > users_export.csv

# Export subscriptions
sqlite3 prisma/dev.db "SELECT * FROM subscriptions;" > subscriptions_export.csv

# Export payments
sqlite3 prisma/dev.db "SELECT * FROM payments;" > payments_export.csv
```

### 2. Import to MongoDB

```bash
# Use MongoDB Compass or mongoimport
mongoimport --db goetheb1prep --collection users --file users_export.csv --type csv --headerline
mongoimport --db goetheb1prep --collection subscriptions --file subscriptions_export.csv --type csv --headerline
mongoimport --db goetheb1prep --collection payments --file payments_export.csv --type csv --headerline
```

## 🧪 Testing

### Test MongoDB Connection

```bash
npm run test-mongodb
```

### Test Application

```bash
# Start development server
npm run dev

# Test user registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Test subscription creation
curl -X POST http://localhost:3000/api/subscription/start-trial \
  -H "Content-Type: application/json" \
  -H "x-user-id: USER_ID_HERE"
```

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Refused**

   ```bash
   # Check if MongoDB is running
   brew services list | grep mongodb

   # Start MongoDB
   brew services start mongodb/brew/mongodb-community
   ```

2. **Environment Variables Not Set**

   ```bash
   # Check if .env.local exists
   ls -la .env.local

   # Verify MONGODB_URI is set
   echo $MONGODB_URI
   ```

3. **Collection Indexes Missing**

   ```bash
   # Re-run setup script
   npm run setup-mongodb
   ```

4. **TypeScript Errors**

   ```bash
   # Install types
   npm install --save-dev @types/mongodb

   # Rebuild
   npm run build
   ```

### Debug Mode

Enable debug logging:

```bash
NODE_ENV=development DEBUG=mongodb:* npm run dev
```

## 📊 Performance Considerations

### Indexes

The setup script creates optimized indexes:

- `users.email` (unique)
- `subscriptions.userId` (unique)
- `payments.userId` and `payments.createdAt`
- `coupons.code` (unique)

### Connection Pooling

MongoDB connection is automatically pooled and reused across requests.

### Query Optimization

- Use `findOne()` for single documents
- Use `find().toArray()` for multiple documents
- Use `createIndex()` for frequently queried fields

## 🔒 Security

### Data Protection

- Passwords are hashed using bcrypt
- Sensitive data is encrypted at rest (MongoDB Atlas)
- Connection strings use environment variables

### Access Control

- Database access is restricted to application only
- No direct database access from client-side
- API routes validate user authentication

## 📈 Monitoring

### Database Monitoring

- Use MongoDB Compass for visual monitoring
- Monitor connection pool usage
- Track query performance

### Application Monitoring

- Log database operations
- Monitor error rates
- Track response times

## 🆘 Support

If you encounter issues:

1. Check MongoDB logs: `brew services info mongodb/brew/mongodb-community`
2. Verify environment variables
3. Test connection: `npm run test-mongodb`
4. Check application logs
5. Review this migration guide

For MongoDB-specific issues, consult the [MongoDB Documentation](https://docs.mongodb.com/).
For application issues, check the codebase documentation.

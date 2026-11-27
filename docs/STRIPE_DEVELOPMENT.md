# Stripe Development Setup

This guide explains how to configure Stripe for development and production environments.

## 🔧 Development Setup (Test Keys)

For development, use Stripe test keys to avoid processing real payments.

### Quick Setup

```bash
# Set up test keys and start development server
npm run dev:test

# Or manually set up test keys first
npm run stripe:test
npm run dev
```

### Test Card Numbers

When testing payments, use these test card numbers:

| Card Number           | Description        |
| --------------------- | ------------------ |
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Declined payment   |
| `4000 0025 0000 3155` | Requires 3D Secure |
| `4000 0000 0000 9995` | Insufficient funds |

**Note**: Use any future expiry date and any 3-digit CVC.

## 🚀 Production Setup (Live Keys)

For production deployment, switch to live keys.

### Quick Setup

```bash
# Set up live keys for production
npm run stripe:live
```

## 📋 Available Scripts

| Script                | Description                                  |
| --------------------- | -------------------------------------------- |
| `npm run stripe:test` | Configure Stripe test keys                   |
| `npm run stripe:live` | Configure Stripe live keys                   |
| `npm run dev:test`    | Set test keys and start dev server           |
| `npm run dev`         | Start development server (uses current keys) |

## 🔍 Environment Variables

The following Stripe environment variables are configured:

### Test Keys (Development)

- `STRIPE_PUBLISHABLE_KEY` → `pk_test_...`
- `STRIPE_SECRET_KEY` → `sk_test_...`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_test_...`

### Live Keys (Production)

- `STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
- `STRIPE_SECRET_KEY` → `sk_live_...`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`

## ⚠️ Important Notes

1. **Never commit live keys** to version control
2. **Always use test keys** during development
3. **Test thoroughly** with test cards before switching to live keys
4. **Monitor Stripe dashboard** for payment activity

## 🧪 Testing Payment Flow

1. Start development server: `npm run dev:test`
2. Navigate to subscription page
3. Select a plan and click "Choose"
4. Use test card number: `4242 4242 4242 4242`
5. Complete payment in Stripe test mode
6. Verify webhook processing in Stripe dashboard

## 🔄 Switching Between Environments

```bash
# Switch to test keys
npm run stripe:test

# Switch to live keys
npm run stripe:live

# Verify current configuration
cat .env.local | grep STRIPE
```

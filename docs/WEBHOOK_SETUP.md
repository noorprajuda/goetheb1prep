# Stripe Webhook Setup Guide

This guide explains how to set up Stripe webhooks for your Goethe B1 Prep Speaking Test application.

## 🎯 Webhook Endpoint

**URL**: `https://www.goetheb1prep.com/api/webhooks/stripe`

## 📋 Required Webhook Events

Configure these events in your Stripe Dashboard:

### Essential Events

- `customer.subscription.created` - When a new subscription is created
- `customer.subscription.updated` - When subscription details change
- `customer.subscription.deleted` - When a subscription is cancelled
- `invoice.payment_succeeded` - When a payment is successful
- `invoice.payment_failed` - When a payment fails
- `checkout.session.completed` - When checkout is completed

### Optional Events

- `customer.subscription.paused` - When subscription is paused
- `customer.subscription.resumed` - When subscription is resumed

## 🔧 Setup Steps

### 1. Configure Stripe Dashboard

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select the events listed above
5. Click "Add endpoint"

### 2. Get Webhook Secret

1. After creating the webhook, click on it
2. Go to "Signing secret" section
3. Click "Reveal" to get your webhook secret
4. Add it to your environment variables:

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. Test Webhook Locally

For local development, use Stripe CLI:

```bash
# Install Stripe CLI
npm install -g stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will give you a webhook secret for local testing.

## 🧪 Testing Webhooks

### 1. Run Test Script

```bash
node scripts/test-webhook.js
```

### 2. Test with Stripe CLI

```bash
# Test subscription created event
stripe trigger customer.subscription.created

# Test payment succeeded event
stripe trigger invoice.payment_succeeded

# Test payment failed event
stripe trigger invoice.payment_failed
```

### 3. Check Logs

Monitor your application logs to see webhook processing:

```bash
# In development
npm run dev

# In production
# Check your hosting platform's logs
```

## 🔍 Webhook Processing Flow

### 1. Subscription Created

```
Stripe → Webhook → Create Subscription in DB → User gets access
```

### 2. Payment Succeeded

```
Stripe → Webhook → Record Payment → Update Subscription Status → User keeps access
```

### 3. Payment Failed

```
Stripe → Webhook → Record Failed Payment → Update Status to "past_due" → User loses access
```

### 4. Subscription Cancelled

```
Stripe → Webhook → Cancel Subscription → User loses access
```

## 🚨 Troubleshooting

### Common Issues

1. **Webhook not receiving events**

   - Check webhook URL is correct
   - Verify webhook secret is set
   - Check if your server is accessible from internet

2. **Signature verification failed**

   - Ensure webhook secret matches Stripe dashboard
   - Check if request body is being modified

3. **Database errors**
   - Verify Prisma client is generated
   - Check database connection
   - Ensure all required fields are provided

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
```

This will show detailed webhook processing logs.

## 📊 Monitoring

### Webhook Dashboard

- Monitor webhook delivery in Stripe Dashboard
- Check response codes and error messages
- View webhook event history

### Application Logs

- Monitor console logs for webhook processing
- Check for errors in subscription/payment creation
- Verify user access updates

## 🔒 Security

### Best Practices

1. Always verify webhook signatures
2. Use HTTPS for webhook endpoints
3. Validate webhook data before processing
4. Implement idempotency for webhook handlers
5. Log all webhook events for audit

### Rate Limiting

- Stripe has built-in rate limiting
- Implement your own rate limiting if needed
- Handle webhook retries gracefully

## 📈 Scaling

### High Volume

- Consider using webhook queues (Redis, etc.)
- Implement webhook processing workers
- Use database connection pooling

### Reliability

- Implement webhook retry logic
- Store webhook events for reprocessing
- Monitor webhook success rates

## 🆘 Support

If you encounter issues:

1. Check Stripe Dashboard webhook logs
2. Review application logs
3. Test with Stripe CLI
4. Verify environment variables
5. Check database connectivity

For Stripe-specific issues, contact Stripe Support.
For application issues, check the codebase documentation.

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

export interface CreateCheckoutSessionData {
  userId: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}

export class StripeService {
  // Create Stripe customer
  static async createCustomer(email: string, name?: string) {
    return await stripe.customers.create({
      email,
      name,
      metadata: {
        source: 'goethe-b1-prep'
      }
    });
  }

  // Create checkout session for subscription
  static async createCheckoutSession(data: CreateCheckoutSessionData) {
    const { userId, planId, successUrl, cancelUrl, customerEmail } = data;
    
    console.log('StripeService.createCheckoutSession called with:', { userId, planId, customerEmail });
    
    // Get plan details
    const plan = this.getPlanDetails(planId);
    if (!plan) {
      console.error('Invalid plan ID:', planId);
      throw new Error('Invalid plan ID');
    }
    
    console.log('Plan details retrieved:', plan);

    // Determine if it's a one-time payment or subscription
    const isOneTime = plan.interval === 'one_time';
    const mode = isOneTime ? 'payment' : 'subscription';
    
    let lineItems: Array<{
      price_data?: {
        currency: string;
        product_data: { name: string; description?: string };
        unit_amount: number;
      };
      price?: string;
      quantity: number;
    }> = [];

    if (isOneTime) {
      // For one-time payments, use price_data
      lineItems = [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: plan.name,
              description: plan.features.join(', '),
            },
            unit_amount: Math.round(plan.price * 100), // Convert euros to cents
          },
          quantity: 1,
        },
      ];
    } else {
      // For recurring subscriptions, create product and price first
      try {
        // Create product
        const product = await stripe.products.create({
          name: plan.name,
          description: plan.features.join(', '),
        });

        // Create price
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(plan.price * 100), // Convert euros to cents
          currency: 'eur',
          recurring: {
            interval: plan.interval,
            ...(planId === '3months' ? { interval_count: 3 } : {}),
            ...(planId === '6months' ? { interval_count: 6 } : {})
          },
        });

        lineItems = [
          {
            price: price.id,
            quantity: 1,
          },
        ];
      } catch (error) {
        console.error('Error creating Stripe product/price:', error);
        throw new Error('Failed to create Stripe product/price for recurring subscription');
      }
    }

    // Create a fresh customer for each checkout session to prevent reuse
    // Use the actual user's email to ensure proper verification
    let customerId: string;
    if (customerEmail) {
      // Use the actual user's email directly
      const customer = await this.createCustomer(customerEmail, `User ${userId}`);
      customerId = customer.id;
    } else {
      // Create anonymous customer with unique email
      const customer = await this.createCustomer(`user-${userId}@temp.com`, `User ${userId}`);
      customerId = customer.id;
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId, // Use specific customer ID instead of email
      payment_method_types: ['card'],
      line_items: lineItems,
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId,
        customerId, // Store customer ID in metadata for reference
      },
    };

    // Add subscription data only for recurring plans
    if (!isOneTime) {
      sessionConfig.subscription_data = {
        metadata: {
          userId,
          planId,
        },
        // No trial period - subscription starts immediately
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return session;
  }

  // Get plan details
  static getPlanDetails(planId: string) {
    const plans = {
      '1day': {
        name: '1 Day Plan',
        price: 7.99, // €7.99 in euros (€8.00 - €0.01)
        interval: 'one_time' as const,
        features: [
          'Unlimited speaking tests',
          'AI feedback',
          'All test parts'
        ]
      },
      '1week': {
        name: '1 Week Plan',
        price: 14.99, // €14.99 in euros (€15.00 - €0.01)
        interval: 'one_time' as const,
        features: [
          'Unlimited speaking tests',
          'AI feedback',
          'All test parts'
        ]
      },
      '1month': {
        name: '1 Month Plan',
        price: 29.99, // €29.99 per month in euros (€30.00 - €0.01)
        interval: 'month' as const,
        features: [
          'Unlimited speaking tests',
          'AI feedback',
          'Progress tracking',
          'All test parts'
        ]
      },
      '3months': {
        name: '3 Months Plan',
        price: 69.99, // €69.99 for 3 months in euros (€70.00 - €0.01)
        interval: 'month' as const,
        features: [
          'Unlimited speaking tests',
          'AI feedback',
          'Progress tracking',
          'All test parts'
        ]
      },
      '6months': {
        name: '6 Months Plan',
        price: 119.99, // €119.99 for 6 months in euros (€120.00 - €0.01)
        interval: 'month' as const,
        features: [
          'Unlimited speaking tests',
          'AI feedback',
          'Progress tracking',
          'All test parts'
        ]
      },
      'lifetime': {
        name: 'Lifetime Plan',
        price: 199.99, // €199.99 in euros (€200.00 - €0.01)
        interval: 'one_time' as const,
        features: [
          'Unlimited speaking tests',
          'AI feedback',
          'Progress tracking',
          'All test parts',
          'Access forever'
        ]
      }
    };

    return plans[planId as keyof typeof plans] || null;
  }

  // Retrieve subscription from Stripe
  static async getSubscription(subscriptionId: string) {
    return await stripe.subscriptions.retrieve(subscriptionId);
  }

  // Cancel subscription in Stripe
  static async cancelSubscription(subscriptionId: string) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  // Reactivate subscription in Stripe
  static async reactivateSubscription(subscriptionId: string) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  // Create portal session for customer management
  static async createPortalSession(customerId: string, returnUrl: string) {
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  // Handle webhook events
  static async handleWebhook(payload: string, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_TEST_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_TEST_SECRET is not set');
    }

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  // Get checkout session details
  static async getCheckoutSession(sessionId: string) {
    return await stripe.checkout.sessions.retrieve(sessionId);
  }
}

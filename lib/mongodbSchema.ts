import { Db } from 'mongodb';

/**
 * MongoDB schema validation and indexes for better data integrity
 */
export async function setupMongoDBSchema(db: Db) {
  try {
    console.log('🔧 Setting up MongoDB schema validation and indexes...');

    // Users collection validation with embedded subscription
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['email', 'password', 'isEmailVerified', 'emailConsent', 'createdAt', 'updatedAt'],
          properties: {
            email: {
              bsonType: 'string',
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              description: 'Email must be a valid email address'
            },
            password: {
              bsonType: 'string',
              minLength: 6,
              description: 'Password must be at least 6 characters'
            },
            firstName: {
              bsonType: 'string',
              maxLength: 50,
              description: 'First name must be a string with max 50 characters'
            },
            lastName: {
              bsonType: 'string',
              maxLength: 50,
              description: 'Last name must be a string with max 50 characters'
            },
            isEmailVerified: {
              bsonType: 'bool',
              description: 'isEmailVerified must be a boolean'
            },
            emailConsent: {
              bsonType: 'bool',
              description: 'emailConsent must be a boolean'
            },
            // Embedded subscription validation
            subscription: {
              bsonType: 'object',
              properties: {
                plan: {
                  bsonType: 'string',
                  enum: ['trial', '1day', '1week', '1month', '3months', '6months', 'lifetime'],
                  description: 'plan must be one of the valid subscription plans'
                },
                status: {
                  bsonType: 'string',
                  enum: ['active', 'cancelled', 'expired', 'trial'],
                  description: 'status must be one of the valid subscription statuses'
                },
                stripeSubscriptionId: {
                  bsonType: 'string',
                  description: 'stripeSubscriptionId must be a string'
                },
                stripeCustomerId: {
                  bsonType: 'string',
                  description: 'stripeCustomerId must be a string'
                },
                currentPeriodStart: {
                  bsonType: 'date',
                  description: 'currentPeriodStart must be a valid date'
                },
                currentPeriodEnd: {
                  bsonType: 'date',
                  description: 'currentPeriodEnd must be a valid date'
                },
                cancelAtPeriodEnd: {
                  bsonType: 'bool',
                  description: 'cancelAtPeriodEnd must be a boolean'
                },
                cancelled: {
                  bsonType: 'bool',
                  description: 'cancelled must be a boolean indicating if subscription was cancelled by user'
                },
                cancelledAt: {
                  bsonType: 'date',
                  description: 'cancelledAt must be a valid date when subscription was cancelled'
                },
                autoRenew: {
                  bsonType: 'bool',
                  description: 'autoRenew must be a boolean indicating if subscription should auto-renew'
                },
                createdAt: {
                  bsonType: 'date',
                  description: 'subscription createdAt must be a valid date'
                },
                updatedAt: {
                  bsonType: 'date',
                  description: 'subscription updatedAt must be a valid date'
                }
              },
              required: ['plan', 'status', 'currentPeriodStart', 'currentPeriodEnd', 'cancelAtPeriodEnd', 'createdAt', 'updatedAt'],
              description: 'subscription must be a valid subscription object'
            },
            // Embedded payments validation
            payments: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                properties: {
                  amount: {
                    bsonType: 'number',
                    minimum: 0,
                    description: 'amount must be a non-negative number'
                  },
                  currency: {
                    bsonType: 'string',
                    description: 'currency must be a string'
                  },
                  status: {
                    bsonType: 'string',
                    enum: ['pending', 'succeeded', 'failed', 'refunded'],
                    description: 'status must be one of the valid payment statuses'
                  },
                  stripePaymentIntentId: {
                    bsonType: 'string',
                    description: 'stripePaymentIntentId must be a string'
                  },
                  stripeChargeId: {
                    bsonType: 'string',
                    description: 'stripeChargeId must be a string'
                  },
                  stripeSessionId: {
                    bsonType: 'string',
                    description: 'stripeSessionId must be a string'
                  },
                  description: {
                    bsonType: 'string',
                    description: 'description must be a string'
                  },
                  planId: {
                    bsonType: 'string',
                    description: 'planId must be a string'
                  },
                  paymentType: {
                    bsonType: 'string',
                    enum: ['one_time', 'subscription', 'trial_conversion'],
                    description: 'paymentType must be one of the valid payment types'
                  },
                  source: {
                    bsonType: 'string',
                    enum: ['verify_session', 'webhook', 'manual', 'auto_renewal'],
                    description: 'source must be one of the valid payment sources'
                  },
                  subscriptionBefore: {
                    bsonType: 'object',
                    properties: {
                      plan: { bsonType: 'string' },
                      currentPeriodStart: { bsonType: 'date' },
                      currentPeriodEnd: { bsonType: 'date' }
                    },
                    description: 'subscriptionBefore must be a valid subscription state object'
                  },
                  subscriptionAfter: {
                    bsonType: 'object',
                    properties: {
                      plan: { bsonType: 'string' },
                      currentPeriodStart: { bsonType: 'date' },
                      currentPeriodEnd: { bsonType: 'date' }
                    },
                    description: 'subscriptionAfter must be a valid subscription state object'
                  },
                  extensionDays: {
                    bsonType: 'number',
                    minimum: 0,
                    description: 'extensionDays must be a non-negative number'
                  },
                  createdAt: {
                    bsonType: 'date',
                    description: 'payment createdAt must be a valid date'
                  },
                  processedAt: {
                    bsonType: 'date',
                    description: 'payment processedAt must be a valid date'
                  }
                },
                required: ['amount', 'currency', 'status', 'createdAt', 'updatedAt'],
                description: 'payment must be a valid payment object'
              },
              description: 'payments must be an array of payment objects'
            },
            createdAt: {
              bsonType: 'date',
              description: 'createdAt must be a valid date'
            },
            updatedAt: {
              bsonType: 'date',
              description: 'updatedAt must be a valid date'
            }
          }
        }
      }
    });

    // Create indexes for better performance
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ createdAt: 1 });
    
    // Indexes for embedded subscription fields
    await db.collection('users').createIndex({ 'subscription.status': 1 });
    await db.collection('users').createIndex({ 'subscription.currentPeriodEnd': 1 });
    await db.collection('users').createIndex({ 'subscription.plan': 1 });
    await db.collection('users').createIndex({ 'subscription.autoRenew': 1 });
    
    // Indexes for embedded payment fields
    await db.collection('users').createIndex({ 'payments.status': 1 });
    await db.collection('users').createIndex({ 'payments.createdAt': 1 });
    
    // Unique compound index to prevent duplicate payments
    // This will prevent the same payment intent ID from being processed multiple times
    await db.collection('users').createIndex({ 
      'payments.stripePaymentIntentId': 1 
    }, { 
      unique: true, 
      partialFilterExpression: { 
        'payments.stripePaymentIntentId': { $exists: true, $ne: null } 
      },
      name: 'unique_payment_intent_id'
    });

    console.log('✅ MongoDB schema validation and indexes set up successfully');

  } catch (error) {
    // Collections might already exist, which is fine
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('ℹ️  Collections already exist, skipping creation');
    } else {
      console.error('❌ Error setting up MongoDB schema:', error);
    }
  }
}

/**
 * Validate subscription dates to prevent 1970 dates and other issues
 */
export function validateSubscriptionDates(currentPeriodStart: Date, currentPeriodEnd: Date): boolean {
  const now = new Date();
  const epochDate = new Date('1970-01-01T00:00:00.000Z');
  
  // Check for 1970 dates (Unix epoch)
  if (currentPeriodStart.getTime() === epochDate.getTime() || 
      currentPeriodEnd.getTime() === epochDate.getTime()) {
    console.warn('⚠️  Invalid subscription dates detected (1970 epoch)');
    return false;
  }
  
  // Check for future dates that are too far in the future (more than 100 years)
  const maxFutureDate = new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000);
  if (currentPeriodStart > maxFutureDate || currentPeriodEnd > maxFutureDate) {
    console.warn('⚠️  Subscription dates are too far in the future');
    return false;
  }
  
  // Check for dates too far in the past (more than 10 years ago)
  const minPastDate = new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);
  if (currentPeriodStart < minPastDate || currentPeriodEnd < minPastDate) {
    console.warn('⚠️  Subscription dates are too far in the past');
    return false;
  }
  
  // Check that end date is after start date
  if (currentPeriodEnd <= currentPeriodStart) {
    console.warn('⚠️  Subscription end date must be after start date');
    return false;
  }
  
  return true;
}

/**
 * Create safe subscription dates based on plan
 */
export function createSafeSubscriptionDates(plan: string, startDate?: Date): { currentPeriodStart: Date; currentPeriodEnd: Date } {
  const now = new Date();
  const start = startDate || now;
  
  const endDate = new Date(start);
  
  switch (plan) {
    case 'trial':
      endDate.setDate(start.getDate() + 2); // 3 days total: registration day + 2 additional days
      break;
    case '1day':
      endDate.setDate(start.getDate() + 1); // 1 day subscription = start date + 1 day
      break;
    case '1week':
      endDate.setDate(start.getDate() + 7); // 1 week
      break;
    case '1month':
      endDate.setMonth(start.getMonth() + 1); // 1 month
      break;
    case '3months':
      endDate.setMonth(start.getMonth() + 3); // 3 months
      break;
    case '6months':
      endDate.setMonth(start.getMonth() + 6); // 6 months
      break;
    case 'lifetime':
      endDate.setFullYear(start.getFullYear() + 100); // 100 years (effectively lifetime)
      break;
    default:
      endDate.setDate(start.getDate() + 30); // Default to 30 days
  }
  
  // Validate the dates
  if (!validateSubscriptionDates(start, endDate)) {
    console.warn('⚠️  Generated dates failed validation, using fallback');
    return {
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days fallback
    };
  }
  
  return {
    currentPeriodStart: start,
    currentPeriodEnd: endDate
  };
}

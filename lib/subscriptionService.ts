import { MongoDBUserService } from './mongodbUserService';
import { createSafeSubscriptionDates, validateSubscriptionDates } from './mongodbSchema';
// import { User } from './models/User';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // in cents
  interval: 'month' | 'year';
  features: string[];
  discount?: number; // percentage discount for yearly
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 2000, // €20.00
    interval: 'month',
    features: [
      'Unlimited speaking tests',
      'AI-powered feedback',
      'Progress tracking',
      'All test parts (Teil 1, 2, 3)'
    ]
  },
  {
    id: 'yearly',
    name: 'Yearly Plan',
    price: 12000, // €120.00 (50% discount from €240)
    interval: 'year',
    discount: 50,
    features: [
      'Unlimited speaking tests',
      'AI-powered feedback',
      'Progress tracking',
      'All test parts (Teil 1, 2, 3)',
      '50% savings compared to monthly'
    ]
  }
];

export interface CreateSubscriptionData {
  userId: string;
  plan: string;
  status?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd?: boolean;
  cancelled?: boolean;
  cancelledAt?: Date;
  autoRenew?: boolean;
}

export interface CreatePaymentData {
  userId: string;
  subscriptionId?: string;
  amount: number;
  currency?: string;
  status: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeSessionId?: string;
  description?: string;
  planId?: string;
  paymentType?: string;
  source?: string;
  subscriptionBefore?: {
    plan: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  };
  subscriptionAfter?: {
    plan: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  };
  extensionDays?: number;
}

export class SubscriptionService {
  // Check if user has active subscription or trial
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    const user = await MongoDBUserService.getUserById(userId);

    if (!user) return false;

    // Check if user has active subscription (including trial)
    const userSubscription = await MongoDBUserService.getUserSubscription(userId);
    if (userSubscription?.subscription) {
      const now = new Date();
      const subscription = userSubscription.subscription;
      
      // Check if subscription is still within valid period (regardless of cancellation status)
      const isWithinPeriod = subscription.currentPeriodEnd > now;
      
      // Check if subscription is still active (not expired, regardless of cancellation)
      return subscription.status === 'active' && isWithinPeriod;
    }

    return false;
  }

  // Start free trial for user
  static async startTrial(userId: string): Promise<void> {
    // Check if user already has a subscription
    const existingSubscription = await MongoDBUserService.getUserSubscription(userId);
    if (existingSubscription?.subscription) {
      return; // User already has a subscription
    }

    // Create trial subscription
    const now = new Date();
    await this.createSubscription({
      userId,
      plan: 'trial',
      stripeSubscriptionId: `trial_${userId}`,
      stripeCustomerId: `trial_customer_${userId}`,
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    });
  }

  // Create subscription
  static async createSubscription(data: CreateSubscriptionData) {
    // Validate and create safe dates
    const dates = createSafeSubscriptionDates(data.plan, data.currentPeriodStart);
    
    // Validate the provided dates if they exist
    if (data.currentPeriodStart && data.currentPeriodEnd) {
      if (!validateSubscriptionDates(data.currentPeriodStart, data.currentPeriodEnd)) {
        console.warn('⚠️  Invalid subscription dates provided, using safe defaults');
      } else {
        // Use provided dates if they're valid
        dates.currentPeriodStart = data.currentPeriodStart;
        dates.currentPeriodEnd = data.currentPeriodEnd;
      }
    }
    
    // Enable auto-renewal for daily/weekly plans
    const autoRenew = ['1day', '1week'].includes(data.plan);
    
    return await MongoDBUserService.createSubscription({
      userId: data.userId,
      plan: data.plan,
      status: data.status || 'active',
      stripeSubscriptionId: data.stripeSubscriptionId,
      stripeCustomerId: data.stripeCustomerId,
      currentPeriodStart: dates.currentPeriodStart,
      currentPeriodEnd: dates.currentPeriodEnd,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
      cancelled: data.cancelled || false,
      cancelledAt: data.cancelledAt,
      autoRenew: data.autoRenew !== undefined ? data.autoRenew : autoRenew
    });
  }

  // Update subscription
  static async updateSubscription(
    userId: string, 
    data: Partial<CreateSubscriptionData>
  ) {
    const updateData: Record<string, unknown> = {};
    
    if (data.plan) updateData.plan = data.plan;
    if (data.stripeSubscriptionId) updateData.stripeSubscriptionId = data.stripeSubscriptionId;
    if (data.stripeCustomerId) updateData.stripeCustomerId = data.stripeCustomerId;
    if (data.currentPeriodStart) updateData.currentPeriodStart = data.currentPeriodStart;
    if (data.currentPeriodEnd) updateData.currentPeriodEnd = data.currentPeriodEnd;
    if (data.status) updateData.status = data.status;
    if (data.cancelAtPeriodEnd !== undefined) updateData.cancelAtPeriodEnd = data.cancelAtPeriodEnd;
    if (data.cancelled !== undefined) updateData.cancelled = data.cancelled;
    if (data.cancelledAt) updateData.cancelledAt = data.cancelledAt;
    if (data.autoRenew !== undefined) updateData.autoRenew = data.autoRenew;

    return await MongoDBUserService.updateSubscription(userId, updateData);
  }

  // Cancel subscription
  static async cancelSubscription(userId: string) {
    return await MongoDBUserService.cancelSubscription(userId);
  }

  // Create payment record with detailed tracking
  static async createPayment(data: CreatePaymentData) {
    return await MongoDBUserService.createPayment(data.userId, {
      amount: data.amount,
      currency: data.currency || 'eur',
      status: data.status,
      stripePaymentIntentId: data.stripePaymentIntentId,
      stripeChargeId: data.stripeChargeId,
      stripeSessionId: data.stripeSessionId,
      description: data.description,
      planId: data.planId,
      paymentType: data.paymentType || 'one_time',
      source: data.source || 'manual',
      subscriptionBefore: data.subscriptionBefore,
      subscriptionAfter: data.subscriptionAfter,
      extensionDays: data.extensionDays
    });
  }

  // Get user subscription details
  static async getUserSubscription(userId: string) {
    return await MongoDBUserService.getUserWithRelations(userId);
  }

  // Check if user can access premium features
  static async canAccessPremium(userId: string): Promise<boolean> {
    const user = await MongoDBUserService.getUserById(userId);

    if (!user) return false;

    // Check if user has an active subscription (including trial)
    const userSubscription = await MongoDBUserService.getUserSubscription(userId);
    if (userSubscription?.subscription) {
      const now = new Date();
      const subscription = userSubscription.subscription;
      
      // Check if subscription is still within valid period (regardless of cancellation status)
      const isWithinPeriod = subscription.currentPeriodEnd > now;
      
      // Check if subscription is still active (not expired, regardless of cancellation)
      const isActive = subscription.status === 'active' && isWithinPeriod;
      
      if (isActive) return true;
    }

    return false;
  }

  // Convert trial to paid subscription
  static async convertTrialToSubscription(
    userId: string, 
    plan: string, 
    stripeSubscriptionId: string, 
    stripeCustomerId: string,
    currentPeriodStart?: Date,
    currentPeriodEnd?: Date
  ) {
    const user = await MongoDBUserService.getUserById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Use provided timestamps or calculate from now
    // For trial conversion, preserve the original trial start date
    let startTime = currentPeriodStart;
    let endTime = currentPeriodEnd;
    
    // If no start time provided, use current time
    if (!startTime) {
      startTime = new Date();
    }

    console.log('convertTrialToSubscription - Input dates:', {
      currentPeriodStart,
      currentPeriodEnd,
      startTime,
      endTime,
      plan
    });

    // If no end time provided, calculate based on plan
    if (!endTime) {
      endTime = new Date(startTime);
      
      switch (plan) {
        case '1day':
          endTime.setDate(startTime.getDate() + 1); // 1 day subscription = start date + 1 day
          break;
        case '1week':
          endTime.setDate(startTime.getDate() + 7);
          break;
        case '1month':
          endTime.setMonth(startTime.getMonth() + 1);
          break;
        case '3months':
          endTime.setMonth(startTime.getMonth() + 3);
          break;
        case '6months':
          endTime.setMonth(startTime.getMonth() + 6);
          break;
        case 'lifetime':
          // Set far future date for lifetime
          endTime.setFullYear(startTime.getFullYear() + 100);
          break;
        default:
          throw new Error('Invalid plan');
      }
    }

    console.log('convertTrialToSubscription - Calculated dates:', {
      startTime,
      endTime,
      startTimeValid: startTime instanceof Date && !isNaN(startTime.getTime()),
      endTimeValid: endTime instanceof Date && !isNaN(endTime.getTime())
    });

    // Check if user already has a subscription (trial or paid)
    const existingSubscription = await MongoDBUserService.getUserSubscription(userId);
    
    if (existingSubscription?.subscription) {
      // If user has a trial, extend it with the paid subscription duration
      if (existingSubscription.subscription.plan === 'trial') {
        console.log(`Converting trial to paid subscription for user ${userId}, extending trial period`);
        
        // Check if the existing subscription has expired relative to the purchase time
        const currentEndDate = new Date(existingSubscription.subscription.currentPeriodEnd);
        
        let baseDate;
        if (currentEndDate > startTime) {
          // Subscription is still active relative to purchase time, extend from current end date
          baseDate = currentEndDate;
          console.log('Trial still active relative to purchase time, extending from current end date:', baseDate);
        } else {
          // Subscription has expired relative to purchase time, start fresh from provided start time
          baseDate = startTime;
          console.log('Trial expired relative to purchase time, starting fresh from provided start time:', baseDate);
        }
        
        console.log('Subscription extension details:', {
          currentEndDate: currentEndDate.toISOString(),
          plan: plan,
          extendingFrom: 'current end date'
        });
        
        const newEndDate = new Date(baseDate);
        
        // Add the paid subscription duration to the base date
        switch (plan) {
          case '1day':
            newEndDate.setDate(baseDate.getDate() + 1);
            break;
          case '1week':
            newEndDate.setDate(baseDate.getDate() + 7);
            break;
          case '1month':
            newEndDate.setMonth(baseDate.getMonth() + 1);
            break;
          case '3months':
            newEndDate.setMonth(baseDate.getMonth() + 3);
            break;
          case '6months':
            newEndDate.setMonth(baseDate.getMonth() + 6);
            break;
          case 'lifetime':
            newEndDate.setFullYear(baseDate.getFullYear() + 100);
            break;
          default:
            newEndDate.setDate(baseDate.getDate() + 30);
        }
        
        console.log(`Trial conversion dates:`, {
          baseDate,
          newEndDate,
          plan,
          additionalDays: plan === '1day' ? 1 : 'varies'
        });
        
        const updatedSubscription = await this.updateSubscription(
          userId, // Use userId instead of subscription._id for embedded structure
          {
            plan,
            status: 'active',
            stripeSubscriptionId,
            stripeCustomerId,
            currentPeriodStart: baseDate, // Start from current end date (when paid period begins)
            currentPeriodEnd: newEndDate // Extend from current end date
          }
        );
        
        return updatedSubscription;
      } else {
        // Update existing paid subscription - extend the current end date
        console.log(`Extending existing paid subscription for user ${userId} from ${existingSubscription.subscription.plan} to ${plan}`);
        
        // Check if the existing subscription has expired relative to the purchase time
        const currentEndDate = new Date(existingSubscription.subscription.currentPeriodEnd);
        
        let baseDate;
        if (currentEndDate > startTime) {
          // Subscription is still active relative to purchase time, extend from current end date
          baseDate = currentEndDate;
          console.log('Paid subscription still active relative to purchase time, extending from current end date:', baseDate);
        } else {
          // Subscription has expired relative to purchase time, start fresh from provided start time
          baseDate = startTime;
          console.log('Paid subscription expired relative to purchase time, starting fresh from provided start time:', baseDate);
        }
        
        const newEndDate = new Date(baseDate);
        
        // Add the new subscription duration to the base date
        // Use the payment plan duration, not the existing subscription plan
        switch (plan) {
          case '1day':
            newEndDate.setDate(baseDate.getDate() + 1);
            break;
          case '1week':
            newEndDate.setDate(baseDate.getDate() + 7);
            break;
          case '1month':
            newEndDate.setMonth(baseDate.getMonth() + 1);
            break;
          case '3months':
            newEndDate.setMonth(baseDate.getMonth() + 3);
            break;
          case '6months':
            newEndDate.setMonth(baseDate.getMonth() + 6);
            break;
          case 'lifetime':
            newEndDate.setFullYear(baseDate.getFullYear() + 100);
            break;
          default:
            newEndDate.setDate(baseDate.getDate() + 30);
        }
        
        console.log(`Extending subscription:`, {
          currentEndDate,
          newEndDate,
          plan,
          additionalDays: plan === '1day' ? 1 : 'varies'
        });
        
        const updatedSubscription = await this.updateSubscription(
          userId, // Use userId instead of subscription._id for embedded structure
          {
            plan: existingSubscription.subscription.plan, // Keep existing plan, don't change it
            status: 'active',
            stripeSubscriptionId,
            stripeCustomerId,
            currentPeriodStart: new Date(existingSubscription.subscription.currentPeriodStart), // Keep original start
            currentPeriodEnd: newEndDate // Extend from current end date
          }
        );
        
        return updatedSubscription;
      }
    } else {
      // Create new subscription if none exists (shouldn't happen in normal flow)
      console.log(`Creating new subscription for user ${userId} with plan ${plan}`);
      
      const subscriptionData = {
        userId,
        plan,
        status: 'active',
        stripeSubscriptionId,
        stripeCustomerId,
        currentPeriodStart: startTime,
        currentPeriodEnd: endTime
      };

      await this.createSubscription(subscriptionData);
      return subscriptionData;
    }
  }

  // Get subscription status for user
  static async getSubscriptionStatus(userId: string) {
    const user = await MongoDBUserService.getUserById(userId);

    if (!user) {
      return { hasAccess: false, status: 'no_user' };
    }

    // Check if user has an active subscription (including trial)
    const userSubscription = await MongoDBUserService.getUserSubscription(userId);
    console.log('Subscription status check for user:', userId);
    console.log('User subscription data:', userSubscription);
    console.log('Raw user data from database:', await MongoDBUserService.getUserById(userId));
    
    if (userSubscription?.subscription) {
      const now = new Date();
      let subscription = userSubscription.subscription;
      
      // Check for lifetime payments - if user has paid €199.99, they should have lifetime access
      const hasLifetimePayment = user.payments && user.payments.some((payment: { amount: number; status: string }) => 
        payment.amount === 19999 && payment.status === 'succeeded'
      );
      
      if (hasLifetimePayment) {
        console.log('Lifetime payment detected, overriding subscription plan to lifetime');
        // Override the subscription plan to lifetime for display purposes
        subscription = {
          ...subscription,
          plan: 'lifetime',
          autoRenew: false // Lifetime subscriptions don't auto-renew
        };
      }
      
      // Check if subscription is cancelled by user
      const isCancelled = subscription.cancelled === true;
      
      // Check if subscription is still within valid period (regardless of cancellation status)
      const isWithinPeriod = subscription.currentPeriodEnd > now;
      
      // Check if subscription is still active (not expired, regardless of cancellation)
      const isActive = subscription.status === 'active' && isWithinPeriod;
      
      console.log('Subscription found:', {
        plan: subscription.plan,
        status: subscription.status,
        cancelled: subscription.cancelled,
        currentPeriodEnd: subscription.currentPeriodEnd,
        now: now,
        isActive: isActive,
        isCancelled: isCancelled,
        isWithinPeriod: isWithinPeriod,
        hasLifetimePayment: hasLifetimePayment
      });
      
      return {
        hasAccess: isActive,
        status: isActive ? 'active' : 'expired', // Always return 'active' for any active subscription (trial or paid)
        subscription: {
          ...subscription,
          id: subscription.stripeSubscriptionId || `embedded_${userId}` // Add id field for frontend compatibility
        },
        currentPeriodEnd: subscription.currentPeriodEnd
      };
    }

    return { hasAccess: false, status: 'no_subscription' };
  }

  // Upgrade existing subscription to lifetime
  static async upgradeToLifetime(
    userId: string,
    stripeSubscriptionId: string,
    stripeCustomerId: string,
    paymentTime: Date
  ) {
    const user = await MongoDBUserService.getUserById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    console.log('upgradeToLifetime - Upgrading user to lifetime:', {
      userId,
      currentPlan: user.subscription?.plan,
      paymentTime
    });

    // Calculate lifetime end date (100 years from payment time)
    const endDate = new Date(paymentTime);
    endDate.setFullYear(paymentTime.getFullYear() + 100);

    // Update the existing subscription to lifetime
    const updatedSubscription = await MongoDBUserService.createSubscription({
      userId,
      plan: 'lifetime',
      status: 'active',
      stripeSubscriptionId,
      stripeCustomerId,
      currentPeriodStart: paymentTime,
      currentPeriodEnd: endDate,
      cancelAtPeriodEnd: false,
      cancelled: false,
      autoRenew: false, // Lifetime subscriptions don't auto-renew
    });

    console.log('upgradeToLifetime - Subscription updated to lifetime:', updatedSubscription);

    return {
      success: true,
      subscription: updatedSubscription
    };
  }

  // Transfer subscription from one user to another (for cross-account payments)
  static async transferSubscription(fromUserId: string, toUserId: string) {
    // Get the subscription from the source user using MongoDBUserService
    const fromUserSubscription = await MongoDBUserService.getUserSubscription(fromUserId);
    
    if (!fromUserSubscription?.subscription) {
      return false;
    }
    
    // Create the subscription for the target user
    const result = await MongoDBUserService.createSubscription({
      userId: toUserId,
      plan: fromUserSubscription.subscription.plan,
      status: fromUserSubscription.subscription.status,
      stripeSubscriptionId: fromUserSubscription.subscription.stripeSubscriptionId,
      stripeCustomerId: fromUserSubscription.subscription.stripeCustomerId,
      currentPeriodStart: fromUserSubscription.subscription.currentPeriodStart,
      currentPeriodEnd: fromUserSubscription.subscription.currentPeriodEnd,
      cancelAtPeriodEnd: fromUserSubscription.subscription.cancelAtPeriodEnd,
      cancelled: fromUserSubscription.subscription.cancelled,
      cancelledAt: fromUserSubscription.subscription.cancelledAt,
      autoRenew: fromUserSubscription.subscription.autoRenew
    });
    
    // Cancel the subscription for the source user
    if (result) {
      await MongoDBUserService.cancelSubscription(fromUserId);
    }

    if (result) {
      console.log(`Subscription transferred from user ${fromUserId} to user ${toUserId}`);
      return true;
    }

    return false;
  }
}
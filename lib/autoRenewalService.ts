import { MongoDBUserService } from './mongodbUserService';
import { StripeService } from './stripeService';
// import { SubscriptionService } from './subscriptionService';

export interface AutoRenewalResult {
  success: boolean;
  checkoutUrl?: string;
  error?: string;
  subscriptionId?: string;
}

export class AutoRenewalService {
  /**
   * Process automatic renewals for expiring short-term subscriptions
   */
  static async processAutoRenewals(): Promise<{ processed: number; successful: number; failed: number }> {
    console.log('🔄 Starting auto-renewal process...');
    
    try {
      // Get all users with expiring daily/weekly subscriptions
      const expiringSubscriptions = await MongoDBUserService.getUsersWithExpiringShortTermSubscriptions();
      
      console.log(`Found ${expiringSubscriptions.length} expiring subscriptions to process`);
      
      let successful = 0;
      let failed = 0;
      
      for (const { subscription, user } of expiringSubscriptions) {
        try {
          console.log(`Processing auto-renewal for user ${user._id}, plan: ${subscription.plan}`);
          
          const result = await this.createAutoRenewalCheckout(user._id.toString(), subscription.plan, user.email);
          
          if (result.success) {
            console.log(`✅ Auto-renewal checkout created for user ${user._id}: ${result.checkoutUrl}`);
            successful++;
          } else {
            console.error(`❌ Failed to create auto-renewal for user ${user._id}: ${result.error}`);
            failed++;
          }
        } catch (error) {
          console.error(`❌ Error processing auto-renewal for user ${user._id}:`, error);
          failed++;
        }
      }
      
      console.log(`Auto-renewal process completed: ${successful} successful, ${failed} failed`);
      
      return {
        processed: expiringSubscriptions.length,
        successful,
        failed
      };
    } catch (error) {
      console.error('❌ Error in auto-renewal process:', error);
      throw error;
    }
  }

  /**
   * Create automatic renewal checkout session for a user
   */
  static async createAutoRenewalCheckout(
    userId: string, 
    planId: string, 
    userEmail: string
  ): Promise<AutoRenewalResult> {
    try {
      const baseUrl = process.env.BASE_URL || 
                     process.env.APP_URL || 
                     process.env.NEXT_PUBLIC_APP_URL || 
                     (process.env.NODE_ENV === 'production' ? 'https://www.goetheb1prep.com' : 'http://localhost:3000');
      
      // Create checkout session for renewal
      const session = await StripeService.createCheckoutSession({
        userId,
        planId,
        successUrl: `${baseUrl}/ngrok-bypass?session_id={CHECKOUT_SESSION_ID}&auto_renewal=true`,
        cancelUrl: `${baseUrl}/subscription?auto_renewal_cancelled=true`,
        customerEmail: userEmail,
      });

      // Store the renewal checkout session ID in the current subscription for tracking
      await this.updateSubscriptionWithRenewalInfo(userId, session.id);

      return {
        success: true,
        checkoutUrl: session.url || undefined,
        subscriptionId: session.id
      };
    } catch (error) {
      console.error(`Error creating auto-renewal checkout for user ${userId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update subscription with renewal checkout session info
   */
  private static async updateSubscriptionWithRenewalInfo(userId: string, checkoutSessionId: string) {
    try {
      const userSubscription = await MongoDBUserService.getUserSubscription(userId);
      if (userSubscription?.subscription) {
        await MongoDBUserService.updateSubscription(
          userId,
          {
            // Store renewal checkout session ID for tracking
            stripeSubscriptionId: `renewal_${checkoutSessionId}`,
            updatedAt: new Date()
          }
        );
      }
    } catch (error) {
      console.error(`Error updating subscription with renewal info for user ${userId}:`, error);
    }
  }

  /**
   * Handle successful auto-renewal payment
   */
  static async handleSuccessfulAutoRenewal(
    userId: string, 
    planId: string, 
    checkoutSessionId: string
  ) {
    try {
      console.log(`Processing successful auto-renewal for user ${userId}, plan: ${planId}`);
      
      // Get the current subscription
      const userSubscription = await MongoDBUserService.getUserSubscription(userId);
      if (!userSubscription?.subscription) {
        throw new Error('No existing subscription found for auto-renewal');
      }

      const currentSubscription = userSubscription.subscription;
      const now = new Date();
      
      // Calculate new period based on plan
      const newEndDate = new Date(currentSubscription.currentPeriodEnd);
      switch (planId) {
        case '1day':
          newEndDate.setDate(newEndDate.getDate() + 1);
          break;
        case '1week':
          newEndDate.setDate(newEndDate.getDate() + 7);
          break;
        default:
          newEndDate.setDate(newEndDate.getDate() + 1);
      }

      // Update the existing subscription with new period
      await MongoDBUserService.updateSubscription(
        userId,
        {
          currentPeriodEnd: newEndDate,
          stripeSubscriptionId: `renewed_${checkoutSessionId}`,
          autoRenew: true, // Ensure auto-renewal remains enabled
          updatedAt: now
        }
      );

      console.log(`✅ Auto-renewal successful for user ${userId}, new end date: ${newEndDate}`);
      
      return {
        success: true,
        newEndDate,
        subscriptionId: userId
      };
    } catch (error) {
      console.error(`Error handling successful auto-renewal for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Handle failed auto-renewal (user cancelled or payment failed)
   */
  static async handleFailedAutoRenewal(userId: string, reason: string = 'user_cancelled') {
    try {
      console.log(`Processing failed auto-renewal for user ${userId}, reason: ${reason}`);
      
      const userSubscription = await MongoDBUserService.getUserSubscription(userId);
      if (userSubscription?.subscription) {
        // Disable auto-renewal for this subscription
        await MongoDBUserService.updateSubscription(
          userId,
          {
            autoRenew: false,
            updatedAt: new Date()
          }
        );
        
        console.log(`✅ Auto-renewal disabled for user ${userId}`);
      }
    } catch (error) {
      console.error(`Error handling failed auto-renewal for user ${userId}:`, error);
    }
  }

  /**
   * Enable auto-renewal for a subscription
   */
  static async enableAutoRenewal(subscriptionId: string): Promise<boolean> {
    try {
      await MongoDBUserService.updateSubscription(subscriptionId, {
        autoRenew: true,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error(`Error enabling auto-renewal for subscription ${subscriptionId}:`, error);
      return false;
    }
  }

  /**
   * Disable auto-renewal for a subscription
   */
  static async disableAutoRenewal(subscriptionId: string): Promise<boolean> {
    try {
      await MongoDBUserService.updateSubscription(subscriptionId, {
        autoRenew: false,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error(`Error disabling auto-renewal for subscription ${subscriptionId}:`, error);
      return false;
    }
  }
}

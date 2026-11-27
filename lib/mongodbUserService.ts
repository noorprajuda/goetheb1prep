import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { dbConnect } from './mongodb';
import { User, UserWithRelations, EmbeddedPayment, Coupon, AudioMemo, SpeakingTest } from './models/User';

export class MongoDBUserService {
  private static async getCollection(collectionName: string) {
    const mongoose = await dbConnect();
    if (!mongoose) {
      throw new Error('MongoDB connection not available');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (mongoose as any).connection.db.collection(collectionName);
  }

  // User operations
  static async createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const users = await this.getCollection('users');
    const now = new Date();
    
    const user: User = {
      ...userData,
      createdAt: now,
      updatedAt: now,
    };

    const result = await users.insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  static async getUserById(id: string): Promise<User | null> {
    const users = await this.getCollection('users');
    return await users.findOne({ _id: new ObjectId(id) }) as User | null;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getCollection('users');
    return await users.findOne({ email }) as User | null;
  }

  static async getUserByToken(token: string): Promise<User | null> {
    const users = await this.getCollection('users');
    return await users.findOne({ emailVerificationToken: token }) as User | null;
  }

  static async updateUser(id: string, updateData: Partial<User>): Promise<User | null> {
    const users = await this.getCollection('users');
    const now = new Date();
    
    const result = await users.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: now 
        } 
      },
      { returnDocument: 'after' }
    );
    
    return result as User | null;
  }

  static async deleteUser(id: string): Promise<boolean> {
    const users = await this.getCollection('users');
    const result = await users.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  static async getUserWithRelations(id: string): Promise<UserWithRelations | null> {
    const users = await this.getCollection('users');
    const audioMemos = await this.getCollection('audioMemos');
    const speakingTests = await this.getCollection('speakingTests');

    const user = await users.findOne({ _id: new ObjectId(id) }) as User | null;
    if (!user) return null;

    // Get audio memos and speaking tests (still separate collections)
    const [userAudioMemos, userSpeakingTests] = await Promise.all([
      audioMemos.find({ userId: new ObjectId(id) }).toArray() as Promise<AudioMemo[]>,
      speakingTests.find({ userId: new ObjectId(id) }).toArray() as Promise<SpeakingTest[]>,
    ]);

    return {
      ...user,
      // subscription and payments are now embedded in user
      audioMemos: userAudioMemos,
      speakingTests: userSpeakingTests,
    };
  }

  // Authentication helpers
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateConfirmationCode(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static setPasswordResetExpiry(): Date {
    return new Date(Date.now() + 3600000); // 1 hour from now
  }

  // Subscription operations (now embedded in user documents)
  static async createSubscription(subscriptionData: {
    userId: string;
    plan: string;
    status: string;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    cancelled?: boolean;
    cancelledAt?: Date;
    autoRenew?: boolean;
  }): Promise<User['subscription']> {
    const users = await this.getCollection('users');
    const now = new Date();
    
    const embeddedSubscription: User['subscription'] = {
      plan: subscriptionData.plan,
      status: subscriptionData.status,
      stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
      stripeCustomerId: subscriptionData.stripeCustomerId,
      currentPeriodStart: subscriptionData.currentPeriodStart,
      currentPeriodEnd: subscriptionData.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
      cancelled: subscriptionData.cancelled || false,
      cancelledAt: subscriptionData.cancelledAt,
      autoRenew: subscriptionData.autoRenew || false,
      createdAt: now,
      updatedAt: now,
    };

    await users.updateOne(
      { _id: new ObjectId(subscriptionData.userId) },
      { 
        $set: { 
          subscription: embeddedSubscription,
          updatedAt: now
        } 
      }
    );
    
    return embeddedSubscription;
  }

  static async getUserSubscription(userId: string): Promise<{ subscription?: User['subscription']; hasAccess: boolean } | null> {
    const users = await this.getCollection('users');
    const user = await users.findOne({ _id: new ObjectId(userId) }) as User | null;
    
    if (!user || !user.subscription) {
      return { hasAccess: false };
    }

    const now = new Date();
    const isWithinPeriod = user.subscription.currentPeriodEnd > now;
    const isActive = user.subscription.status === 'active' && isWithinPeriod;

    return {
      subscription: user.subscription,
      hasAccess: isActive,
    };
  }

  static async updateSubscription(userId: string, updateData: Partial<User['subscription']>): Promise<User['subscription'] | null> {
    const users = await this.getCollection('users');
    const now = new Date();
    
    // Build update object with dot notation to update only specific fields
    const updateFields: Record<string, unknown> = {
      updatedAt: now
    };
    
    // Add subscription fields with dot notation
    if (updateData) {
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof User['subscription']] !== undefined) {
          updateFields[`subscription.${key}`] = updateData[key as keyof User['subscription']];
        }
      });
    }
    
    // Always update subscription.updatedAt
    updateFields['subscription.updatedAt'] = now;
    
    const result = await users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { 
        $set: updateFields
      },
      { returnDocument: 'after' }
    );
    
    return result?.subscription || null;
  }

  static async cancelSubscription(userId: string): Promise<boolean> {
    const users = await this.getCollection('users');
    const now = new Date();
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          'subscription.cancelled': true,
          'subscription.cancelledAt': now,
          'subscription.cancelAtPeriodEnd': true,
          'subscription.autoRenew': false, // Disable auto-renewal when cancelling
          'subscription.updatedAt': now,
          updatedAt: now
        } 
      }
    );
    
    return result.modifiedCount > 0;
  }

  // Payment operations (now embedded in user documents)
  static async createPayment(userId: string, paymentData: Omit<EmbeddedPayment, 'createdAt' | 'processedAt'>): Promise<EmbeddedPayment> {
    const users = await this.getCollection('users');
    const now = new Date();
    
    const payment: EmbeddedPayment = {
      ...paymentData,
      createdAt: now,
      processedAt: now,
    };

    await users.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $push: { payments: payment },
        $set: { updatedAt: now }
      }
    );
    
    return payment;
  }

  static async getUserPayments(userId: string): Promise<EmbeddedPayment[]> {
    const users = await this.getCollection('users');
    const user = await users.findOne({ _id: new ObjectId(userId) }) as User | null;
    return user?.payments || [];
  }


  // Coupon operations
  static async createCoupon(couponData: Omit<Coupon, '_id' | 'createdAt' | 'updatedAt'>): Promise<Coupon> {
    const coupons = await this.getCollection('coupons');
    const now = new Date();
    
    const coupon: Coupon = {
      ...couponData,
      createdAt: now,
      updatedAt: now,
    };

    const result = await coupons.insertOne(coupon);
    return { ...coupon, _id: result.insertedId } as Coupon;
  }

  static async getCouponByCode(code: string): Promise<Coupon | null> {
    const coupons = await this.getCollection('coupons');
    return await coupons.findOne({ code }) as Coupon | null;
  }

  static async updateCoupon(couponId: string, updateData: Partial<Coupon>): Promise<Coupon | null> {
    const coupons = await this.getCollection('coupons');
    const now = new Date();
    
    const result = await coupons.findOneAndUpdate(
      { _id: new ObjectId(couponId) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: now 
        } 
      },
      { returnDocument: 'after' }
    );
    
    return result as Coupon | null;
  }

  // Subscription status check
  static async getSubscriptionStatus(userId: string): Promise<{ hasAccess: boolean; status: string }> {
    const userSubscription = await this.getUserSubscription(userId);
    
    if (!userSubscription?.subscription) {
      return { hasAccess: false, status: 'no_subscription' };
    }

    const now = new Date();
    const subscription = userSubscription.subscription;
    
    // Check if subscription is still within valid period (regardless of cancellation status)
    const isWithinPeriod = subscription.currentPeriodEnd > now;

    if (subscription.status === 'active' && isWithinPeriod) {
      return { hasAccess: true, status: 'active' };
    }

    if (subscription.status === 'trial' && isWithinPeriod) {
      return { hasAccess: true, status: 'trial' };
    }

    return { hasAccess: false, status: subscription.status };
  }

  // Get all payments for a user

  // Get expiring subscriptions that need auto-renewal (now embedded)
  static async getExpiringSubscriptions(plan: string, hoursBeforeExpiry: number = 24) {
    const users = await this.getCollection('users');
    const now = new Date();
    const expiryThreshold = new Date(now.getTime() + hoursBeforeExpiry * 60 * 60 * 1000);
    
    return await users.find({
      'subscription.plan': plan,
      'subscription.status': 'active',
      'subscription.autoRenew': true,
      'subscription.cancelled': { $ne: true }, // Not cancelled
      'subscription.currentPeriodEnd': {
        $gte: now, // Not yet expired
        $lte: expiryThreshold // Expiring within threshold
      }
    }).toArray();
  }

  // Get all users with expiring daily/weekly subscriptions (now embedded)
  static async getUsersWithExpiringShortTermSubscriptions() {
    const users = await this.getCollection('users');
    const now = new Date();
    const expiryThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Find users with expiring short-term subscriptions
    const expiringUsers = await users.find({
      'subscription.plan': { $in: ['1day', '1week'] },
      'subscription.status': 'active',
      'subscription.autoRenew': true,
      'subscription.cancelled': { $ne: true },
      'subscription.currentPeriodEnd': {
        $gte: now,
        $lte: expiryThreshold
      }
    }).toArray();

    // Format result to match expected structure
    return expiringUsers.map((user: User) => ({
      subscription: user.subscription,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    }));
  }

  // Processing lock methods to prevent race conditions
  static async acquireProcessingLock(userId: string, lockKey: string, expiry: Date): Promise<boolean> {
    const users = await this.getCollection('users');
    const now = new Date();
    
    try {
      // Use findOneAndUpdate for atomic operation
      const result = await users.findOneAndUpdate(
        { 
          _id: new ObjectId(userId),
          $or: [
            { [`processingLocks.${lockKey}`]: { $exists: false } },
            { [`processingLocks.${lockKey}.expiry`]: { $lt: now } }
          ]
        },
        { 
          $set: { 
            [`processingLocks.${lockKey}`]: {
              acquiredAt: now,
              expiry: expiry
            }
          }
        },
        { 
          returnDocument: 'after',
          upsert: false
        }
      );

      return result !== null;
    } catch (error) {
      console.error('Error acquiring processing lock:', error);
      return false;
    }
  }

  static async releaseProcessingLock(userId: string, lockKey: string): Promise<void> {
    const users = await this.getCollection('users');
    
    try {
      await users.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $unset: { 
            [`processingLocks.${lockKey}`]: 1 
          }
        }
      );
    } catch (error) {
      console.error('Error releasing processing lock:', error);
    }
  }

  // Atomic payment creation to prevent duplicates
  static async createPaymentAtomically(userId: string, paymentData: { amount: number; status: string; stripePaymentIntentId?: string; createdAt: Date }, uniqueId: string): Promise<{ success: boolean; error?: string }> {
    const users = await this.getCollection('users');
    
    try {
      // Use findOneAndUpdate with upsert: false to atomically check and create
      // This will only create if the payment doesn't already exist
      const result = await users.findOneAndUpdate(
        { 
          _id: new ObjectId(userId),
          'payments': { 
            $not: { 
              $elemMatch: { 
                description: { $regex: `UniqueID: ${uniqueId}` } 
              } 
            } 
          }
        },
        { 
          $push: { 
            payments: {
              ...paymentData,
              _id: new ObjectId() // Generate unique ID for the payment
            }
          },
          $set: { 
            updatedAt: new Date() 
          }
        },
        { 
          returnDocument: 'after',
          upsert: false
        }
      );

      if (result) {
        console.log('✅ Atomic payment creation successful');
        return { success: true };
      } else {
        console.log('🚫 Payment already exists - atomic check prevented duplicate');
        return { success: false, error: 'Payment already exists' };
      }
    } catch (error) {
      console.error('❌ Error in atomic payment creation:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

}

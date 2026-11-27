import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  confirmationCode?: string;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  isEmailVerified: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailConsent: boolean; // New field for email consent
  
  // Embedded subscription (single source of truth)
  subscription?: {
    plan: string; // "trial", "1day", "1week", "1month", "3months", "6months", "lifetime"
    status: string; // "active", "cancelled", "expired", "trial"
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    cancelled?: boolean; // Track if subscription was cancelled by user
    cancelledAt?: Date; // When the subscription was cancelled
    autoRenew?: boolean; // Track if subscription should auto-renew (for daily/weekly plans)
    createdAt: Date;
    updatedAt: Date;
  };
  
  // Embedded payments array
  payments?: EmbeddedPayment[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithRelations extends User {
  audioMemos?: AudioMemo[];
  speakingTests?: SpeakingTest[];
  // payments and subscription are now embedded in User
}

export interface AudioMemo {
  _id?: ObjectId;
  audioFilePath: string;
  createdAt: Date;
  transcription?: string;
  status: string;
  summary?: string;
  userId?: ObjectId;
}

export interface SpeakingTest {
  _id?: ObjectId;
  userId: ObjectId;
  testType: string; // "teil1", "teil2", "teil3"
  topic?: string;
  audioFilePath?: string;
  transcription?: string;
  score?: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription is now embedded in User interface above

// Embedded payment within user document
export interface EmbeddedPayment {
  amount: number; // Amount in cents
  currency: string;
  status: string; // "pending", "succeeded", "failed", "refunded"
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeSessionId?: string; // Checkout session ID
  description?: string;
  planId?: string; // Which plan was purchased
  paymentType?: string; // "one_time", "subscription", "trial_conversion"
  source?: string; // "verify_session", "webhook", "manual", "auto_renewal"
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
  extensionDays?: number; // How many days were added
  createdAt: Date;
  processedAt?: Date; // When the payment was actually processed
}

// Legacy Payment interface for backward compatibility during migration
export interface Payment {
  _id?: ObjectId;
  userId: ObjectId;
  amount: number; // Amount in cents
  currency: string;
  status: string; // "pending", "succeeded", "failed", "refunded"
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coupon {
  _id?: ObjectId;
  code: string;
  type: string; // "trial", "discount"
  discountPercentage?: number; // For discount coupons
  discountAmount?: number; // For fixed amount discounts
  validFrom: Date;
  validUntil?: Date;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

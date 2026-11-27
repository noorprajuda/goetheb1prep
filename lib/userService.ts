// bcrypt is now handled by MongoDBUserService
import crypto from 'crypto';
import { MongoDBUserService } from './mongodbUserService';
import { SubscriptionService } from './subscriptionService';

export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  emailConsent?: boolean;
}

export interface LoginUserData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  confirmationCode: string | null;
  emailVerificationToken: string | null;
  emailVerificationExpires: Date | null;
  isEmailVerified: boolean;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  // Generate a 6-digit confirmation code
  static generateConfirmationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate a secure email verification token
  static generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate a secure password reset token
  static generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create a new user
  static async createUser(userData: CreateUserData): Promise<User> {
    const { email, password, firstName, lastName, emailConsent } = userData;
    
    // Check if user already exists
    const existingUser = await MongoDBUserService.getUserByEmail(email);
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Hash the password
    const hashedPassword = await MongoDBUserService.hashPassword(password);
    
    // Generate email verification token
    const emailVerificationToken = this.generateEmailVerificationToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    // Create user in database
    const user = await MongoDBUserService.createUser({
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      confirmationCode: undefined, // Keep for backward compatibility but don't use
      emailVerificationToken,
      emailVerificationExpires,
      isEmailVerified: false,
      emailConsent: emailConsent || false,
    });

    // Create a trial subscription with proper dates (3 days from account creation)
    const trialStart = new Date(user.createdAt); // Use the exact user creation time
    const trialEnd = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + 2); // 3 days total: registration day + 2 additional days
    
    await SubscriptionService.createSubscription({
      userId: user._id!.toString(),
      plan: 'trial',
      stripeSubscriptionId: `trial_${user._id}`,
      stripeCustomerId: `trial_customer_${user._id}`,
      currentPeriodStart: trialStart,
      currentPeriodEnd: trialEnd,
    });
    
    return {
      id: user._id!.toString(),
      email: user.email,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      confirmationCode: user.confirmationCode || null,
      emailVerificationToken: user.emailVerificationToken || null,
      emailVerificationExpires: user.emailVerificationExpires || null,
      isEmailVerified: user.isEmailVerified,
      passwordResetToken: user.passwordResetToken || null,
      passwordResetExpires: user.passwordResetExpires || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
  
  // Authenticate user login
  static async authenticateUser(loginData: LoginUserData): Promise<User> {
    const { email, password } = loginData;
    
    // Find user by email
    const user = await MongoDBUserService.getUserByEmail(email);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Verify password
    const isPasswordValid = await MongoDBUserService.verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }
    
    // Return user without password
    return {
      id: user._id!.toString(),
      email: user.email,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      confirmationCode: user.confirmationCode || null,
      emailVerificationToken: user.emailVerificationToken || null,
      emailVerificationExpires: user.emailVerificationExpires || null,
      isEmailVerified: user.isEmailVerified,
      passwordResetToken: user.passwordResetToken || null,
      passwordResetExpires: user.passwordResetExpires || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
  
  // Get user by ID
  static async getUserById(id: string): Promise<User | null> {
    const user = await MongoDBUserService.getUserById(id);
    
    if (!user) return null;
    
    return {
      id: user._id!.toString(),
      email: user.email,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      confirmationCode: user.confirmationCode || null,
      emailVerificationToken: user.emailVerificationToken || null,
      emailVerificationExpires: user.emailVerificationExpires || null,
      isEmailVerified: user.isEmailVerified,
      passwordResetToken: user.passwordResetToken || null,
      passwordResetExpires: user.passwordResetExpires || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
  
  // Update user
  static async updateUser(id: string, updateData: Partial<CreateUserData>): Promise<User> {
    const updateFields: Record<string, unknown> = {};
    
    if (updateData.firstName !== undefined) {
      updateFields.firstName = updateData.firstName;
    }
    
    if (updateData.lastName !== undefined) {
      updateFields.lastName = updateData.lastName;
    }
    
    if (updateData.email !== undefined) {
      updateFields.email = updateData.email;
    }
    
    if (updateData.password !== undefined) {
      updateFields.password = await MongoDBUserService.hashPassword(updateData.password);
    }
    
    const user = await MongoDBUserService.updateUser(id, updateFields);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      id: user._id!.toString(),
      email: user.email,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      confirmationCode: user.confirmationCode || null,
      emailVerificationToken: user.emailVerificationToken || null,
      emailVerificationExpires: user.emailVerificationExpires || null,
      isEmailVerified: user.isEmailVerified,
      passwordResetToken: user.passwordResetToken || null,
      passwordResetExpires: user.passwordResetExpires || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
  
  // Find user by email
  static async findUserByEmail(email: string): Promise<User | null> {
    const user = await MongoDBUserService.getUserByEmail(email);
    
    if (!user) return null;
    
    return {
      id: user._id!.toString(),
      email: user.email,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      confirmationCode: user.confirmationCode || null,
      emailVerificationToken: user.emailVerificationToken || null,
      emailVerificationExpires: user.emailVerificationExpires || null,
      isEmailVerified: user.isEmailVerified,
      passwordResetToken: user.passwordResetToken || null,
      passwordResetExpires: user.passwordResetExpires || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  // Find user by verification token
  static async findByVerificationToken(token: string): Promise<User | null> {
    const user = await MongoDBUserService.getUserByToken(token);
    
    if (!user) return null;
    
    return {
      id: user._id!.toString(),
      email: user.email,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      confirmationCode: user.confirmationCode || null,
      emailVerificationToken: user.emailVerificationToken || null,
      emailVerificationExpires: user.emailVerificationExpires || null,
      isEmailVerified: user.isEmailVerified,
      passwordResetToken: user.passwordResetToken || null,
      passwordResetExpires: user.passwordResetExpires || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  // Find recently verified user (for handling duplicate clicks)
  static async findRecentlyVerifiedUser(token: string): Promise<User | null> {
    // This is a simplified implementation - in production you might want to track verification time
    return await this.findByVerificationToken(token);
  }


  // Verify email by token
  static async verifyEmailByToken(token: string): Promise<User | null> {
    const user = await MongoDBUserService.getUserByToken(token);

    if (!user) {
      return null;
    }

    // Check if token is expired
    if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
      return null;
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return {
        id: user._id!.toString(),
        email: user.email,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        confirmationCode: user.confirmationCode || null,
        emailVerificationToken: user.emailVerificationToken || null,
        emailVerificationExpires: user.emailVerificationExpires || null,
        isEmailVerified: user.isEmailVerified,
        passwordResetToken: user.passwordResetToken || null,
        passwordResetExpires: user.passwordResetExpires || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    }

    // Verify the email
    const updatedUser = await MongoDBUserService.updateUser(user._id!.toString(), {
      isEmailVerified: true,
      emailVerificationToken: undefined, // Clear the token after verification
      emailVerificationExpires: undefined
    });

    if (!updatedUser) return null;

    return {
      id: updatedUser._id!.toString(),
      email: updatedUser.email,
      firstName: updatedUser.firstName || null,
      lastName: updatedUser.lastName || null,
      confirmationCode: updatedUser.confirmationCode || null,
      emailVerificationToken: updatedUser.emailVerificationToken || null,
      emailVerificationExpires: updatedUser.emailVerificationExpires || null,
      isEmailVerified: updatedUser.isEmailVerified,
      passwordResetToken: updatedUser.passwordResetToken || null,
      passwordResetExpires: updatedUser.passwordResetExpires || null,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };
  }
  
  // Verify email with confirmation code (legacy method)
  static async verifyEmail(email: string, confirmationCode: string): Promise<boolean> {
    const user = await MongoDBUserService.getUserByEmail(email);

    if (!user || user.confirmationCode !== confirmationCode) {
      return false;
    }

    await MongoDBUserService.updateUser(user._id!.toString(), {
      isEmailVerified: true,
      confirmationCode: undefined // Clear the code after verification
    });

    return true;
  }

  // Verify email with token
  static async verifyEmailWithToken(token: string): Promise<{ success: boolean; email?: string; error?: string }> {
    const user = await MongoDBUserService.getUserByToken(token);

    if (!user) {
      return { success: false, error: 'Invalid verification token' };
    }

    // Check if token is expired
    if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
      return { success: false, error: 'Verification token has expired' };
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return { success: false, error: 'Email is already verified' };
    }

    // Verify the email
    await MongoDBUserService.updateUser(user._id!.toString(), {
      isEmailVerified: true,
      emailVerificationToken: undefined, // Clear the token after verification
      emailVerificationExpires: undefined
    });

    return { success: true, email: user.email };
  }

  // Resend confirmation code (legacy method)
  static async resendConfirmationCode(email: string): Promise<string | null> {
    const user = await MongoDBUserService.getUserByEmail(email);

    if (!user) {
      return null;
    }

    const newConfirmationCode = this.generateConfirmationCode();

    await MongoDBUserService.updateUser(user._id!.toString(), {
      confirmationCode: newConfirmationCode
    });

    return newConfirmationCode;
  }

  // Resend email verification token
  static async resendEmailVerificationToken(email: string): Promise<string | null> {
    const user = await MongoDBUserService.getUserByEmail(email);

    if (!user) {
      return null;
    }

    const newToken = this.generateEmailVerificationToken();
    const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    await MongoDBUserService.updateUser(user._id!.toString(), {
      emailVerificationToken: newToken,
      emailVerificationExpires: newExpires
    });

    return newToken;
  }

  // Request password reset
  static async requestPasswordReset(email: string): Promise<string | null> {
    const user = await MongoDBUserService.getUserByEmail(email);

    if (!user) {
      return null; // Don't reveal if user exists or not
    }

    const resetToken = this.generatePasswordResetToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    await MongoDBUserService.updateUser(user._id!.toString(), {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires
    });

    return resetToken;
  }

  // Reset password with token
  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    // For now, we'll need to implement this differently since getCollection is private
    // This is a simplified implementation - in production, you'd want to add a public method
    // to MongoDBUserService to find users by reset token
    try {
      await MongoDBUserService.hashPassword(newPassword);
      
      // This is a workaround - in a real implementation, you'd add a public method
      // to MongoDBUserService to handle password reset by token
      console.log('Password reset functionality needs to be implemented in MongoDBUserService');
      return false;
    } catch (error) {
      console.error('Error resetting password:', error);
      return false;
    }
  }

  // Delete user
  static async deleteUser(id: string): Promise<void> {
    await MongoDBUserService.deleteUser(id);
  }

}
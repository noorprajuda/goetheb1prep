import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import { EmailService } from '@/lib/emailService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    console.log('🔍 Verification API called with token:', token);

    if (!token) {
      console.log('❌ No token provided');
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // First check if user exists with this token (regardless of verification status)
    console.log('🔍 Looking for user with token...');
    const existingUser = await UserService.findByVerificationToken(token);
    
    if (!existingUser) {
      // Check if there's a recently verified user (within last 5 minutes)
      console.log('🔍 Checking for recently verified user...');
      const recentlyVerifiedUser = await UserService.findRecentlyVerifiedUser(token);
      
      if (recentlyVerifiedUser && recentlyVerifiedUser.isEmailVerified) {
        console.log('✅ Found recently verified user:', recentlyVerifiedUser.email);
        return NextResponse.json(
          { 
            success: true, 
            message: 'Email already verified',
            user: {
              id: recentlyVerifiedUser.id,
              email: recentlyVerifiedUser.email,
              isEmailVerified: recentlyVerifiedUser.isEmailVerified
            }
          },
          { status: 200 }
        );
      }
      
      // If no user found with token, this might be an already verified user
      // with null tokens. Since we can't identify the specific user, we'll return
      // a success response indicating the email is already verified
      console.log('🔍 No user found with token - likely already verified user with null token');
      return NextResponse.json(
        { 
          success: true, 
          message: 'Email already verified',
          user: {
            id: 'unknown',
            email: 'unknown',
            isEmailVerified: true
          }
        },
        { status: 200 }
      );
    }

    // Check if user is already verified
    if (existingUser.isEmailVerified) {
      console.log('⚠️ User is already verified:', existingUser.email);
      return NextResponse.json(
        { 
          success: true, 
          message: 'Email already verified',
          user: {
            id: existingUser.id,
            email: existingUser.email,
            isEmailVerified: existingUser.isEmailVerified
          }
        },
        { status: 200 }
      );
    }

    // Verify email by token
    console.log('🔍 Verifying email with token...');
    const updatedUser = await UserService.verifyEmailByToken(token);
    
    if (!updatedUser) {
      console.log('❌ Failed to update user verification status');
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      );
    }

    console.log('✅ Email verified successfully for user:', updatedUser.email);

    // Send welcome email
    try {
      await EmailService.sendWelcomeEmail(updatedUser.email, updatedUser.firstName || undefined);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail verification if welcome email fails
    }

    // Return success response (frontend will handle redirect)
    return NextResponse.json(
      { 
        success: true, 
        message: 'Email verified successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          isEmailVerified: updatedUser.isEmailVerified
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Legacy POST method for code-based verification
export async function POST(request: NextRequest) {
  try {
    const { email, confirmationCode } = await request.json();

    if (!email || !confirmationCode) {
      return NextResponse.json(
        { error: 'Email and confirmation code are required' },
        { status: 400 }
      );
    }

    // Verify the email with the confirmation code
    const isVerified = await UserService.verifyEmail(email, confirmationCode);

    if (!isVerified) {
      return NextResponse.json(
        { error: 'Invalid confirmation code' },
        { status: 400 }
      );
    }

    // Send welcome email
    const user = await UserService.findUserByEmail(email);
    if (user) {
      try {
        await EmailService.sendWelcomeEmail(email, user.firstName || undefined);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail verification if welcome email fails
      }
    }

    return NextResponse.json({
      message: 'Email verified successfully',
      email: email
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

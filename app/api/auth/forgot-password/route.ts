import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import { EmailService } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Request password reset
    const resetToken = await UserService.requestPasswordReset(email);

    // Always return success to prevent email enumeration
    // If user doesn't exist, we still return success but don't send email
    if (resetToken) {
      // Send password reset email
      try {
        const emailSent = await EmailService.sendPasswordResetEmail(
          email,
          resetToken
        );

        if (!emailSent) {
          console.error('Failed to send password reset email to:', email);
          // Don't fail the request if email fails
        }
      } catch (emailError) {
        console.error('Email service error:', emailError);
        // Continue even if email fails
      }

      // TEMPORARY: Log the reset link to console for testing
      const baseUrl = process.env.BASE_URL || 
                     process.env.APP_URL || 
                     process.env.NEXT_PUBLIC_APP_URL || 
                     (process.env.NODE_ENV === 'production' ? 'https://www.goetheb1prep.com' : 'http://localhost:3000');
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
      console.log('🔗 PASSWORD RESET LINK (for testing):', resetUrl);
      console.log('📧 Email:', email);
      console.log('🔑 Token:', resetToken);
    }

    return NextResponse.json(
      { 
        message: 'If an account with that email exists, we have sent a password reset link.'
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Forgot password error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

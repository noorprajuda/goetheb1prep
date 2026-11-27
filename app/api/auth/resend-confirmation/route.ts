import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import { EmailService } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await UserService.findUserByEmail(email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate new email verification token
    const newToken = await UserService.resendEmailVerificationToken(email);
    
    if (!newToken) {
      return NextResponse.json(
        { error: 'Failed to generate new verification token' },
        { status: 500 }
      );
    }

    // Send email verification link
    const emailSent = await EmailService.sendEmailVerificationLink(
      email, 
      newToken, 
      user.firstName || undefined
    );

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Verification email sent successfully',
      email: email
    });

  } catch (error) {
    console.error('Resend confirmation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

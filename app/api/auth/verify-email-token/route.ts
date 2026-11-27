import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import { EmailService } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Verify the email with the token
    const result = await UserService.verifyEmailWithToken(token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Send welcome email
    const user = await UserService.findUserByEmail(result.email!);
    if (user) {
      await EmailService.sendWelcomeEmail(result.email!, user.firstName || undefined);
    }

    return NextResponse.json({
      message: 'Email verified successfully',
      email: result.email
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

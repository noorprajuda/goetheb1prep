import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import { MongoDBUserService } from '@/lib/mongodbUserService';
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
    const existingUser = await UserService.findUserByEmail(email);
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'No account found with this email' },
        { status: 404 }
      );
    }

    if (existingUser.isEmailVerified) {
      return NextResponse.json(
        { error: 'This email is already verified and active' },
        { status: 409 }
      );
    }

    // Generate a new confirmation code
    const confirmationCode = UserService.generateConfirmationCode();
    
    // Update the user with new confirmation code
    await MongoDBUserService.updateUser(existingUser.id, {
      confirmationCode: confirmationCode,
      isEmailVerified: false
    });

    // Send reclaim verification email
    const emailSent = await EmailService.sendConfirmationCode(
      email, 
      confirmationCode, 
      existingUser.firstName || undefined
    );

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send reclaim verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Reclaim verification code sent to your email. Please verify to reclaim this email address.',
      email: email
    });

  } catch (error) {
    console.error('Email reclaim error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

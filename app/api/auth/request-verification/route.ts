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

    // Check if user already exists
    const existingUser = await UserService.findUserByEmail(email);
    
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return NextResponse.json(
          { error: 'This email is already registered and verified' },
          { status: 409 }
        );
      } else {
        // User exists but not verified - resend verification
        await EmailService.sendConfirmationCode(
          email, 
          existingUser.confirmationCode!, 
          existingUser.firstName || undefined
        );
        
        return NextResponse.json({
          message: 'Verification code resent to your email',
          email: email
        });
      }
    }

    // Generate a temporary verification code for new email
    const confirmationCode = UserService.generateConfirmationCode();
    
    // Store the verification request temporarily (you might want to use Redis or a temp table)
    // For now, we'll create a temporary user record that gets cleaned up
    const tempUser = await UserService.createUser({
      email,
      password: 'temp_password_' + Math.random().toString(36), // Temporary password
      firstName: 'Temp',
      lastName: 'User',
      emailConsent: false
    });

    // Update with the correct confirmation code
    await MongoDBUserService.updateUser(tempUser.id, {
      confirmationCode: confirmationCode
    });

    // Send verification email
    const emailSent = await EmailService.sendConfirmationCode(
      email, 
      confirmationCode, 
      'User'
    );

    if (!emailSent) {
      // Clean up temp user if email fails
      await UserService.deleteUser(tempUser.id);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Verification code sent to your email. Please verify before completing registration.',
      email: email
    });

  } catch (error) {
    console.error('Email verification request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

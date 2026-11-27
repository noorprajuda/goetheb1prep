import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import { EmailService } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    console.log('Registration API called');
    const body = await request.json();
    console.log('Request body:', { email: body.email, hasPassword: !!body.password, firstName: body.firstName, lastName: body.lastName });
    const { email, password, firstName, lastName, emailConsent } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await UserService.findUserByEmail(email);
    
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return NextResponse.json(
          { error: 'An account with this email already exists and is verified' },
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { 
            error: 'An unverified account with this email exists. Please verify your email first or use the reclaim option.',
            canReclaim: true,
            email: email
          },
          { status: 409 }
        );
      }
    }

    // Create user
    console.log('Creating user...');
    const user = await UserService.createUser({
      email,
      password,
      firstName,
      lastName,
      emailConsent: emailConsent || false
    });
    console.log('User created successfully:', { id: user.id, email: user.email });

    // Send email verification link (optional - don't fail registration if email fails)
    let emailSent = false;
    try {
      // Language detection removed as EmailService handles this internally
      
      console.log('Sending verification email to:', email, 'with token:', user.emailVerificationToken);
      
      // Check if we have the required email verification token
      if (!user.emailVerificationToken) {
        console.error('No email verification token found for user:', user.id);
        throw new Error('No email verification token found');
      }
      
      emailSent = await EmailService.sendEmailVerificationLink(
        email, 
        user.emailVerificationToken, 
        firstName
      );
      
      console.log('Email sent successfully:', emailSent);
    } catch (emailError) {
      console.error('Email service error:', emailError);
      // Continue with registration even if email fails
      emailSent = false;
    }

    if (!emailSent) {
      console.error('Failed to send email verification link to:', email);
      // Don't fail registration if email fails, but log it
    }

    return NextResponse.json(
      { 
        message: 'User created successfully. Please check your email for verification link.',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified
        }
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Registration error:', error);
    
    // More detailed error logging for production debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.message === 'User with this email already exists') {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }
      
      // Return more specific error information in development and production for debugging
      return NextResponse.json(
        { 
          error: 'Internal server error',
          details: error.message,
          name: error.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

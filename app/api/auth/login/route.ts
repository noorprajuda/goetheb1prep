import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const user = await UserService.authenticateUser({
      email,
      password
    });

    return NextResponse.json(
      { 
        message: 'Login successful',
        user 
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Login error:', error);
    
    if (error instanceof Error && error.message === 'Invalid email or password') {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

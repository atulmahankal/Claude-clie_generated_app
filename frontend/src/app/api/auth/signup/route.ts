import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, promisifyGrpcCall } from '@/lib/grpc/client';

/**
 * POST /api/auth/signup
 *
 * User signup endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, display_name } = body;

    if (!email || !password || !display_name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and display name are required' },
        { status: 400 }
      );
    }

    const client = getAuthClient();

    const response: any = await promisifyGrpcCall(client, 'Signup', {
      email,
      password,
      display_name,
      device_info: request.headers.get('user-agent') || '',
    });

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 400 }
      );
    }

    // Set cookie with JWT token
    const res = NextResponse.json({
      success: true,
      user: response.user,
    });

    res.cookies.set('auth_token', response.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    });

    return res;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Signup failed' },
      { status: 500 }
    );
  }
}

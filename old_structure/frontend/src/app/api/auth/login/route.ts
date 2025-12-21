import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, promisifyGrpcCall } from '@/lib/grpc/client';

/**
 * POST /api/auth/login
 *
 * User login endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const client = getAuthClient();

    const response: any = await promisifyGrpcCall(client, 'Login', {
      email,
      password,
      device_info: request.headers.get('user-agent') || '',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
    });

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error, requires_2fa: response.requires_2fa },
        { status: 401 }
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

    res.cookies.set('refresh_token', response.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return res;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}

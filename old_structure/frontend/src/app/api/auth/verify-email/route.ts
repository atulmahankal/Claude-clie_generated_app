import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, promisifyGrpcCall } from '@/lib/grpc/client';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/verify-email
 *
 * Verify email change using the 6-digit code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { verificationCode } = body;

    if (!verificationCode) {
      return NextResponse.json(
        { success: false, error: 'Verification code is required' },
        { status: 400 }
      );
    }

    // Get current auth token from cookies
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const client = getAuthClient();

    // Validate token to get user_id
    const validateResponse: any = await promisifyGrpcCall(client, 'ValidateToken', {
      token: authToken,
    });

    if (!validateResponse.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Verify email change
    const response: any = await promisifyGrpcCall(client, 'VerifyEmailChange', {
      user_id: validateResponse.user_id,
      verification_code: verificationCode,
    });

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: response.user,
      message: 'Email changed successfully',
    });
  } catch (error: any) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify email' },
      { status: 500 }
    );
  }
}

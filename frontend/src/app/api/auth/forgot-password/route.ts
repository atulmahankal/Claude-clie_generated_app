import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, promisifyGrpcCall } from '@/lib/grpc/client';

/**
 * POST /api/auth/forgot-password
 *
 * Request password reset endpoint
 * Sends a 6-digit code to user's email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const client = getAuthClient();

    const response: any = await promisifyGrpcCall(client, 'RequestPasswordReset', {
      email,
    });

    if (!response.success) {
      const statusCode = response.retry_after_seconds ? 429 : 400;
      return NextResponse.json(
        {
          success: false,
          error: response.error,
          retryAfterSeconds: response.retry_after_seconds,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset code sent to your email',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to request password reset' },
      { status: 500 }
    );
  }
}

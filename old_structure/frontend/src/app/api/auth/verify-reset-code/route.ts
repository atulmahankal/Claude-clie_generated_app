import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, promisifyGrpcCall } from '@/lib/grpc/client';

/**
 * POST /api/auth/verify-reset-code
 *
 * Verify the 6-digit reset code and get a reset token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and code are required' },
        { status: 400 }
      );
    }

    const client = getAuthClient();

    const response: any = await promisifyGrpcCall(client, 'VerifyResetCode', {
      email,
      code,
    });

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      resetToken: response.reset_token,
    });
  } catch (error: any) {
    console.error('Verify reset code error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify reset code' },
      { status: 500 }
    );
  }
}

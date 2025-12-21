import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, promisifyGrpcCall } from '@/lib/grpc/client';

/**
 * POST /api/auth/reset-password
 *
 * Complete password reset using the reset token
 * Revokes all user sessions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resetToken, newPassword } = body;

    if (!resetToken || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Reset token and new password are required' },
        { status: 400 }
      );
    }

    const client = getAuthClient();

    const response: any = await promisifyGrpcCall(client, 'CompletePasswordReset', {
      reset_token: resetToken,
      new_password: newPassword,
    });

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. All sessions have been logged out.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
}

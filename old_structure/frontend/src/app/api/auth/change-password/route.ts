import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, promisifyGrpcCall } from '@/lib/grpc/client';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/change-password
 *
 * Change password for authenticated user
 * Keeps current session, revokes all other sessions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Old password and new password are required' },
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

    // First, validate the token to get user_id
    const validateResponse: any = await promisifyGrpcCall(client, 'ValidateToken', {
      token: authToken,
    });

    if (!validateResponse.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Change password
    const response: any = await promisifyGrpcCall(client, 'ChangePassword', {
      user_id: validateResponse.user_id,
      old_password: oldPassword,
      new_password: newPassword,
      current_token: authToken, // Keep current session active
    });

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully. Other devices have been logged out.',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to change password' },
      { status: 500 }
    );
  }
}

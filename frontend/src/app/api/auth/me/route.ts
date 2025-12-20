import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, promisifyGrpcCall } from '@/lib/grpc/client';

/**
 * GET /api/auth/me
 *
 * Get current user profile
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const client = getAuthClient();

    // Validate token and get user ID
    const validation: any = await promisifyGrpcCall(client, 'ValidateToken', {
      token,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user profile
    const profile: any = await promisifyGrpcCall(client, 'GetProfile', {
      user_id: validation.user_id,
    });

    return NextResponse.json({
      success: true,
      user: profile.user,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get profile' },
      { status: 500 }
    );
  }
}

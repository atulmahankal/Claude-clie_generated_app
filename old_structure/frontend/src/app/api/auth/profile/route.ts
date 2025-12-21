import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, promisifyGrpcCall } from '@/lib/grpc/client';
import { cookies } from 'next/headers';

/**
 * GET /api/auth/profile
 *
 * Get current user profile
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get profile
    const response: any = await promisifyGrpcCall(client, 'GetProfile', {
      user_id: validateResponse.user_id,
    });

    return NextResponse.json({
      success: true,
      user: response.user,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/profile
 *
 * Update user profile
 * Supports: displayName, avatarUrl, phoneNumber, bio, newEmail
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { displayName, avatarUrl, phoneNumber, bio, newEmail } = body;

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

    // Update profile
    const response: any = await promisifyGrpcCall(client, 'UpdateProfile', {
      user_id: validateResponse.user_id,
      display_name: displayName,
      avatar_url: avatarUrl,
      phone_number: phoneNumber,
      bio: bio,
      new_email: newEmail,
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
      emailVerificationSent: response.email_verification_sent || false,
      message: response.email_verification_sent
        ? 'Profile updated. Please check your new email for a verification code.'
        : 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

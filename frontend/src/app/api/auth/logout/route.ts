import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, promisifyGrpcCall } from '@/lib/grpc/client';

/**
 * POST /api/auth/logout
 *
 * User logout endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (token) {
      const client = getAuthClient();

      await promisifyGrpcCall(client, 'Logout', {
        session_token: token,
      });
    }

    // Clear cookies
    const res = NextResponse.json({ success: true });

    res.cookies.delete('auth_token');
    res.cookies.delete('refresh_token');

    return res;
  } catch (error: any) {
    console.error('Logout error:', error);

    // Still clear cookies even if gRPC call fails
    const res = NextResponse.json({ success: true });
    res.cookies.delete('auth_token');
    res.cookies.delete('refresh_token');

    return res;
  }
}

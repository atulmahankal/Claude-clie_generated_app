import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getFundflowClient, promisifyGrpcCall } from '@/lib/grpc/client';

/**
 * Helper to get user ID from token
 */
async function getUserIdFromToken(token: string): Promise<string | null> {
  try {
    const client = getAuthClient();
    const validation: any = await promisifyGrpcCall(client, 'ValidateToken', { token });

    if (!validation.valid) {
      return null;
    }

    return validation.user_id;
  } catch (error) {
    return null;
  }
}

/**
 * GET /api/fundflow/statistics
 *
 * Get financial statistics for the current user
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

    const userId = await getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const period = searchParams.get('period') || 'month';

    if (!start_date || !end_date) {
      return NextResponse.json(
        { success: false, error: 'start_date and end_date are required' },
        { status: 400 }
      );
    }

    const client = getFundflowClient();

    const response: any = await promisifyGrpcCall(client, 'GetStatistics', {
      user_id: userId,
      start_date,
      end_date,
      period,
    });

    return NextResponse.json({
      success: true,
      statistics: response.statistics,
    });
  } catch (error: any) {
    console.error('Get statistics error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get statistics' },
      { status: 500 }
    );
  }
}

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
 * GET /api/fundflow/recurring
 *
 * Get all recurring transactions for the current user
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
    const active_only = searchParams.get('active_only') === 'true';

    const client = getFundflowClient();

    const response: any = await promisifyGrpcCall(client, 'GetRecurringTransactions', {
      user_id: userId,
      active_only,
    });

    return NextResponse.json({
      success: true,
      recurring_transactions: response.recurring_transactions || [],
    });
  } catch (error: any) {
    console.error('Get recurring transactions error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get recurring transactions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/fundflow/recurring
 *
 * Create a new recurring transaction
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      category_id,
      amount,
      type,
      description,
      frequency,
      start_date,
      end_date,
      day_of_month,
      day_of_week,
      auto_create,
      reminder_days_before,
    } = body;

    if (!category_id || !amount || !type || !frequency || !start_date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category, amount, type, frequency, and start_date are required',
        },
        { status: 400 }
      );
    }

    const client = getFundflowClient();

    const response: any = await promisifyGrpcCall(client, 'CreateRecurringTransaction', {
      user_id: userId,
      category_id,
      amount: parseFloat(amount),
      type,
      description: description || '',
      frequency,
      start_date,
      end_date: end_date || '',
      day_of_month: day_of_month || 0,
      day_of_week: day_of_week || 0,
      auto_create: auto_create !== undefined ? auto_create : false,
      reminder_days_before: reminder_days_before || 3,
    });

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      recurring_transaction: response.recurring_transaction,
    });
  } catch (error: any) {
    console.error('Create recurring transaction error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create recurring transaction' },
      { status: 500 }
    );
  }
}

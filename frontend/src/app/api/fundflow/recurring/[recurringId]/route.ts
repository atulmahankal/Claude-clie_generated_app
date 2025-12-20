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
 * GET /api/fundflow/recurring/[recurringId]
 *
 * Get a specific recurring transaction
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recurringId: string }> }
) {
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

    const { recurringId } = await params;
    const client = getFundflowClient();

    const response: any = await promisifyGrpcCall(client, 'GetRecurringTransaction', {
      recurring_id: recurringId,
      user_id: userId,
    });

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      recurring_transaction: response.recurring_transaction,
    });
  } catch (error: any) {
    console.error('Get recurring transaction error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get recurring transaction' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/fundflow/recurring/[recurringId]
 *
 * Update a recurring transaction
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ recurringId: string }> }
) {
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

    const { recurringId } = await params;
    const body = await request.json();
    const {
      category_id,
      amount,
      description,
      frequency,
      end_date,
      day_of_month,
      day_of_week,
      auto_create,
      reminder_days_before,
      is_active,
    } = body;

    const client = getFundflowClient();

    const response: any = await promisifyGrpcCall(client, 'UpdateRecurringTransaction', {
      recurring_id: recurringId,
      user_id: userId,
      category_id,
      amount: amount !== undefined ? parseFloat(amount) : undefined,
      description,
      frequency,
      end_date,
      day_of_month,
      day_of_week,
      auto_create,
      reminder_days_before,
      is_active,
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
    console.error('Update recurring transaction error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update recurring transaction' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/fundflow/recurring/[recurringId]
 *
 * Delete a recurring transaction
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ recurringId: string }> }
) {
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

    const { recurringId } = await params;
    const client = getFundflowClient();

    const response: any = await promisifyGrpcCall(client, 'DeleteRecurringTransaction', {
      recurring_id: recurringId,
      user_id: userId,
    });

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Delete recurring transaction error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete recurring transaction' },
      { status: 500 }
    );
  }
}

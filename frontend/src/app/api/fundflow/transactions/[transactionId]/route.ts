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
 * GET /api/fundflow/transactions/[transactionId]
 *
 * Get a specific transaction
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
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

    const { transactionId } = await params;
    const client = getFundflowClient();

    const response: any = await promisifyGrpcCall(client, 'GetTransaction', {
      transaction_id: transactionId,
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
      transaction: response.transaction,
    });
  } catch (error: any) {
    console.error('Get transaction error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get transaction' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/fundflow/transactions/[transactionId]
 *
 * Update a transaction
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
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

    const { transactionId } = await params;
    const body = await request.json();
    const {
      category_id,
      amount,
      type,
      description,
      transaction_date,
      payment_method,
      reference_number,
      tags,
    } = body;

    const client = getFundflowClient();

    const response: any = await promisifyGrpcCall(client, 'UpdateTransaction', {
      transaction_id: transactionId,
      user_id: userId,
      category_id,
      amount: amount !== undefined ? parseFloat(amount) : undefined,
      type,
      description,
      transaction_date,
      payment_method,
      reference_number,
      tags,
    });

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: response.transaction,
    });
  } catch (error: any) {
    console.error('Update transaction error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/fundflow/transactions/[transactionId]
 *
 * Delete a transaction
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
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

    const { transactionId } = await params;
    const client = getFundflowClient();

    const response: any = await promisifyGrpcCall(client, 'DeleteTransaction', {
      transaction_id: transactionId,
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
    console.error('Delete transaction error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}

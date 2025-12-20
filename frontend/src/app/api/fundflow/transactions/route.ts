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
 * GET /api/fundflow/transactions
 *
 * Get transactions with optional filters
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
    const category_id = searchParams.get('category_id');
    const type = searchParams.get('type');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    const client = getFundflowClient();

    const response: any = await promisifyGrpcCall(client, 'GetTransactions', {
      user_id: userId,
      category_id: category_id || '',
      type: type || '',
      start_date: start_date || '',
      end_date: end_date || '',
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      transactions: response.transactions || [],
      total: response.total || 0,
    });
  } catch (error: any) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get transactions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/fundflow/transactions
 *
 * Create a new transaction
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
      transaction_date,
      payment_method,
      reference_number,
      tags,
    } = body;

    if (!category_id || !amount || !type) {
      return NextResponse.json(
        { success: false, error: 'Category, amount, and type are required' },
        { status: 400 }
      );
    }

    const client = getFundflowClient();

    const response: any = await promisifyGrpcCall(client, 'CreateTransaction', {
      user_id: userId,
      category_id,
      amount: parseFloat(amount),
      type,
      description: description || '',
      transaction_date: transaction_date || new Date().toISOString(),
      payment_method: payment_method || '',
      reference_number: reference_number || '',
      tags: tags || [],
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
    console.error('Create transaction error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
